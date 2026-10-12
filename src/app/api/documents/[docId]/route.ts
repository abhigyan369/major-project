import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required to access document." },
        { status: 401 }
      );
    }

    const { docId } = await params;

    const document = await db.publicationDocument.findUnique({
      where: { id: docId },
      include: {
        publication: {
          select: {
            id: true,
            createdById: true,
            departmentId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Security Check: Enforce user ownership OR admin authorization
    const isOwner = document.publication.createdById === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this document." },
        { status: 403 }
      );
    }

    // Fetch file stream/buffer from Storage Provider
    const storageProvider = getStorageProvider();
    const storedFile = await storageProvider.getFileStream(document.filePath);

    const searchParams = request.nextUrl.searchParams;
    const isDownload = searchParams.get("download") === "true";

    const disposition = isDownload ? "attachment" : "inline";

    // Set secure response headers (nosniff, disposition, non-exposed paths)
    const headers = new Headers();
    headers.set("Content-Type", document.fileType || storedFile.contentType || "application/octet-stream");
    headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(document.fileName)}"`);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, max-age=3600");

    if (storedFile.contentLength > 0) {
      headers.set("Content-Length", String(storedFile.contentLength));
    }

    // Return binary stream or Uint8Array body
    const body = storedFile.stream instanceof Buffer
      ? new Uint8Array(storedFile.stream)
      : (storedFile.stream as unknown as BodyInit);

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve requested document file." },
      { status: 500 }
    );
  }
}
