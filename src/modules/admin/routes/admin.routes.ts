import { FastifyInstance } from "fastify";
import { adminAuthMiddleware } from "../../../middleware/admin-auth.middleware";
import {
  listFilesHandler,
  deleteFileHandler,
  expireFileHandler,
} from "../controllers/admin-file.controller";
import {
  getOverviewHandler,
  getUploadsHandler,
  getDownloadsHandler,
  getTopHandler,
} from "../controllers/admin-analytics.controller";

export async function adminRoutes(app: FastifyInstance) {
  // Apply admin auth to all routes
  app.addHook("onRequest", adminAuthMiddleware);

  // File management
  app.get("/admin/files", listFilesHandler);
  app.delete("/admin/files/:id", deleteFileHandler);
  app.post("/admin/files/:id/expire", expireFileHandler);

  // Analytics
  app.get("/admin/stats/overview", getOverviewHandler);
  app.get("/admin/stats/uploads", getUploadsHandler);
  app.get("/admin/stats/downloads", getDownloadsHandler);
  app.get("/admin/stats/top", getTopHandler);
}
