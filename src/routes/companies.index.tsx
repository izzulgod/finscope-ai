import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/companies/")({
  head: () => ({
    meta: [{ title: "Companies — FinScope AI" }, { name: "description", content: "All analyzed companies." }],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, ticker, sector, industry, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = (data ?? []).filter((c) =>
    [c.name, c.ticker, c.sector].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Catalog</div>
          <h1 className="font-display text-2xl font-semibold">Companies</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 w-64" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to="/companies/$id"
            params={{ id: c.id }}
            className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{c.ticker ?? "—"}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{c.sector ?? "Unclassified"} · {c.industry ?? "—"}</div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No companies yet. <Link to="/analyze" className="text-primary underline">Run an analysis</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
