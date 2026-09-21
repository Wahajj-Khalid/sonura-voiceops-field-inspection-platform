"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, RefreshCw, AlertCircle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { NotificationItem } from "../../types";

export const NotificationInbox: React.FC = () => {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/notifications/`);
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

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

  const getIcon = (type: string) => {
    if (type === "danger") return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    if (type === "warning") return <AlertCircle className="w-4 h-4 text-amber-400" />;
    if (type === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    return <Info className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Workspace alerts, administrative messages, and supervisor review updates.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
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
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-bold truncate font-sans">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No notifications currently in your inbox.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};