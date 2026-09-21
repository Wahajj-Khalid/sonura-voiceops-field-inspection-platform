"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Trash2, 
  CheckCheck,
  ArrowUpDown
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectOption } from "../../components/ui/select";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { NotificationItem } from "../../types";

const TYPE_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Alert Categories" },
  { value: "info", label: "Info Notifications" },
  { value: "warning", label: "Warning Alerts" },
  { value: "danger", label: "Critical Incidents" },
  { value: "success", label: "Approval Notices" },
];

export const NotificationInbox: React.FC = () => {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (typeFilter !== "all") params.append("type_filter", typeFilter);
      params.append("sort_order", sortOrder);

      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/?${params.toString()}`);
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, searchQuery, typeFilter, sortOrder]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/read-all`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/clear-all`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
        setIsClearAllModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const getIcon = (type: string) => {
    if (type === "danger") return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    if (type === "warning") return <AlertCircle className="w-4 h-4 text-amber-400" />;
    if (type === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    return <Info className="w-4 h-4 text-cyan-400" />;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <Badge variant="danger" className="text-[10px] px-2 py-0.5">
                {unreadCount} Unread
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Workspace alerts, administrative messages, and supervisor sign-off events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 ? (
            <Button
              variant="secondary"
              icon={<CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={markAllRead}
              className="text-xs py-2 px-3"
            >
              Mark All Read
            </Button>
          ) : null}

          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              onClick={() => setIsClearAllModalOpen(true)}
              className="text-xs py-2 px-3 text-rose-400 hover:text-rose-300"
            >
              Clear All
            </Button>
          ) : null}

          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title or message..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>

        <div className="sm:col-span-4">
          <Select
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="w-full h-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-violet-400" />
            <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-all ${
                  n.read ? "bg-slate-900/30 text-slate-400" : "bg-slate-900/80 text-white"
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold truncate font-sans">{n.title}</h4>
                      {!n.read ? (
                        <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans break-words">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {!n.read ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              {isLoading ? "Querying notification database..." : "No alerts currently in your inbox matching your criteria."}
            </div>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={clearAllNotifications}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications from your workspace inbox? This action cannot be undone."
        confirmText="Clear Inbox"
        variant="danger"
      />
    </div>
  );
};