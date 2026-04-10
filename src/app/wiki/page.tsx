"use client";

import Link from "next/link";
import { DEPARTMENTS } from "@/lib/types";

export default function WikiPage() {
  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          KNOWLEDGE BASE
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Team Wiki
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Standard operating procedures and documentation by department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map((dept) => (
          <Link
            key={dept.id}
            href={`/wiki/${dept.id}`}
            className="card p-6 hover:border-[var(--accent)] transition-all"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${dept.color}18`, color: dept.color }}
              >
                {dept.icon}
              </div>
              <div>
                <div className="font-medium text-lg" style={{ color: "var(--text)" }}>
                  {dept.label}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  View SOPs
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
