"use client";

interface Invoice {
  contractor: string;
  period: string;
  amount: string;
  submitted: string;
  dueBy: string;
  status: "paid" | "processing" | "overdue";
}

const INVOICES: Invoice[] = [
  { contractor: "Marketing Lead", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { contractor: "Content Editor", period: "Mar 16–31", amount: "$XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { contractor: "AI & Tech Specialist", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { contractor: "CSM / Lead Coach", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 4", dueBy: "Apr 9", status: "processing" },
  { contractor: "Sales Closer", period: "Mar 16–31", amount: "$X,XXX", submitted: "Apr 3", dueBy: "Apr 8", status: "paid" },
  { contractor: "Appointment Setter", period: "Mar 16–31", amount: "$XXX", submitted: "Apr 3", dueBy: "Apr 8", status: "paid" },
  { contractor: "Bookkeeper / Finance", period: "March", amount: "$XXX", submitted: "Apr 1", dueBy: "Apr 6", status: "paid" },
];

const STATUS_STYLES = {
  paid: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)", label: "Paid" },
  processing: { bg: "#E8F1FB", color: "#1A4F8A", label: "Processing" },
  overdue: { bg: "var(--danger-bg, #FCEBEB)", color: "var(--danger)", label: "Overdue" },
};

export default function InvoicesPage() {
  const processing = INVOICES.filter((i) => i.status === "processing").length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Invoices</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Bi-weekly contractor invoices &middot; {processing} processing &middot; Payment within 5 business days
      </p>

      <div className="flex flex-col gap-1.5">
        {INVOICES.map((inv, i) => {
          const s = STATUS_STYLES[inv.status];
          return (
            <div key={i} className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{inv.contractor}</div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>{inv.period} &middot; Submitted {inv.submitted} &middot; Due {inv.dueBy}</div>
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{inv.amount}</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
