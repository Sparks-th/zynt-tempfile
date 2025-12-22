import { FastifyInstance } from "fastify";
import { getFileInfoHandler } from "../controllers/info.controller";

export async function infoRoutes(app: FastifyInstance) {
  app.get("/info/:fileId", getFileInfoHandler);
}
