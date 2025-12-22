import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "./modules/files/routes/upload.routes";
import { downloadRoutes } from "./modules/files/routes/download.routes";
import { infoRoutes } from "./modules/files/routes/info.routes";
import { adminRoutes } from "./modules/admin/routes/admin.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Register multipart for file uploads
  app.register(multipart, {
    limits: {
      fileSize: 200 * 1024 * 1024, // 200MB max
    },
  });

  // Health check
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // Register routes
  app.register(uploadRoutes);
  app.register(downloadRoutes);
  app.register(infoRoutes);
  app.register(adminRoutes);

  return app;
}
