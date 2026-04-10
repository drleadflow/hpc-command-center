"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Alert {
  id: string;
  title: string;
  department: string;
  deptLabel: string;
  deptColor: string;
}

export function RedAlerts({ alerts: initialAlerts, totalWaiting }: { alerts: Alert[]; totalWaiting: number }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [resolving, setResolving] = useState<string | null>(null);
  const router = useRouter();

  async function handleResolve(id: string) {
    setResolving(id);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "in-progress" }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (err) {
      console.error("Failed to resolve:", err);
    } finally {
      setResolving(null);
    }
  }

  async function handleDismiss(id: string) {
    setResolving(id);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (err) {
      console.error("Failed to dismiss:", err);
    } finally {
      setResolving(null);
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="card p-5" style={{ borderLeft: "3px solid var(--danger)" }}>
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2"
        style={{ color: "var(--danger)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
          style={{ backgroundColor: "var(--danger)" }}
        />
        Red Alerts — {alerts.length} Blocked
      </p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={`alert-${alert.id}`}
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--text)" }}>
                {alert.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: alert.deptColor }}>
                {alert.deptLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <button
                onClick={() => handleResolve(alert.id)}
                disabled={resolving === alert.id}
                className="text-xs px-2.5 py-1 rounded-xl transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  opacity: resolving === alert.id ? 0.5 : 1,
                }}
              >
                {resolving === alert.id ? "..." : "Unblock"}
              </button>
              <button
                onClick={() => handleDismiss(alert.id)}
                disabled={resolving === alert.id}
                className="text-xs px-2.5 py-1 rounded-xl transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "#22c55e",
                  color: "#fff",
                  opacity: resolving === alert.id ? 0.5 : 1,
                }}
              >
                Done
              </button>
              <Link
                href={`/departments/${alert.department}`}
                className="text-xs px-2.5 py-1 rounded-xl transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
