import { FastifyRequest, FastifyReply } from "fastify";
import { getFileByFileId } from "../services/file.service";
import { ObjectId } from "mongodb";
import { getFileCollection } from "../models/file.model";

interface InfoParams {
  fileId: string;
}

export async function getFileInfoHandler(
  request: FastifyRequest<{ Params: InfoParams }>,
  reply: FastifyReply
) {
  try {
    let fileId = request.params.fileId;

    // Remove extension from fileId if present
    const dotIndex = fileId.indexOf('.');
    if (dotIndex !== -1) {
      fileId = fileId.substring(0, dotIndex);
    }

    let fileDoc = null;

    // Try to find by fileId first
    fileDoc = await getFileByFileId(fileId);

    // If not found, try to find by MongoDB ObjectId or storedName
    if (!fileDoc) {
      const collection = getFileCollection();

      // Check if it's a valid ObjectId
      if (ObjectId.isValid(fileId) && fileId.length === 24) {
        fileDoc = await collection.findOne({ _id: new ObjectId(fileId) });
      }

      // If still not found, try storedName
      if (!fileDoc) {
        fileDoc = await collection.findOne({ storedName: fileId });
      }
    }

    if (!fileDoc) {
      return reply.code(404).send({ error: "File not found" });
    }

    // Check if file has expired
    const now = new Date();
    const isExpired = fileDoc.expiresAt ? now > new Date(fileDoc.expiresAt) : false;

    if (isExpired) {
      return reply.code(410).send({
        error: "File has expired",
        expiresAt: fileDoc.expiresAt,
      });
    }

    // Return public metadata only
    return reply.code(200).send({
      id: fileDoc.fileId,
      originalName: fileDoc.originalName,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
      isTemporary: fileDoc.isTemporary,
      expiresAt: fileDoc.expiresAt,
      isExpired,
      downloadCount: fileDoc.downloadCount,
      createdAt: fileDoc.createdAt,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve file information",
    });
  }
}
