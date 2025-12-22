import { Collection } from "mongodb";
import { FileDocument } from "./file.model";

export async function ensureFileIndexes(
  collection: Collection<FileDocument>
) {
  // Drop potentially conflicting indexes first
  try {
    await collection.dropIndex("fileId_1");
  } catch (error: any) {
    // Ignore if index doesn't exist
  }

  try {
    await collection.dropIndex("hash_1");
  } catch (error: any) {
    // Ignore if index doesn't exist
  }

  // Create indexes with proper names
  await collection.createIndex(
    { sha256: 1 },
    { unique: true, name: "uniq_sha256" }
  );

  await collection.createIndex(
    { fileId: 1 },
    { unique: true, name: "uniq_fileId" }
  );

  await collection.createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      partialFilterExpression: { expiresAt: { $type: "date" } },
      name: "ttl_expiresAt",
    }
  );

  // Index for analytics queries
  await collection.createIndex(
    { createdAt: -1 },
    { name: "idx_createdAt" }
  );

  await collection.createIndex(
    { isDuplicate: 1, createdAt: -1 },
    { name: "idx_isDuplicate_createdAt" }
  );

  await collection.createIndex(
    { downloadCount: -1 },
    { name: "idx_downloadCount" }
  );

  await collection.createIndex(
    { size: -1 },
    { name: "idx_size" }
  );
}
