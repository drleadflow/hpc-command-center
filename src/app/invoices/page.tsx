"use client";

import { useEffect, useState } from "react";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  description: string;
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: "#f3f4f6", text: "#6b7280" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  paid: { bg: "#dcfce7", text: "#15803d" },
  overdue: { bg: "#fee2e2", text: "#b91c1c" },
};

const FILTER_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState<InvoiceStatus>("draft");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditInvoice(null);
    setFormClient("");
    setFormAmount("");
    setFormStatus("draft");
    setFormDueDate("");
    setFormDescription("");
    setShowModal(true);
  };

  const openEditModal = (inv: Invoice) => {
    setEditInvoice(inv);
    setFormClient(inv.client);
    setFormAmount(inv.amount.toString());
    setFormStatus(inv.status);
    setFormDueDate(inv.due_date);
    setFormDescription(inv.description);
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      client: formClient,
      amount: parseFloat(formAmount) || 0,
      status: formStatus,
      due_date: formDueDate,
      description: formDescription,
    };

    if (editInvoice) {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editInvoice.id, _sha: editInvoice._sha, _path: editInvoice._path }),
      });
    } else {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowModal(false);
    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!editInvoice) return;
    await fetch("/api/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _sha: editInvoice._sha, _path: editInvoice._path, client: editInvoice.client }),
    });
    setShowModal(false);
    fetchInvoices();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val);

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredInvoices = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  // Stats
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const paidThisMonth = invoices
    .filter((i) => i.status === "paid" && i.updated.startsWith(thisMonth))
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            FINANCIAL
          </p>
          <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
            Invoices
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          New Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
            Total Outstanding
          </div>
          <div className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
            Paid This Month
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#15803d" }}>
            {formatCurrency(paidThisMonth)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
            Overdue
          </div>
          <div className="text-2xl font-semibold" style={{ color: overdueCount > 0 ? "#b91c1c" : "var(--text)" }}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === tab.value ? "var(--accent-bg)" : "transparent",
              color: filter === tab.value ? "var(--accent-text)" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          Loading invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          No invoices found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const daysRemaining = getDaysRemaining(inv.due_date);
            const colors = STATUS_COLORS[inv.status];
            return (
              <div
                key={inv.id}
                onClick={() => openEditModal(inv)}
                className="card p-5 cursor-pointer hover:border-[var(--accent)] transition-all"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium" style={{ color: "var(--text)" }}>
                        {inv.client}
                      </div>
                      <div className="text-sm" style={{ color: "var(--muted)" }}>
                        {inv.description || "No description"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                        {formatCurrency(inv.amount)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        Due {inv.due_date}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="text-xs font-medium"
                        style={{
                          color: daysRemaining < 0 ? "#b91c1c" : "var(--muted)",
                        }}
                      >
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d late` : `${daysRemaining}d left`}
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="card p-6 w-full max-w-md" style={{ backgroundColor: "var(--surface)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editInvoice ? "Edit Invoice" : "New Invoice"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  Client
                </label>
                <input
                  type="text"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm"
                    style={{
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                    className="w-full px-4 py-2 rounded-xl text-sm"
                    style={{
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {editInvoice && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                >
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
