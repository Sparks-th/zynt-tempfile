import { FastifyRequest, FastifyReply } from "fastify";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers["x-admin-key"];

  if (!apiKey) {
    return reply.code(401).send({
      error: "Unauthorized",
      message: "Missing x-admin-key header",
    });
  }

  if (apiKey !== ADMIN_API_KEY) {
    return reply.code(403).send({
      error: "Forbidden",
      message: "Invalid admin API key",
    });
  }
}
