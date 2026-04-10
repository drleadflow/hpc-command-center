import type { Metric } from "@/lib/types";

interface MetricCardProps {
  metric: Metric;
  color: string;
}

export function MetricCard({ metric, color }: MetricCardProps) {
  const trendIcon = metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→";
  const trendColor = metric.trend === "up" ? "#2d5a4e" : metric.trend === "down" ? "#b91c1c" : "var(--muted)";

  return (
    <div className="rounded-3xl border p-5 card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs themed-muted uppercase tracking-wide">{metric.name}</p>
        {metric.trend && (
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trendIcon}
          </span>
        )}
      </div>
      <p className="text-3xl font-serif themed-text" style={{ fontWeight: 300 }}>
        {metric.value}
      </p>
      {metric.target && (
        <p className="text-xs themed-muted mt-1">Target: {metric.target}</p>
      )}
    </div>
  );
}
