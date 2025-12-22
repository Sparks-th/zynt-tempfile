import { FastifyRequest, FastifyReply } from "fastify";
import { getFileByFileId, incrementDownloadCount } from "../services/file.service";
import { getFromS3 } from "../../../storage/storage.service";

interface DownloadParams {
  fileId: string;
}

export async function downloadFileHandler(
  request: FastifyRequest<{ Params: DownloadParams }>,
  reply: FastifyReply
) {
  try {
    // Extract fileId from URL (remove extension if present)
    let fileId = request.params.fileId;
    
    // Remove extension from fileId if present
    const dotIndex = fileId.indexOf('.');
    if (dotIndex !== -1) {
      fileId = fileId.substring(0, dotIndex);
    }

    // Get file document from database
    const fileDoc = await getFileByFileId(fileId);

    if (!fileDoc) {
      return reply.code(404).send({ error: "File not found" });
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > new Date(fileDoc.expiresAt)) {
      return reply.code(410).send({ error: "File has expired" });
    }

    // Get file from S3
    const fileStream = await getFromS3(fileDoc.storedName);

    // Increment download count
    await incrementDownloadCount(fileId);

    // Set headers
    reply.header("Content-Type", fileDoc.mimeType);
    reply.header("Content-Disposition", `inline; filename="${fileDoc.originalName}"`);
    reply.header("Content-Length", fileDoc.size);

    // Stream file to client
    return reply.send(fileStream);
  } catch (error: any) {
    request.log.error(error);
    
    if (error.message.includes("File not found in storage")) {
      return reply.code(404).send({ error: "File not found in storage" });
    }

    return reply.code(500).send({
      error: "Failed to retrieve file",
    });
  }
}
