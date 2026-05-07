import { cn } from "@/lib/utils";
import type { Health } from "@/lib/finance/ratios";

export function KpiCard({
  label,
  value,
  unit,
  health = "neutral",
  hint,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  health?: Health;
  hint?: string;
}) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "number"
        ? value.toFixed(2)
        : value;
  const tone = {
    good: "border-success-soft bg-success-soft text-success",
    warn: "border-warning-soft bg-warning-soft text-warning",
    bad: "border-danger-soft bg-danger-soft text-danger",
    neutral: "border-border bg-card text-foreground",
  }[health];
  const dot = {
    good: "bg-success",
    warn: "bg-warning",
    bad: "bg-danger",
    neutral: "bg-muted-foreground",
  }[health];
  return (
    <div className={cn("rounded-lg border p-4", tone)}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] opacity-80">
          {label}
        </div>
        <span className={cn("h-2 w-2 rounded-full", dot)} />
      </div>
      <div className="mt-2 flex items-baseline gap-1 font-mono">
        <span className="text-2xl font-semibold tabular">{display}</span>
        {unit && <span className="text-xs opacity-70">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
