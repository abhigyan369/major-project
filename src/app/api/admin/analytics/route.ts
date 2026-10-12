import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAnalyticsData } from "@/server/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize Admin user
    await requireAdmin();

    // 2. Extract query parameters
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || "ALL";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const departmentId = searchParams.get("departmentId") || "ALL";
    const campusId = searchParams.get("campusId") || "ALL";
    const facultyId = searchParams.get("facultyId") || "ALL";
    const publicationType = searchParams.get("publicationType") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const scopusQuartile = searchParams.get("scopusQuartile") || "ALL";
    const webOfScience = searchParams.get("webOfScience") || "ALL";
    const targetPerFacultyParam = searchParams.get("targetPerFaculty");
    const targetPerFaculty = targetPerFacultyParam ? parseFloat(targetPerFacultyParam) : 3.0;

    // 3. Query PostgreSQL aggregated analytics
    const data = await getAnalyticsData({
      year,
      startDate,
      endDate,
      departmentId,
      campusId,
      facultyId,
      publicationType,
      status,
      scopusQuartile,
      webOfScience,
      targetPerFaculty,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to load analytics dashboard data";
    console.error("GET /api/admin/analytics Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
