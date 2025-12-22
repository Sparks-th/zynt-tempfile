import { ObjectId } from "mongodb";
import { getFileCollection, FileDocument } from "../models/file.model";
import { findDuplicateFile } from "./deduplication.service";
import { UploadResult } from "./upload.service";
import { generateUniqueFileId } from "../../../utils/id-generator";
import path from "path";

interface CreateFileOptions {
  uploadResult: UploadResult;
  isTemporary: boolean;
  expiresAt?: Date | null;
}

async function fileIdExists(fileId: string): Promise<boolean> {
  const collection = getFileCollection();
  const doc = await collection.findOne({ fileId });
  return doc !== null;
}

export async function createFileDocument(
  options: CreateFileOptions
): Promise<FileDocument> {
  const { uploadResult, isTemporary, expiresAt } = options;

  // Check for duplicates
  const duplicate = await findDuplicateFile(uploadResult.sha256);
  if (duplicate) {
    // File is a duplicate - create new metadata entry but mark as duplicate
    const collection = getFileCollection();
    const fileId = await generateUniqueFileId(fileIdExists);
    const extension = path.extname(uploadResult.originalName).toLowerCase();

    const fileDoc: FileDocument = {
      fileId,
      extension,
      originalName: uploadResult.originalName,
      storedName: duplicate.storedName, // Reuse existing stored file
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      sha256: uploadResult.sha256,
      isTemporary,
      expiresAt: expiresAt || null,
      downloadCount: 0,
      isDuplicate: true, // Mark as duplicate
      createdAt: new Date(),
    };

    const result = await collection.insertOne(fileDoc);
    return { ...fileDoc, _id: result.insertedId };
  }

  const collection = getFileCollection();

  // Generate unique 5-character ID
  const fileId = await generateUniqueFileId(fileIdExists);

  // Extract file extension
  const extension = path.extname(uploadResult.originalName).toLowerCase();

  const fileDoc: FileDocument = {
    fileId,
    extension,
    originalName: uploadResult.originalName,
    storedName: uploadResult.storedName,
    mimeType: uploadResult.mimeType,
    size: uploadResult.size,
    sha256: uploadResult.sha256,
    isTemporary,
    expiresAt: expiresAt || null,
    downloadCount: 0,
    isDuplicate: false, // Original upload
    createdAt: new Date(),
  };

  const result = await collection.insertOne(fileDoc);
  return { ...fileDoc, _id: result.insertedId };
}

export async function getFileByFileId(
  fileId: string
): Promise<FileDocument | null> {
  const collection = getFileCollection();
  return await collection.findOne({ fileId });
}

export async function getFileByStoredName(
  storedName: string
): Promise<FileDocument | null> {
  const collection = getFileCollection();
  return await collection.findOne({ storedName });
}

export async function incrementDownloadCount(
  fileId: string
): Promise<void> {
  const collection = getFileCollection();
  await collection.updateOne(
    { fileId },
    { $inc: { downloadCount: 1 } }
  );
}

export async function deleteFileById(
  fileId: string
): Promise<FileDocument | null> {
  const collection = getFileCollection();
  const file = await collection.findOne({ fileId });
  
  if (file) {
    await collection.deleteOne({ fileId });
  }
  
  return file;
}

export async function expireFile(fileId: string): Promise<boolean> {
  const collection = getFileCollection();
  const result = await collection.updateOne(
    { fileId },
    { $set: { expiresAt: new Date() } }
  );
  
  return result.modifiedCount > 0;
}
