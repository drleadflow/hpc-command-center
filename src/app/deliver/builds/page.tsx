"use client";

interface Build {
  client: string;
  path: "B" | "C";
  practiceType: string;
  dayCount: number;
  progress: number;
  status: "on-track" | "blocked" | "complete";
  blocker?: string;
  techNote: string;
}

const BUILDS: Build[] = [
  { client: "Coastal Chiropractic", path: "B", practiceType: "Chiropractic", dayCount: 10, progress: 70, status: "blocked", blocker: "Meta Business Manager access not granted by client", techNote: "All other components QA'd. Chatbot installed. Waiting on Meta access for ad integration." },
  { client: "Summit Wellness", path: "B", practiceType: "Wellness", dayCount: 5, progress: 40, status: "on-track", techNote: "Chatbot config today. 3 core sequences activating. On schedule for Day 10 walkthrough." },
  { client: "Premier Wellness", path: "C", practiceType: "Wellness", dayCount: 14, progress: 95, status: "on-track", techNote: "Build complete. Ads launching this week. Final QA before client walkthrough." },
];

const STATUS_COLORS = { "on-track": "var(--success)", blocked: "var(--warning)", complete: "var(--accent)" };
const STATUS_LABELS = { "on-track": "On Track", blocked: "Blocked", complete: "Complete" };

export default function BuildsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Active Builds</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Path B &amp; C client setups &middot; Target: 7–14 business days
      </p>

      <div className="flex flex-col gap-3">
        {BUILDS.map((b) => (
          <div
            key={b.client}
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderLeft: `3px solid ${STATUS_COLORS[b.status]}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{b.client}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Path {b.path} &middot; {b.practiceType} &middot; Day {b.dayCount}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-sm font-medium" style={{ backgroundColor: `${STATUS_COLORS[b.status]}18`, color: STATUS_COLORS[b.status] }}>
                {STATUS_LABELS[b.status]}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "var(--bg)" }}>
              <div className="h-full rounded-full" style={{ width: `${b.progress}%`, backgroundColor: STATUS_COLORS[b.status] }} />
            </div>
            <div className="text-[10px] mb-2" style={{ color: "var(--muted)" }}>{b.progress}% complete</div>

            {b.blocker && (
              <div className="rounded-md px-3 py-2 mb-2 text-[11px]" style={{ backgroundColor: "#FDF3E3", color: "#854F0B", border: "0.5px solid #E8C87A" }}>
                Blocker: {b.blocker}
              </div>
            )}

            <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{b.techNote}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
