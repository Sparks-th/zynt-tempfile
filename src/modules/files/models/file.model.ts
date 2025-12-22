import { Collection, Db, ObjectId } from "mongodb";

export interface FileDocument {
  _id?: ObjectId;

  fileId: string; // 5-character short ID
  extension: string; // File extension (e.g., ".txt", ".jpg")
  originalName: string;
  storedName: string;

  mimeType: string;
  size: number;

  sha256: string;

  isTemporary: boolean;
  expiresAt?: Date | null;

  downloadCount: number;
  isDuplicate: boolean; // Track if this upload was a duplicate

  createdAt: Date;
}

let collection: Collection<FileDocument>;

export function initFileCollection(db: Db) {
  collection = db.collection<FileDocument>("files");
  return collection;
}

export function getFileCollection() {
  if (!collection) {
    throw new Error("File collection not initialized");
  }
  return collection;
}
