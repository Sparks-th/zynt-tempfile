import { createHash } from "crypto";
import { MultipartFile } from "@fastify/multipart";
import { PassThrough } from "stream";
import { uploadToS3 } from "../../../storage/storage.service";

const SIZE_LIMITS = {
  temporary: 200 * 1024 * 1024, // 200MB
  permanent: 50 * 1024 * 1024,  // 50MB
};

export interface UploadResult {
  storedName: string;
  sha256: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export async function streamUpload(
  file: MultipartFile,
  isTemporary: boolean
): Promise<UploadResult> {
  const maxSize = isTemporary ? SIZE_LIMITS.temporary : SIZE_LIMITS.permanent;

  let fileSize = 0;
  const hash = createHash("sha256");
  const passThrough = new PassThrough();

  // Create a promise to track the upload
  const uploadPromise = (async () => {
    const chunks: Buffer[] = [];

    for await (const chunk of file.file) {
      fileSize += chunk.length;

      if (fileSize > maxSize) {
        passThrough.destroy();
        throw new Error(
          `File exceeds ${isTemporary ? "200MB" : "50MB"} limit`
        );
      }

      hash.update(chunk);
      chunks.push(chunk);
      passThrough.write(chunk);
    }

    passThrough.end();

    const sha256 = hash.digest("hex");
    const extension = file.filename.includes('.') 
      ? file.filename.substring(file.filename.lastIndexOf('.'))
      : '';
    const storedName = `${sha256}${extension}`;

    // Upload to S3
    const buffer = Buffer.concat(chunks);
    const uploadStream = new PassThrough();
    uploadStream.end(buffer);

    await uploadToS3(storedName, uploadStream, file.mimetype, fileSize);

    return {
      storedName,
      sha256,
      size: fileSize,
      mimeType: file.mimetype,
      originalName: file.filename,
    };
  })();

  return await uploadPromise;
}

export async function getFilePath(storedName: string): Promise<string> {
  // For S3, we return the key (storedName) instead of a file path
  return storedName;
}
