import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { uploadRoutes } from "./modules/files/routes/upload.routes";
import { downloadRoutes } from "./modules/files/routes/download.routes";
import { infoRoutes } from "./modules/files/routes/info.routes";
import { adminRoutes } from "./modules/admin/routes/admin.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Register CORS
  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests from your Netlify frontend and localhost for development
      const allowedOrigins = [
        'https://zynt-tmp.netlify.app',
        'http://localhost:3000',
        'https://tmp.zynt.me',
        'http://localhost:5174',
      ];

      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        cb(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
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
