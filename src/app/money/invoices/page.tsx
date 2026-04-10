"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";
import type { StoredInvoice } from "@/lib/store";

const STATUS_STYLES = {
  paid: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)", label: "Paid" },
  processing: { bg: "#E8F1FB", color: "#1A4F8A", label: "Processing" },
  overdue: { bg: "var(--danger-bg, #FCEBEB)", color: "var(--danger)", label: "Overdue" },
};

const STATUS_CYCLE: Record<StoredInvoice["status"], StoredInvoice["status"]> = {
  processing: "paid",
  paid: "overdue",
  overdue: "processing",
};

const DEFAULT_INVOICES: StoredInvoice[] = [
  { id: "1", contractor: "Marketing Lead", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { id: "2", contractor: "Content Editor", period: "Mar 16–31", amount: "$XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { id: "3", contractor: "AI & Tech Specialist", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { id: "4", contractor: "CSM / Lead Coach", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { id: "5", contractor: "Sales Closer", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 3", dueBy: "Apr 8", status: "paid" },
  { id: "6", contractor: "Appointment Setter", period: "Mar 16–31", amount: "$XXX", submitted: "Apr 3", dueBy: "Apr 8", status: "paid" },
  { id: "7", contractor: "Bookkeeper / Finance", period: "March", amount: "$XXX", submitted: "Apr 1", dueBy: "Apr 6", status: "paid" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useStore<StoredInvoice[]>(
    "hpc_invoices" as "hpc_invoices",
    DEFAULT_INVOICES
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contractor: "",
    period: "",
    amount: "",
    submitted: "",
    dueBy: "",
  });

  const processing = invoices.filter((i) => i.status === "processing").length;

  function cycleStatus(id: string) {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: STATUS_CYCLE[inv.status] } : inv)
    );
  }

  function removeInvoice(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  function submitForm() {
    if (!form.contractor.trim()) return;
    const inv: StoredInvoice = {
      id: `${Date.now()}`,
      contractor: form.contractor.trim(),
      period: form.period.trim() || "—",
      amount: form.amount.trim() || "—",
      submitted: form.submitted.trim() || "—",
      dueBy: form.dueBy.trim() || "—",
      status: "processing",
    };
    setInvoices((prev) => [inv, ...prev]);
    setForm({ contractor: "", period: "", amount: "", submitted: "", dueBy: "" });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Invoices</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ Add Invoice"}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Bi-weekly contractor invoices &middot; {processing} processing &middot; Payment within 5 business days &middot; click status to cycle
      </p>

      {/* Add Invoice Form */}
      {showForm && (
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: "var(--muted)" }}>New Invoice</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: "Contractor", key: "contractor", placeholder: "e.g. Marketing Lead" },
              { label: "Period", key: "period", placeholder: "e.g. Apr 1–15" },
              { label: "Amount", key: "amount", placeholder: "e.g. $1,500" },
              { label: "Submitted", key: "submitted", placeholder: "e.g. Apr 16" },
              { label: "Due By", key: "dueBy", placeholder: "e.g. Apr 21" },
            ].map((f) => (
              <div key={f.key}>
                <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>{f.label}</div>
                <input
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full text-[11px] rounded px-2 py-1.5"
                  style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={submitForm}
            className="text-[11px] px-4 py-1.5 rounded"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Add Invoice
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {invoices.map((inv) => {
          const s = STATUS_STYLES[inv.status];
          return (
            <div key={inv.id} className="rounded-lg px-4 py-3 flex items-center gap-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{inv.contractor}</div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>{inv.period} &middot; Submitted {inv.submitted} &middot; Due {inv.dueBy}</div>
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{inv.amount}</div>
              <button
                onClick={() => cycleStatus(inv.id)}
                className="text-[9px] px-1.5 py-0.5 rounded-sm cursor-pointer"
                style={{ backgroundColor: s.bg, color: s.color }}
                title="Click to cycle status"
              >
                {s.label}
              </button>
              <button
                onClick={() => removeInvoice(inv.id)}
                className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--danger)" }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
