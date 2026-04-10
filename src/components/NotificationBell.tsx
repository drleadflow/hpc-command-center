"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/hooks";

type NotificationType = "lead_move" | "task_overdue" | "spend_alert" | "deploy" | "general";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function typeIcon(type: NotificationType): string {
  switch (type) {
    case "lead_move":    return "👤";
    case "task_overdue": return "⏰";
    case "spend_alert":  return "💸";
    case "deploy":       return "🚀";
    default:             return "🔔";
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silent fail — non-critical
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Also trigger the check endpoint periodically to surface new alerts
  useEffect(() => {
    const check = () => {
      fetch("/api/notifications/check").catch(() => {});
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
        setNotifications(prev =>
          prev.map(x => x.id === n.id ? { ...x, read: true } : x)
        );
      } catch {
        // Silent
      }
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const todayItems = notifications.filter(n => isToday(n.createdAt));
  const earlierItems = notifications.filter(n => !isToday(n.createdAt));

  return (
    <div ref={dropdownRef} style={{ position: "fixed", top: "14px", right: "16px", zIndex: 9999 }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          transition: "background 0.15s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
              background: "#dc2626",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
              boxShadow: "0 0 0 2px var(--surface)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "46px",
            right: "-8px",
            width: "min(360px, calc(100vw - 32px))",
            maxHeight: "480px",
            overflowY: "auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid var(--border)",
              position: "sticky",
              top: 0,
              background: "var(--surface)",
              zIndex: 1,
              borderRadius: "16px 16px 0 0",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "14px" }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "var(--accent-bg)",
                    color: "var(--accent-text)",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                style={{
                  fontSize: "12px",
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              No notifications yet
            </div>
          ) : (
            <div>
              {todayItems.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: "8px 16px 4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Today
                  </div>
                  {todayItems.map(n => (
                    <NotificationItem key={n.id} n={n} onClick={handleClick} />
                  ))}
                </div>
              )}
              {earlierItems.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: "8px 16px 4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Earlier
                  </div>
                  {earlierItems.map(n => (
                    <NotificationItem key={n.id} n={n} onClick={handleClick} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  n,
  onClick,
}: {
  n: Notification;
  onClick: (n: Notification) => void;
}) {
  return (
    <button
      onClick={() => onClick(n)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 16px",
        background: n.read ? "transparent" : "var(--accent-bg)",
        border: "none",
        cursor: n.link ? "pointer" : "default",
        textAlign: "left",
        transition: "background 0.1s",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: "18px", lineHeight: 1, marginTop: "1px", flexShrink: 0 }}>
        {typeIcon(n.type)}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "2px",
          }}
        >
          <span
            style={{
              fontWeight: n.read ? 500 : 700,
              fontSize: "13px",
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {n.title}
          </span>
          {!n.read && (
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {n.message}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
          {timeAgo(n.createdAt)}
        </div>
      </div>
    </button>
  );
}
