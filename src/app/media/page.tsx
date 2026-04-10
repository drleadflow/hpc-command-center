import { MediaBoard } from "@/components/MediaBoard";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          CONTENT PIPELINE
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Media
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Strategy → Creation → Review → Publishing → Engagement → Analytics
        </p>
      </div>
      <MediaBoard />
    </div>
  );
}
