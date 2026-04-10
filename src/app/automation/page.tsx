"use client";

import { useState, useEffect } from "react";

interface GHLWorkflow {
  id: string;
  name: string;
  status: string;
}

interface GHLData {
  connected: boolean;
  workflows: GHLWorkflow[];
  error?: string;
}

interface ManyChatData {
  connected: boolean;
  data?: {
    id?: string;
    name?: string;
    subscribers_count?: number;
    [key: string]: any;
  };
  error?: string;
  reason?: string;
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full inline-block"
      style={{ backgroundColor: connected ? "#22c55e" : "#ef4444" }}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1" style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

export default function AutomationPage() {
  const [ghlData, setGhlData] = useState<GHLData | null>(null);
  const [ghlLoading, setGhlLoading] = useState(true);
  const [ghlLastSync, setGhlLastSync] = useState<Date | null>(null);

  const [manychatData, setManychatData] = useState<ManyChatData | null>(null);
  const [manychatLoading, setManychatLoading] = useState(true);
  const [manychatLastSync, setManychatLastSync] = useState<Date | null>(null);

  const fetchGHL = async () => {
    setGhlLoading(true);
    try {
      const res = await fetch("/api/automation/ghl");
      const data = await res.json();
      setGhlData(data);
      setGhlLastSync(new Date());
    } catch {
      setGhlData({ connected: false, workflows: [], error: "Failed to fetch" });
    } finally {
      setGhlLoading(false);
    }
  };

  const fetchManyChat = async () => {
    setManychatLoading(true);
    try {
      const res = await fetch("/api/automation/manychat");
      const data = await res.json();
      setManychatData(data);
      setManychatLastSync(new Date());
    } catch {
      setManychatData({ connected: false, error: "Failed to fetch" });
    } finally {
      setManychatLoading(false);
    }
  };

  useEffect(() => {
    fetchGHL();
    fetchManyChat();
  }, []);

  const formatLastSync = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif" style={{ color: "var(--text)" }}>
        Automation Health
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GoHighLevel Section */}
        <div
          className="card rounded-2xl"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium" style={{ color: "var(--text)" }}>
                  GoHighLevel
                </h2>
                {!ghlLoading && <StatusDot connected={ghlData?.connected || false} />}
              </div>
              <button
                onClick={fetchGHL}
                disabled={ghlLoading}
                className="text-xs px-3 py-1.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {ghlLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            {ghlLastSync && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Last synced {formatLastSync(ghlLastSync)}
              </p>
            )}
          </div>

          <div className="p-5">
            {ghlLoading ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Loading GHL data...
                </p>
              </div>
            ) : ghlData?.connected ? (
              <div className="space-y-3">
                {ghlData.workflows.length > 0 ? (
                  <div
                    className="rounded-xl overflow-hidden border"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: "var(--bg)" }}>
                          <th
                            className="text-left px-4 py-3 text-xs uppercase tracking-wide font-semibold"
                            style={{ color: "var(--muted)" }}
                          >
                            Workflow
                          </th>
                          <th
                            className="text-right px-4 py-3 text-xs uppercase tracking-wide font-semibold"
                            style={{ color: "var(--muted)" }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ghlData.workflows.map((wf) => (
                          <tr
                            key={wf.id}
                            className="border-t"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm" style={{ color: "var(--text)" }}>
                                {wf.name}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor:
                                    wf.status === "active" ? "#dcfce7" : "var(--bg)",
                                  color: wf.status === "active" ? "#16a34a" : "var(--muted)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      wf.status === "active" ? "#22c55e" : "#9ca3af",
                                  }}
                                />
                                {wf.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                    No workflows found
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm mb-2" style={{ color: "var(--danger)" }}>
                  {ghlData?.error || "Unable to connect"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Check GHL credentials in environment variables
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ManyChat Section */}
        <div
          className="card rounded-2xl"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium" style={{ color: "var(--text)" }}>
                  ManyChat
                </h2>
                {!manychatLoading && <StatusDot connected={manychatData?.connected || false} />}
              </div>
              <button
                onClick={fetchManyChat}
                disabled={manychatLoading}
                className="text-xs px-3 py-1.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {manychatLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            {manychatLastSync && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Last synced {formatLastSync(manychatLastSync)}
              </p>
            )}
          </div>

          <div className="p-5">
            {manychatLoading ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Loading ManyChat data...
                </p>
              </div>
            ) : manychatData?.connected ? (
              <div className="space-y-4">
                {manychatData.data?.name && (
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
                      Page
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
                      {manychatData.data.name}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {manychatData.data?.subscribers_count !== undefined && (
                    <StatCard label="Subscribers" value={manychatData.data.subscribers_count.toLocaleString()} />
                  )}
                  {manychatData.data?.id && (
                    <StatCard label="Page ID" value={manychatData.data.id} />
                  )}
                </div>

                {/* Show any other metrics available */}
                {Object.entries(manychatData.data || {}).map(([key, value]) => {
                  if (["id", "name", "subscribers_count"].includes(key)) return null;
                  if (typeof value !== "string" && typeof value !== "number") return null;
                  return (
                    <div key={key}>
                      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
                        {String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <span className="text-2xl" style={{ color: "var(--muted)" }}>
                    🤖
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  {manychatData?.reason || manychatData?.error || "ManyChat not connected"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Add MANYCHAT_TOKEN to your environment variables to connect
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
