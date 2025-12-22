import { FastifyInstance } from "fastify";
import { downloadFileHandler } from "../controllers/download.controller";

export async function downloadRoutes(app: FastifyInstance) {
  app.get("/f/:fileId", downloadFileHandler);
}
