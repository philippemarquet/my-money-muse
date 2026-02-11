import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type AccountRow = {
  id: string;
  name: string;
  iban: string | null;
  balance_cents: number | null;
  currency: string;
};

const Accounts = () => {
  const navigate = useNavigate();
  const params = useParams();
  const accountId = params.id ?? null;

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id,name,iban,balance_cents,currency")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as AccountRow[];
    },
  });

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  // Simple detail view: toont dezelfde cards, maar highlight de gekozen rekening
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Rekeningen</h1>
          <p className="text-muted-foreground mt-1">
            Overzicht van al je bankrekeningen
            {selectedAccount ? ` — ${selectedAccount.name}` : ""}
          </p>
        </div>

        {selectedAccount && (
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate("/rekeningen")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Laden…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const isSelected = acc.id === accountId;

          return (
            <Card
              key={acc.id}
              onClick={() => navigate(`/rekeningen/${acc.id}`)}
              className={[
                "border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer",
                isSelected ? "ring-2 ring-primary" : "",
              ].join(" ")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{acc.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {acc.iban ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="text-2xl font-semibold tabular-nums">
                  €{" "}
                  {((acc.balance_cents ?? 0) / 100).toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedAccount && (
        <div className="pt-2">
          <Button
            className="rounded-xl"
            onClick={() => navigate(`/transacties?account=${selectedAccount.id}`)}
          >
            Bekijk transacties van deze rekening
          </Button>
        </div>
      )}
    </div>
  );
};

export default Accounts;
