import { FastifyRequest, FastifyReply } from "fastify";
import { getFiles, deleteFile, forceExpireFile } from "../services/admin-file.service";

interface FileQueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  isTemporary?: string;
  isDuplicate?: string;
  expired?: string;
  minSize?: string;
  maxSize?: string;
  startDate?: string;
  endDate?: string;
}

interface FileIdParams {
  id: string;
}

export async function listFilesHandler(
  request: FastifyRequest<{ Querystring: FileQueryParams }>,
  reply: FastifyReply
) {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      isTemporary,
      isDuplicate,
      expired,
      minSize,
      maxSize,
      startDate,
      endDate,
    } = request.query;

    const filters: any = {};

    if (isTemporary !== undefined) {
      filters.isTemporary = isTemporary === "true";
    }

    if (isDuplicate !== undefined) {
      filters.isDuplicate = isDuplicate === "true";
    }

    if (expired !== undefined) {
      filters.expired = expired === "true";
    }

    if (minSize) {
      filters.minSize = parseInt(minSize, 10);
    }

    if (maxSize) {
      filters.maxSize = parseInt(maxSize, 10);
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await getFiles(filters, pagination);

    return reply.code(200).send({
      success: true,
      data: result.files.map((file) => ({
        fileId: file.fileId,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        isTemporary: file.isTemporary,
        isDuplicate: file.isDuplicate,
        downloadCount: file.downloadCount,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve files",
    });
  }
}

export async function deleteFileHandler(
  request: FastifyRequest<{ Params: FileIdParams }>,
  reply: FastifyReply
) {
  try {
    await deleteFile(request.params.id);

    return reply.code(200).send({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    request.log.error(error);

    if (error.message === "File not found") {
      return reply.code(404).send({ error: "File not found" });
    }

    return reply.code(500).send({
      error: "Failed to delete file",
    });
  }
}

export async function expireFileHandler(
  request: FastifyRequest<{ Params: FileIdParams }>,
  reply: FastifyReply
) {
  try {
    await forceExpireFile(request.params.id);

    return reply.code(200).send({
      success: true,
      message: "File expired successfully",
    });
  } catch (error: any) {
    request.log.error(error);

    if (error.message === "File not found") {
      return reply.code(404).send({ error: "File not found" });
    }

    return reply.code(500).send({
      error: "Failed to expire file",
    });
  }
}
