import { getDB } from "./mongo";

export async function createIndexes(): Promise<void> {
  // Indexes are now created in ensureFileIndexes via connectDB
  // This function is kept for backward compatibility but does nothing
  console.log("Indexes are managed via file.indexes.ts");
}
