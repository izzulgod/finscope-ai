import { cn } from "@/lib/utils";

export function RiskBar({ label, value }: { label: string; value: number }) {
  const tone =
    value < 35
      ? "bg-success"
      : value < 65
        ? "bg-warning"
        : "bg-danger";
  const lbl = value < 35 ? "Low" : value < 65 ? "Moderate" : "High";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular">
          {value}% — <span className={cn(value < 35 && "text-success", value >= 35 && value < 65 && "text-warning", value >= 65 && "text-danger")}>{lbl}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
