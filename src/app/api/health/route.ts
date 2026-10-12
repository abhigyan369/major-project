import { NextResponse } from "next/server";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    const departmentCount = await db.department.count();

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs: latency,
          departmentCount,
        },
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 }
    );
  }
}
