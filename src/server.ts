import dotenv from "dotenv";

// Only load .env in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { buildApp } from "./app";
import { connectDB } from "./db/mongo";

async function startServer() {
  const app = buildApp();
  const port = Number(process.env.PORT) || 3000;

  await connectDB();

  await app.listen({ port, host: "0.0.0.0" });

  console.log(`Server running on port ${port}`);
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
