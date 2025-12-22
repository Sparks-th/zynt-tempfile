import { FastifyInstance } from "fastify";
import { uploadFileHandler } from "../controllers/upload.controller";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", uploadFileHandler);
}
