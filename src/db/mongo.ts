import { MongoClient, Db } from "mongodb";
import { initFileCollection } from "../modules/files/models/file.model";
import { ensureFileIndexes } from "../modules/files/models/file.indexes";

const uri = process.env.MONGO_URI || "";
const dbName = process.env.MONGO_DB || "zynt_tempfile";
const client = new MongoClient(uri);

let db: Db;

export async function connectDB() {
  await client.connect();
  console.log("MongoDB connected");

  db = client.db(dbName);

  const files = initFileCollection(db);
  await ensureFileIndexes(files);

  console.log("MongoDB indexes ensured");

  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
