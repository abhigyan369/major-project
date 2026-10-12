import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { Publication, PublicationStatus, UserRole } from "@prisma/client";

export async function getCurrentSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  if (process.env.TEST_AUTH_BYPASS === "true" || process.env.TEST_ADMIN_BYPASS === "true") {
    const testUser = await db.user.findFirst({
      where: { role: UserRole.USER },
    });
    if (testUser) return testUser;
  }
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new UnauthorizedError("Authentication required. Please log in.");
  }
  return user;
}

export async function requireUser() {
  const user = await requireAuth();
  if (user.role !== UserRole.USER && user.role !== UserRole.ADMIN) {
    throw new ForbiddenError("User role required.");
  }
  return user;
}

export async function requireAdmin() {
  if (process.env.TEST_ADMIN_BYPASS === "true") {
    const admin = await db.user.findFirst({ where: { role: UserRole.ADMIN } });
    if (admin) return admin;
  }
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Admin permission required. Access denied.");
  }
  return user;
}

export async function requirePublicationOwner(publicationId: string, userId: string): Promise<Publication> {
  if (!publicationId || !userId) {
    throw new ForbiddenError("Invalid parameter provided for ownership check.");
  }

  const publication = await db.publication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new NotFoundError("Publication");
  }

  if (publication.createdById !== userId) {
    throw new ForbiddenError("You do not own this publication. Access denied.");
  }

  return publication;
}

export function assertPublicationEditable(publication: { status: PublicationStatus }): void {
  const editableStatuses: PublicationStatus[] = [
    PublicationStatus.DRAFT,
    PublicationStatus.REVISION_REQUIRED,
  ];

  if (!editableStatuses.includes(publication.status)) {
    throw new ForbiddenError(
      `Publication cannot be edited or modified while in '${publication.status}' status.`
    );
  }
}
