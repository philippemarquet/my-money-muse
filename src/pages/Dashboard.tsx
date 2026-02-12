import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useMemo } from "react";

const PIE_COLORS = [
  "hsl(28, 40%, 48%)", "hsl(155, 25%, 45%)", "hsl(38, 80%, 55%)",
  "hsl(0, 55%, 55%)", "hsl(220, 40%, 50%)", "hsl(280, 40%, 50%)",
  "hsl(180, 30%, 45%)", "hsl(30, 10%, 50%)",
];

const Dashboard = () => {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.datum);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const inkomsten = thisMonth.filter((t) => t.bedrag > 0).reduce((s, t) => s + Number(t.bedrag), 0);
    const uitgaven = thisMonth.filter((t) => t.bedrag < 0).reduce((s, t) => s + Math.abs(Number(t.bedrag)), 0);
    return { inkomsten, uitgaven, netto: inkomsten - uitgaven };
  }, [transactions]);

  const barData = useMemo(() => {
    const months: Record<string, { maand: string; uitgaven: number; inkomsten: number }> = {};
    const monthNames = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
    transactions.forEach((t) => {
      const d = new Date(t.datum);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) months[key] = { maand: monthNames[d.getMonth()], uitgaven: 0, inkomsten: 0 };
      if (t.bedrag > 0) months[key].inkomsten += Number(t.bedrag);
      else months[key].uitgaven += Math.abs(Number(t.bedrag));
    });
    return Object.values(months).slice(-6);
  }, [transactions]);

  const pieData = useMemo(() => {
    const catTotals: Record<string, { name: string; value: number }> = {};
    transactions
      .filter((t) => t.bedrag < 0 && t.category_id)
      .forEach((t) => {
        const catName = t.categories?.naam || "Overig";
        if (!catTotals[catName]) catTotals[catName] = { name: catName, value: 0 };
        catTotals[catName].value += Math.abs(Number(t.bedrag));
      });
    return Object.values(catTotals);
  }, [transactions]);

  const kpis = [
    { label: "Inkomsten", value: `€ ${stats.inkomsten.toFixed(0)}`, icon: TrendingUp, color: "text-income" },
    { label: "Uitgaven", value: `€ ${stats.uitgaven.toFixed(0)}`, icon: TrendingDown, color: "text-expense" },
    { label: "Netto", value: `€ ${stats.netto.toFixed(0)}`, icon: Wallet, color: "text-accent" },
    { label: "Transacties", value: String(transactions.length), icon: PiggyBank, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je financiën</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold mt-1">{kpi.value}</p>
                </div>
                <div className={`rounded-xl bg-secondary p-3 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Inkomsten vs. Uitgaven</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barGap={4}>
                  <XAxis dataKey="maand" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="inkomsten" fill="hsl(155, 25%, 45%)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="uitgaven" fill="hsl(0, 55%, 55%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-16">Nog geen transacties</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Uitgaven per categorie</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
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
              </>
            ) : (
              <p className="text-muted-foreground text-center py-16">Nog geen gecategoriseerde uitgaven</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Trend over tijd</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                  <XAxis dataKey="maand" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Line type="monotone" dataKey="inkomsten" stroke="hsl(155, 25%, 45%)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="uitgaven" stroke="hsl(0, 55%, 55%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-16">Nog geen transacties</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
