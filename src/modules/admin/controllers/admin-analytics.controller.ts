import { FastifyRequest, FastifyReply } from "fastify";
import {
  getOverviewStats,
  getUploadStats,
  getDownloadStats,
  getTopStats,
} from "../services/admin-analytics.service";

interface StatsQueryParams {
  days?: string;
  limit?: string;
}

export async function getOverviewHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await getOverviewStats();

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve overview stats",
    });
  }
}

export async function getUploadsHandler(
  request: FastifyRequest<{ Querystring: StatsQueryParams }>,
  reply: FastifyReply
) {
  try {
    const days = parseInt(request.query.days || "30", 10);
    const stats = await getUploadStats(days);

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve upload stats",
    });
  }
}

export async function getDownloadsHandler(
  request: FastifyRequest<{ Querystring: StatsQueryParams }>,
  reply: FastifyReply
) {
  try {
    const days = parseInt(request.query.days || "30", 10);
    const stats = await getDownloadStats(days);

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve download stats",
    });
  }
}

export async function getTopHandler(
  request: FastifyRequest<{ Querystring: StatsQueryParams }>,
  reply: FastifyReply
) {
  try {
    const limit = parseInt(request.query.limit || "10", 10);
    const stats = await getTopStats(limit);

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      error: "Failed to retrieve top stats",
    });
  }
}
