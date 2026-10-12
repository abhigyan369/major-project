"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  parseAndValidateExcel,
  executeBatchImport,
  getImportBatchHistory,
  ParseResult,
  ImportOptions,
} from "@/server/services/excel-import.service";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";

/**
 * Server action to preview the default legacy workbook (`NIE_Publication_Tracker_Enhanced.xlsx`)
 */
export async function previewLegacyWorkbookAction(): Promise<{
  success: boolean;
  data?: ParseResult;
  error?: string;
}> {
  try {
    await requireAdmin();

    const workbookPath = path.join(
      process.cwd(),
      "NIE_Publication_Tracker_Enhanced.xlsx"
    );

    if (!fs.existsSync(workbookPath)) {
      return {
        success: false,
        error: `Legacy Excel workbook not found at ${workbookPath}`,
      };
    }

    const parseResult = await parseAndValidateExcel(
      workbookPath,
      "NIE_Publication_Tracker_Enhanced.xlsx"
    );

    return {
      success: true,
      data: parseResult,
    };
  } catch (error: any) {
    console.error("Failed to preview legacy workbook:", error);
    return {
      success: false,
      error: error.message || "Failed to parse legacy Excel workbook",
    };
  }
}

/**
 * Server action to preview an uploaded Excel file
 */
export async function previewUploadedExcelAction(
  formData: FormData
): Promise<{
  success: boolean;
  data?: ParseResult;
  error?: string;
}> {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      return {
        success: false,
        error: "No file was uploaded.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parseResult = await parseAndValidateExcel(buffer, file.name);

    return {
      success: true,
      data: parseResult,
    };
  } catch (error: any) {
    console.error("Failed to parse uploaded Excel file:", error);
    return {
      success: false,
      error: error.message || "Failed to parse uploaded Excel file",
    };
  }
}

/**
 * Server action to confirm and execute batch import transaction
 */
export async function confirmBatchImportAction(
  parseResult: ParseResult,
  options: ImportOptions
): Promise<{
  success: boolean;
  data?: {
    batchId: string;
    importedCount: number;
    rejectedCount: number;
    updatedCount: number;
    totalRows: number;
  };
  error?: string;
}> {
  try {
    const adminUser = await requireAdmin();

    if (!parseResult || !parseResult.rows || parseResult.rows.length === 0) {
      return {
        success: false,
        error: "Invalid import dataset.",
      };
    }

    const result = await executeBatchImport(
      parseResult,
      options,
      adminUser.id
    );

    revalidatePath("/admin/publications");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/import");

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Batch import transaction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to complete database batch import",
    };
  }
}

/**
 * Server action to fetch past import batches history
 */
export async function getImportHistoryAction() {
  try {
    await requireAdmin();
    const history = await getImportBatchHistory();
    return {
      success: true,
      data: history,
    };
  } catch (error: any) {
    console.error("Failed to fetch import history:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch import history",
    };
  }
}
