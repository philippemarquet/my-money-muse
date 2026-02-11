import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const kpis = [
  { label: "Inkomsten", value: "€ 5.240", icon: TrendingUp, color: "text-income" },
  { label: "Uitgaven", value: "€ 3.180", icon: TrendingDown, color: "text-expense" },
  { label: "Netto", value: "€ 2.060", icon: Wallet, color: "text-accent" },
  { label: "Gespaard", value: "€ 1.200", icon: PiggyBank, color: "text-primary" },
];

const barData = [
  { maand: "Jan", uitgaven: 2800, inkomsten: 5100 },
  { maand: "Feb", uitgaven: 3180, inkomsten: 5240 },
  { maand: "Mrt", uitgaven: 2950, inkomsten: 5300 },
  { maand: "Apr", uitgaven: 3400, inkomsten: 5100 },
  { maand: "Mei", uitgaven: 2700, inkomsten: 5500 },
  { maand: "Jun", uitgaven: 3100, inkomsten: 5240 },
];

const pieData = [
  { name: "Wonen", value: 1200 },
  { name: "Boodschappen", value: 650 },
  { name: "Transport", value: 280 },
  { name: "Entertainment", value: 350 },
  { name: "Overig", value: 700 },
];

const PIE_COLORS = [
  "hsl(28, 40%, 48%)",
  "hsl(155, 25%, 45%)",
  "hsl(38, 80%, 55%)",
  "hsl(0, 55%, 55%)",
  "hsl(30, 10%, 50%)",
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je financiën</p>
      </div>

      {/* KPI Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Inkomsten vs. Uitgaven</h3>
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
            <h3 className="font-serif font-medium mb-4">Uitgaven per categorie</h3>
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
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-serif font-medium mb-4">Trend over tijd</h3>
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
