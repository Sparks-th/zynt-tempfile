import { getFileCollection, FileDocument } from "../../files/models/file.model";
import { deleteFromS3 } from "../../../storage/storage.service";
import { Sort } from "mongodb";

interface FileFilters {
  isTemporary?: boolean;
  isDuplicate?: boolean;
  expired?: boolean;
  minSize?: number;
  maxSize?: number;
  startDate?: Date;
  endDate?: Date;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getFiles(
  filters: FileFilters,
  pagination: PaginationOptions
) {
  const collection = getFileCollection();
  const query: any = {};

  // Apply filters
  if (filters.isTemporary !== undefined) {
    query.isTemporary = filters.isTemporary;
  }

  if (filters.isDuplicate !== undefined) {
    query.isDuplicate = filters.isDuplicate;
  }

  if (filters.expired !== undefined) {
    if (filters.expired) {
      query.expiresAt = { $lte: new Date() };
    } else {
      query.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ];
    }
  }

  if (filters.minSize !== undefined || filters.maxSize !== undefined) {
    query.size = {};
    if (filters.minSize !== undefined) {
      query.size.$gte = filters.minSize;
    }
    if (filters.maxSize !== undefined) {
      query.size.$lte = filters.maxSize;
    }
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
    }
  }

  // Build sort
  const sortField = pagination.sortBy || "createdAt";
  const sortDirection = pagination.sortOrder === "asc" ? 1 : -1;
  const sort: Sort = { [sortField]: sortDirection };

  // Execute query
  const skip = (pagination.page - 1) * pagination.limit;
  const [files, total] = await Promise.all([
    collection.find(query).sort(sort).skip(skip).limit(pagination.limit).toArray(),
    collection.countDocuments(query),
  ]);

  return {
    files,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  const collection = getFileCollection();
  const file = await collection.findOne({ fileId });

  if (!file) {
    throw new Error("File not found");
  }

  // Check if other files use the same stored file (duplicates)
  const duplicateCount = await collection.countDocuments({
    storedName: file.storedName,
    fileId: { $ne: fileId },
  });

  // Only delete from S3 if no other files reference it
  if (duplicateCount === 0) {
    try {
      await deleteFromS3(file.storedName);
    } catch (error) {
      // File might not exist in S3, continue with metadata deletion
    }
  }

  // Delete metadata
  await collection.deleteOne({ fileId });
}

export async function forceExpireFile(fileId: string): Promise<void> {
  const collection = getFileCollection();
  const result = await collection.updateOne(
    { fileId },
    { $set: { expiresAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    throw new Error("File not found");
  }
}
