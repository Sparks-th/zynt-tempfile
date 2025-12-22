import { getFileCollection } from "../../files/models/file.model";

export async function getOverviewStats() {
  const collection = getFileCollection();

  const stats = await collection.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalFiles: { $sum: 1 },
              totalSize: { $sum: "$size" },
              duplicateCount: {
                $sum: { $cond: ["$isDuplicate", 1, 0] },
              },
              tempCount: {
                $sum: { $cond: ["$isTemporary", 1, 0] },
              },
              permCount: {
                $sum: { $cond: ["$isTemporary", 0, 1] },
              },
            },
          },
        ],
      },
    },
  ]).toArray();

  const totals = stats[0]?.totals[0] || {
    totalFiles: 0,
    totalSize: 0,
    duplicateCount: 0,
    tempCount: 0,
    permCount: 0,
  };

  return {
    totalFiles: totals.totalFiles,
    totalStorageBytes: totals.totalSize,
    totalUploads: totals.totalFiles,
    duplicateUploads: totals.duplicateCount,
    duplicateRatio: totals.totalFiles > 0
      ? (totals.duplicateCount / totals.totalFiles).toFixed(4)
      : "0.0000",
    temporaryFiles: totals.tempCount,
    permanentFiles: totals.permCount,
  };
}

export async function getUploadStats(days: number = 30) {
  const collection = getFileCollection();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await collection.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        total: { $sum: 1 },
        unique: {
          $sum: { $cond: ["$isDuplicate", 0, 1] },
        },
        duplicate: {
          $sum: { $cond: ["$isDuplicate", 1, 0] },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]).toArray();

  return stats.map((stat) => ({
    date: stat._id,
    totalUploads: stat.total,
    uniqueUploads: stat.unique,
    duplicateUploads: stat.duplicate,
  }));
}

export async function getDownloadStats(days: number = 30) {
  const collection = getFileCollection();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await collection.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        downloadCount: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        totalDownloads: { $sum: "$downloadCount" },
        filesDownloaded: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]).toArray();

  return stats.map((stat) => ({
    date: stat._id,
    totalDownloads: stat.totalDownloads,
    filesDownloaded: stat.filesDownloaded,
  }));
}

export async function getTopStats(limit: number = 10) {
  const collection = getFileCollection();

  const [mostDownloaded, largest, mostDuplicated] = await Promise.all([
    // Most downloaded files
    collection
      .find({ downloadCount: { $gt: 0 } })
      .sort({ downloadCount: -1 })
      .limit(limit)
      .project({
        fileId: 1,
        originalName: 1,
        downloadCount: 1,
        size: 1,
        createdAt: 1,
      })
      .toArray(),

    // Largest files
    collection
      .find()
      .sort({ size: -1 })
      .limit(limit)
      .project({
        fileId: 1,
        originalName: 1,
        size: 1,
        createdAt: 1,
      })
      .toArray(),

    // Most duplicated files (by SHA-256)
    collection.aggregate([
      {
        $group: {
          _id: "$sha256",
          count: { $sum: 1 },
          originalName: { $first: "$originalName" },
          size: { $first: "$size" },
          storedName: { $first: "$storedName" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ]).toArray(),
  ]);

  return {
    mostDownloaded,
    largest,
    mostDuplicated: mostDuplicated.map((item) => ({
      sha256: item._id,
      duplicateCount: item.count,
      originalName: item.originalName,
      size: item.size,
      storedName: item.storedName,
    })),
  };
}
