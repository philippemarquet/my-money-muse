import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type BudgetVsActualRow = {
  user_id: string;
  period_start: string;
  category_id: string;
  category_name: string;
  category_type: "income" | "expense" | "transfer";
  budget_cents: number;
  actual_cents: number;
};

function formatEUR(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

function parseAmountToCents(input: string): number | null {
  // accepteert "1234,56" of "1234.56"
  const cleaned = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

const BudgetDetail = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();

  const periodStart = params.periodStart ?? "";
  const categoryId = params.categoryId ?? "";

  const { data: row, isLoading, error } = useQuery({
    queryKey: ["budget-detail", periodStart, categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_budget_vs_actual_month")
        .select("user_id,period_start,category_id,category_name,category_type,budget_cents,actual_cents")
        .eq("period_start", periodStart)
        .eq("category_id", categoryId)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as BudgetVsActualRow | null;
    },
  });

  const [amountInput, setAmountInput] = useState<string>("");

  // zet input zodra row laadt
  useMemo(() => {
    if (row) setAmountInput((row.budget_cents / 100).toFixed(2).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.budget_cents]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!row) throw new Error("Budgetdetail niet geladen.");
      const cents = parseAmountToCents(amountInput);
      if (cents === null) throw new Error("Ongeldig bedrag.");

      // Upsert in budgets table (per maand)
      const { error } = await supabase.from("budgets").upsert({
        user_id: row.user_id,
        category_id: row.category_id,
        period_start: row.period_start,
        period_granularity: "month",
        amount_cents: cents,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets-vs-actual"] });
      await queryClient.invalidateQueries({ queryKey: ["budget-detail"] });
    },
  });

  const pct = useMemo(() => {
    if (!row) return 0;
    const budget = row.budget_cents;
    const actual = row.actual_cents;
    if (budget === 0) return 0;
    return Math.min(999, Math.round((Math.abs(actual) / Math.abs(budget)) * 100));
  }, [row]);

  const spent = row ? Math.abs(row.actual_cents) : 0;
  const remaining = row ? Math.max(0, Math.abs(row.budget_cents) - spent) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Budget detail</h1>
          <p className="text-muted-foreground mt-1">
            {row ? `${row.category_name} — ${monthLabel(row.period_start)}` : "Laden…"}
          </p>
        </div>

        <Button variant="secondary" className="rounded-xl" onClick={() => navigate("/budgetten")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Laden…</p>}
      {error && (
        <p className="text-sm text-destructive">
          Fout bij laden: {(error as any)?.message ?? "onbekend"}
        </p>
      )}

      {row && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-sm text-muted-foreground">{pct}%</p>
              </div>

              <Progress value={pct} className="h-2 rounded-full" />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>€ {formatEUR(spent)} besteed</span>
                <span>€ {formatEUR(remaining)} over</span>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-sm font-medium">Budgetbedrag (EUR)</p>
                <div className="flex gap-2">
                  <Input
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="rounded-xl border-0 bg-card shadow-sm"
                    placeholder="Bijv. 600,00"
                  />
                  <Button
                    className="rounded-xl"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Opslaan…" : "Opslaan"}
                  </Button>
                </div>
                {saveMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(saveMutation.error as any)?.message ?? "Opslaan mislukt"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-muted-foreground">Acties</p>

              <Button
                className="rounded-xl w-full"
                onClick={() =>
                  navigate(`/transacties?category=${encodeURIComponent(row.category_id)}`)
                }
              >
                Bekijk transacties in deze categorie
              </Button>

              <Button
                variant="secondary"
                className="rounded-xl w-full"
                onClick={() => navigate("/categorieen")}
              >
                Naar categorieën
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BudgetDetail;
