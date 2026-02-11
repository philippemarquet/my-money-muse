import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const mockBudgets = [
  { id: 1, naam: "Boodschappen", bedrag: 600, besteed: 420, type: "maandelijks", richting: "uitgaven" },
  { id: 2, naam: "Entertainment", bedrag: 200, besteed: 180, type: "maandelijks", richting: "uitgaven" },
  { id: 3, naam: "Transport", bedrag: 250, besteed: 120, type: "maandelijks", richting: "uitgaven" },
  { id: 4, naam: "Wonen", bedrag: 1500, besteed: 1245, type: "maandelijks", richting: "uitgaven" },
  { id: 5, naam: "Kleding", bedrag: 1200, besteed: 340, type: "jaarlijks", richting: "uitgaven" },
  { id: 6, naam: "Salaris", bedrag: 5000, besteed: 3850, type: "maandelijks", richting: "inkomsten" },
];

const Budgets = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Budgetten</h1>
        <p className="text-muted-foreground mt-1">Beheer je maandelijkse en jaarlijkse budgetten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBudgets.map((b) => {
          const pct = Math.round((b.besteed / b.bedrag) * 100);
          const over = pct > 90;
          return (
            <Card key={b.id} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{b.naam}</h3>
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                      {b.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-lg text-xs font-normal ${
                        b.richting === "inkomsten" ? "text-income border-income/30" : "text-expense border-expense/30"
                      }`}
                    >
                      {b.richting}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className={`h-2 rounded-full ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>€ {b.besteed.toFixed(2)} besteed</span>
                  <span>€ {(b.bedrag - b.besteed).toFixed(2)} over</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Budgets;
