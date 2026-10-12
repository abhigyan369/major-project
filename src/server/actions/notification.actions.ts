"use server";

import db from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { NotificationType, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath as nextRevalidatePath } from "next/cache";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch {
    // Suppress static generation store error when executing in CLI test scripts
  }
}

export interface NotificationItem {
  id: string;
  userId: string;
  publicationId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  publication?: {
    id: string;
    title: string;
  } | null;
}

export async function getUserNotificationsAction(limit = 15) {
  const user = await requireAuth();

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        publication: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    }),
  ]);

  return {
    success: true,
    notifications,
    unreadCount,
  };
}

export async function markNotificationAsReadAction(notificationId: string) {
  const user = await requireAuth();

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return { success: false, error: "Notification not found or access denied." };
  }

  const updated = await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/user/dashboard");
  revalidatePath("/admin/dashboard");
  return { success: true, notification: updated };
}

export async function markAllNotificationsAsReadAction() {
  const user = await requireAuth();

  await db.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/user/dashboard");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function sendPublicationSubmittedNotifications(
  publicationId: string,
  authorUserId: string,
  publicationTitle: string,
  submitterName?: string | null
) {
  // 1. Send confirmation notification to submitting author
  await db.notification.create({
    data: {
      userId: authorUserId,
      publicationId,
      type: NotificationType.PUBLICATION_SUBMITTED,
      title: "Publication Submitted",
      message: `Your publication "${publicationTitle}" has been submitted for review.`,
    },
  });

  // 2. Fetch all active Admin users to notify them
  const activeAdmins = await db.user.findMany({
    where: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (activeAdmins.length > 0) {
    const adminNotificationsData = activeAdmins.map((admin) => ({
      userId: admin.id,
      publicationId,
      type: NotificationType.PUBLICATION_SUBMITTED,
      title: "New Publication Submitted",
      message: `${submitterName || "A user"} submitted a new publication for review: "${publicationTitle}".`,
    }));

    await db.notification.createMany({
      data: adminNotificationsData,
    });
  }
}
