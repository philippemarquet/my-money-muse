import { Card, CardContent } from "@/components/ui/card";
import { Landmark } from "lucide-react";

const mockAccounts = [
  { id: 1, naam: "Gezamenlijk", rekeningnummer: "NL91BUNQ0123456789", saldo: 4280.50 },
  { id: 2, naam: "Privé", rekeningnummer: "NL44BUNQ9876543210", saldo: 1350.20 },
  { id: 3, naam: "Zakelijk", rekeningnummer: "NL88BUNQ4433221100", saldo: 8920.00 },
  { id: 4, naam: "Spaarrekening", rekeningnummer: "NL55BUNQ1122334455", saldo: 15400.00 },
];

const Accounts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Rekeningen</h1>
        <p className="text-muted-foreground mt-1">Overzicht van al je bankrekeningen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAccounts.map((acc) => (
          <Card key={acc.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{acc.naam}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{acc.rekeningnummer}</p>
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                € {acc.saldo.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
