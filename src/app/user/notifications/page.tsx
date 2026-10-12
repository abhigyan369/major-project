"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  Inbox,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  NotificationItem,
} from "@/server/actions/notification.actions";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { useToast } from "@/components/shared/toast-provider";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const toast = useToast();

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await getUserNotificationsAction(50);
      if (res.success && res.notifications) {
        setNotifications(res.notifications as NotificationItem[]);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      await markNotificationAsReadAction(id);
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "UNREAD" && item.isRead) return false;
    if (filter === "READ" && !item.isRead) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Notifications" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <span>Notification Center</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and manage publication review notifications and system updates
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(["ALL", "UNREAD", "READ"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  filter === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "UNREAD" ? `Unread (${unreadCount})` : "Read"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* List Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Inbox className="h-10 w-10 stroke-1 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {searchQuery ? "Try refining your search filter query." : "You're all caught up! New updates will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  item.isRead ? "bg-white hover:bg-slate-50/70" : "bg-amber-50/30 hover:bg-amber-50/60"
                }`}
              >
                <div className="mt-1 p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  {item.type === "PUBLICATION_APPROVED" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {item.type === "PUBLICATION_REJECTED" && <XCircle className="h-5 w-5 text-rose-600" />}
                  {item.type === "CHANGES_REQUESTED" && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                  {item.type === "PUBLICATION_SUBMITTED" && <FileText className="h-5 w-5 text-blue-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs sm:text-sm font-bold ${item.isRead ? "text-slate-800" : "text-slate-950"}`}>
                      {item.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                  {item.publicationId && (
                    <div className="mt-3">
                      <Link
                        href={`/user/publications/${item.publicationId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        <span>View Publication Record</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {!item.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
