import { Upload } from "@aws-sdk/lib-storage";
import { 
  HeadObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command 
} from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, PUBLIC_URL, MAX_STORAGE_BYTES } from "./s3.client";
import { Readable } from "stream";

export async function getCurrentStorageUsage(): Promise<number> {
  let totalSize = 0;
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return totalSize;
}

export async function checkStorageQuota(fileSize: number): Promise<void> {
  const currentUsage = await getCurrentStorageUsage();
  
  if (currentUsage + fileSize > MAX_STORAGE_BYTES) {
    const usageGB = (currentUsage / (1024 * 1024 * 1024)).toFixed(2);
    const maxGB = (MAX_STORAGE_BYTES / (1024 * 1024 * 1024)).toFixed(2);
    throw new Error(
      `Storage quota exceeded. Current: ${usageGB}GB, Max: ${maxGB}GB`
    );
  }
}

export async function uploadToS3(
  key: string,
  stream: Readable,
  contentType: string,
  fileSize: number
): Promise<string> {
  // Check quota before upload
  await checkStorageQuota(fileSize);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
  });

  await upload.done();

  return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;
}

export async function getFromS3(key: string): Promise<Readable> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error("File not found in storage");
  }

  return response.Body as Readable;
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
}
