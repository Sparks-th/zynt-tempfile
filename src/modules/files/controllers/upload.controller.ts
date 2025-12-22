import { FastifyRequest, FastifyReply } from "fastify";
import { streamUpload } from "../services/upload.service";
import { createFileDocument } from "../services/file.service";

export async function uploadFileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: "No file uploaded" });
    }

    // Parse form fields
    const fields = data.fields as any;
    const isTemporary = fields.isTemporary?.value === "true";
    const expiresIn = fields.expiresIn?.value
      ? parseInt(fields.expiresIn.value, 10)
      : null;

    // Validate expiresIn
    let expiresAt: Date | null = null;
    if (isTemporary && expiresIn) {
      if (expiresIn < 60 || expiresIn > 86400 * 30) {
        return reply.code(400).send({
          error: "expiresIn must be between 60 seconds and 30 days",
        });
      }
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // Stream upload to S3 and compute hash
    const uploadResult = await streamUpload(data, isTemporary);

    // Create or retrieve file document (handles deduplication)
    const fileDoc = await createFileDocument({
      uploadResult,
      isTemporary,
      expiresAt,
    });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/f/${fileDoc.fileId}${fileDoc.extension}`;

    return reply.code(201).send({
      success: true,
      file: {
        url: fileUrl,
        fileId: fileDoc.fileId,
        extension: fileDoc.extension,
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        mimeType: fileDoc.mimeType,
        sha256: fileDoc.sha256,
        isTemporary: fileDoc.isTemporary,
        expiresAt: fileDoc.expiresAt,
        createdAt: fileDoc.createdAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    
    // Handle storage quota errors specifically
    if (error.message.includes("Storage quota exceeded")) {
      return reply.code(507).send({
        error: "Insufficient storage space",
        details: error.message,
      });
    }

    return reply.code(500).send({
      error: error.message || "Upload failed",
    });
  }
}
