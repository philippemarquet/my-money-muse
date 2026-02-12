import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  const nl = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
  return nl[d.getMonth()];
}

const PIE_COLORS = [
  "hsl(28, 40%, 48%)",
  "hsl(155, 25%, 45%)",
  "hsl(38, 80%, 55%)",
  "hsl(0, 55%, 55%)",
  "hsl(30, 10%, 50%)",
  "hsl(155, 30%, 42%)",
];

const Dashboard = () => {
  const { data: transactions = [] } = useTransactions();

  const now = new Date();

  const kpis = useMemo(() => {
    // this month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const d = new Date(t.datum);
      if (d < start || d > now) continue;

      if (t.bedrag >= 0) income += t.bedrag;
      else expense += Math.abs(t.bedrag);
    }

    const net = income - expense;

    // "Gespaard" = netto voor nu (simpel) — later kunnen we dit verbeteren met transfers/targets
    const saved = Math.max(0, net);

    return [
      { label: "Inkomsten", value: income, icon: TrendingUp, color: "text-income" },
      { label: "Uitgaven", value: expense, icon: TrendingDown, color: "text-expense" },
      { label: "Netto", value: net, icon: Wallet, color: "text-accent" },
      { label: "Gespaard", value: saved, icon: PiggyBank, color: "text-primary" },
    ];
  }, [transactions, now]);

  const barData = useMemo(() => {
    // last 6 months including current
    const months: { key: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({ key: monthKey(start), label: monthLabel(start), start, end });
    }

    const map = new Map<string, { maand: string; uitgaven: number; inkomsten: number }>();
    months.forEach((m) => map.set(m.key, { maand: m.label, uitgaven: 0, inkomsten: 0 }));

    for (const t of transactions) {
      const d = new Date(t.datum);
      const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      if (!map.has(key)) continue;

      if (t.bedrag >= 0) map.get(key)!.inkomsten += t.bedrag;
      else map.get(key)!.uitgaven += Math.abs(t.bedrag);
    }

    return months.map((m) => map.get(m.key)!);
  }, [transactions, now]);

  const pieData = useMemo(() => {
    // this month expenses by category (top 5 + overig)
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const totals = new Map<string, number>();

    for (const t of transactions) {
      const d = new Date(t.datum);
      if (d < start || d > now) continue;
      if (t.bedrag >= 0) continue;

      const name =
        t.subcategories?.categories?.naam ??
        t.categories?.naam ??
        "Onbekend";

      totals.set(name, (totals.get(name) ?? 0) + Math.abs(t.bedrag));
    }

    const arr = Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const top = arr.slice(0, 5);
    const rest = arr.slice(5).reduce((sum, x) => sum + x.value, 0);

    if (rest > 0) top.push({ name: "Overig", value: rest });
    return top;
  }, [transactions, now]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je financiën (huidige maand)</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold mt-1">
                    € {kpi.value.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`rounded-xl bg-secondary p-3 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Inkomsten vs. Uitgaven (6 maanden)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="maand" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="inkomsten" fill="hsl(155, 25%, 45%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="uitgaven" fill="hsl(0, 55%, 55%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Uitgaven per categorie (huidige maand)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Trend over tijd (6 maanden)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="maand" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Line type="monotone" dataKey="inkomsten" stroke="hsl(155, 25%, 45%)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="uitgaven" stroke="hsl(0, 55%, 55%)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
