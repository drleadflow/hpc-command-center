"use client";

import type { DailyLog } from "@/lib/types";

interface Props {
  log: DailyLog | null;
  department: { id: string; label: string; color: string };
}

export function DailyLogComponent({ log, department }: Props) {
  const wins = log?.wins || [];
  const blockers = log?.blockers || [];

  return (
    <div className="rounded-3xl border p-5 card">
      <h3 className="text-base font-serif themed-text mb-4 flex items-center gap-2" style={{ fontWeight: 400 }}>
        <span>📋</span> Daily Log
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#2d5a4e" }}>Wins</h4>
          {wins.length === 0 ? (
            <p className="text-sm themed-muted italic">No wins logged today</p>
          ) : (
            <ul className="space-y-1.5">
              {wins.map((win: string, i: number) => (
                <li key={i} className="text-sm themed-text flex items-start gap-2">
                  <span style={{ color: "#2d5a4e" }}>✓</span> {win}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#b91c1c" }}>Blockers</h4>
          {blockers.length === 0 ? (
            <p className="text-sm themed-muted italic">No blockers</p>
          ) : (
            <ul className="space-y-1.5">
              {blockers.map((blocker: string, i: number) => (
                <li key={i} className="text-sm themed-text flex items-start gap-2">
                  <span style={{ color: "#b91c1c" }}>⚠</span> {blocker}
                </li>
              ))}
            </ul>
          )}
        </div>

        {log?.notes && (
          <div className="pt-3 border-t themed-border">
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 themed-muted">Notes</h4>
            <p className="text-sm themed-text">{log.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
