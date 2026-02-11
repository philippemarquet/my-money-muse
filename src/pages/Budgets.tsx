import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BudgetVsActualRow = {
  user_id: string;
  period_start: string; // YYYY-MM-DD
  category_id: string;
  category_name: string;
  category_type: "income" | "expense" | "transfer";
  budget_cents: number;
  actual_cents: number;
};

function startOfMonthISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function monthLabel(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

function formatEUR(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Budgets = () => {
  const navigate = useNavigate();

  const [periodStart, setPeriodStart] = useState<string>(() => startOfMonthISO(new Date()));

  // Maak simpele dropdown: huidige maand + 11 maanden terug
  const periodOptions = useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(startOfMonthISO(d));
    }
    return arr;
  }, []);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["budgets-vs-actual", periodStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_budget_vs_actual_month")
        .select("user_id,period_start,category_id,category_name,category_type,budget_cents,actual_cents")
        .eq("period_start", periodStart)
        .order("category_type", { ascending: true })
        .order("category_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as BudgetVsActualRow[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Budgetten</h1>
          <p className="text-muted-foreground mt-1">Beheer je maandelijkse budgetten</p>
        </div>

        <Select value={periodStart} onValueChange={setPeriodStart}>
          <SelectTrigger className="w-[220px] rounded-xl border-0 bg-card shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-0 shadow-lg">
            {periodOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {monthLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground">Laden…</p>}
      {error && (
        <p className="text-sm text-destructive">
          Fout bij laden van budgetten: {(error as any)?.message ?? "onbekend"}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((b) => {
          const budget = b.budget_cents;
          const actual = b.actual_cents;

          const pct =
            budget === 0 ? 0 : Math.min(999, Math.round((Math.abs(actual) / Math.abs(budget)) * 100));

          // Voor uitgaven is actual vaak negatief (afhankelijk van jouw ingest),
          // dus we tonen “besteed” als absolute waarde.
          const spent = Math.abs(actual);
          const remaining = Math.max(0, Math.abs(budget) - spent);

          const over = pct > 90;

          return (
            <Card
              key={b.category_id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/budgetten/${encodeURIComponent(periodStart)}/${encodeURIComponent(b.category_id)}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/budgetten/${encodeURIComponent(periodStart)}/${encodeURIComponent(b.category_id)}`);
                }
              }}
              className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{b.category_name}</h3>
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                      maandelijks
                    </Badge>
                    <Badge
                      variant="outline"
                      className={[
                        "rounded-lg text-xs font-normal",
                        b.category_type === "income"
                          ? "text-income border-income/30"
                          : "text-expense border-expense/30",
                      ].join(" ")}
                    >
                      {b.category_type === "income" ? "inkomsten" : "uitgaven"}
                    </Badge>
                  </div>

                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>

                <Progress
                  value={pct}
                  className={`h-2 rounded-full ${
                    over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"
                  }`}
                />

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>€ {formatEUR(spent)} besteed</span>
                  <span>€ {formatEUR(remaining)} over</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          Geen budgetten gevonden voor {monthLabel(periodStart)}.
        </div>
      )}
    </div>
  );
};

export default Budgets;
