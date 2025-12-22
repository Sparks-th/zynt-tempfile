import { getFileCollection } from "../models/file.model";
import { FileDocument } from "../models/file.model";

export async function findDuplicateFile(
  sha256: string
): Promise<FileDocument | null> {
  const collection = getFileCollection();
  const existing = await collection.findOne({ sha256 });
  return existing;
}

export async function shouldSkipUpload(sha256: string): Promise<boolean> {
  const duplicate = await findDuplicateFile(sha256);
  return duplicate !== null;
}
