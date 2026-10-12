import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getReportData, generateExcelBuffer, generateCsvBuffer, ReportFilterParams } from "@/server/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const preset = searchParams.get("preset") || undefined;
    const reportType = (searchParams.get("reportType") as any) || undefined;
    const format = (searchParams.get("format") || "EXCEL").toUpperCase();

    const filters: ReportFilterParams = {
      preset,
      reportType,
      year: searchParams.get("year") || undefined,
      quarter: searchParams.get("quarter") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      campusId: searchParams.get("campusId") || undefined,
      facultyId: searchParams.get("facultyId") || undefined,
      publicationType: searchParams.get("publicationType") || undefined,
      status: searchParams.get("status") || undefined,
      scopusQuartile: searchParams.get("scopusQuartile") || undefined,
      webOfScience: searchParams.get("webOfScience") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const userContext = {
      id: adminUser.id,
      name: adminUser.name || "Administrator",
      email: adminUser.email || "admin@nie.ac.in",
    };

    const report = await getReportData(filters, userContext);

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const fileBaseName = `NIE_Report_${report.reportType}_${timestampStr}`;

    if (format === "CSV") {
      const csvBuffer = generateCsvBuffer(
        report.reportTitle,
        report.appliedFilters,
        report.headers,
        report.dataRows,
        userContext
      );

      return new Response(new Uint8Array(csvBuffer), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileBaseName}.csv"`,
        },
      });
    } else {
      const excelBuffer = generateExcelBuffer(
        report.reportTitle,
        report.appliedFilters,
        report.headers,
        report.dataRows,
        userContext
      );

      return new Response(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileBaseName}.xlsx"`,
        },
      });
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to generate report export";
    console.error("GET /api/admin/reports/export Error:", error);
    if (errMessage.includes("Admin permission required") || errMessage.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: errMessage }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();

    const format = (body.format || "EXCEL").toUpperCase();
    const previewOnly = body.previewOnly === true;

    const filters: ReportFilterParams = {
      preset: body.preset || undefined,
      reportType: body.reportType || undefined,
      year: body.year || undefined,
      quarter: body.quarter || undefined,
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      departmentId: body.departmentId || undefined,
      campusId: body.campusId || undefined,
      facultyId: body.facultyId || undefined,
      publicationType: body.publicationType || undefined,
      status: body.status || undefined,
      scopusQuartile: body.scopusQuartile || undefined,
      webOfScience: body.webOfScience || undefined,
      search: body.search || undefined,
    };

    const userContext = {
      id: adminUser.id,
      name: adminUser.name || "Administrator",
      email: adminUser.email || "admin@nie.ac.in",
    };

    const report = await getReportData(filters, userContext);

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        reportTitle: report.reportTitle,
        reportType: report.reportType,
        appliedFilters: report.appliedFilters,
        recordCount: report.recordCount,
        headers: report.headers,
        previewRows: report.dataRows.slice(0, 20), // preview first 20 rows
      });
    }

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const fileBaseName = `NIE_Report_${report.reportType}_${timestampStr}`;

    if (format === "CSV") {
      const csvBuffer = generateCsvBuffer(
        report.reportTitle,
        report.appliedFilters,
        report.headers,
        report.dataRows,
        userContext
      );

      return new Response(new Uint8Array(csvBuffer), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileBaseName}.csv"`,
        },
      });
    } else {
      const excelBuffer = generateExcelBuffer(
        report.reportTitle,
        report.appliedFilters,
        report.headers,
        report.dataRows,
        userContext
      );

      return new Response(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileBaseName}.xlsx"`,
        },
      });
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to process report export request";
    console.error("POST /api/admin/reports/export Error:", error);
    if (errMessage.includes("Admin permission required") || errMessage.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: errMessage }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
