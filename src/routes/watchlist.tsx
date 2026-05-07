import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import { Star } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — FinScope AI" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { data } = useQuery({
    queryKey: ["watchlist-page"],
    queryFn: async () => {
      const sid = getSessionId();
      const { data, error } = await supabase
        .from("watchlist")
        .select("id, company_id, companies!inner(id, name, ticker, sector)")
        .eq("user_id", sid);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Watchlist</div>
        <h1 className="font-display text-2xl font-semibold">Your tracked companies</h1>
      </header>

      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {data.map((w: any) => (
            <Link key={w.id} to="/companies/$id" params={{ id: w.company_id }} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <div>
                  <div className="font-medium">{w.companies.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{w.companies.ticker ?? "—"}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{w.companies.sector ?? "—"}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Empty. Open a company and click <em>Watch</em>.
        </div>
      )}
    </div>
  );
}
