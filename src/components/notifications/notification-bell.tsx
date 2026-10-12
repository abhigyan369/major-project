"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  Loader2,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  NotificationItem,
} from "@/server/actions/notification.actions";
import { NotificationType } from "@prisma/client";

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0 || diffInSeconds < 60) {
    return "Just now";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.PUBLICATION_APPROVED:
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case NotificationType.PUBLICATION_REJECTED:
      return <XCircle className="h-4 w-4 text-rose-500 shrink-0" />;
    case NotificationType.CHANGES_REQUESTED:
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case NotificationType.PUBLICATION_SUBMITTED:
      return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-slate-400 shrink-0" />;
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotificationsAction(15);
      if (res.success && res.notifications) {
        setNotifications(res.notifications as NotificationItem[]);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for background updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      await markNotificationAsReadAction(id);
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.publicationId) {
      setIsOpen(false);
      router.push(`/user/publications/${notification.publicationId}`);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggle}
        className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
        title="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl z-50 overflow-hidden transform transition-all duration-200 ease-out">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-2" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Inbox className="h-8 w-8 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You will receive updates here when publication statuses change.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer ${
                    item.isRead
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-amber-50/40 hover:bg-amber-50/70 font-medium"
                  }`}
                >
                  {/* Unread Status Dot */}
                  {!item.isRead && (
                    <span className="absolute left-2 top-4 h-2 w-2 rounded-full bg-amber-500" />
                  )}

                  {/* Icon */}
                  <div className="mt-0.5 pl-1.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          item.isRead ? "text-slate-800" : "text-slate-950"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {item.publication && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium group-hover:underline">
                        <span>View Publication</span>
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Mark Single as Read Action */}
                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-all shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] text-slate-400">
                Showing latest {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
