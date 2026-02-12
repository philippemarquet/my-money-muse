import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useBudgets, Budget } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";

const Budgets = () => {
  const { data: budgets = [], create, update, remove } = useBudgets();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    naam: "",
    bedrag: "",
    type: "maandelijks",
    richting: "uitgaven",
    rollover: false,
    category_ids: [] as string[],
  });

  const resetForm = () =>
    setForm({ naam: "", bedrag: "", type: "maandelijks", richting: "uitgaven", rollover: false, category_ids: [] });

  const openEdit = (b: Budget) => {
    setForm({
      naam: b.naam,
      bedrag: String(b.bedrag),
      type: b.type,
      richting: b.richting,
      rollover: b.rollover,
      category_ids: b.budget_categories?.map((bc) => bc.category_id) || [],
    });
    setEditing(b);
  };

  const handleSave = async () => {
    try {
      const payload = {
        naam: form.naam,
        bedrag: parseFloat(form.bedrag),
        type: form.type,
        richting: form.richting,
        rollover: form.rollover,
        category_ids: form.category_ids,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Budget bijgewerkt");
      } else {
        await create.mutateAsync(payload);
        toast.success("Budget aangemaakt");
      }
      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleCategory = (catId: string) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(catId)
        ? f.category_ids.filter((id) => id !== catId)
        : [...f.category_ids, catId],
    }));
  };

  // Calculate spent per budget based on linked categories
  const getSpent = (b: Budget) => {
    const catIds = b.budget_categories?.map((bc) => bc.category_id) || [];
    if (catIds.length === 0) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const start = b.type === "maandelijks" ? startOfMonth : startOfYear;
    return transactions
      .filter((t) => {
        if (!t.category_id || !catIds.includes(t.category_id)) return false;
        const d = new Date(t.datum);
        return d >= start && d <= now;
      })
      .reduce((sum, t) => sum + Math.abs(t.bedrag), 0);
  };

  const dialogOpen = showAdd || !!editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Budgetten</h1>
          <p className="text-muted-foreground mt-1">Beheer je maandelijkse en jaarlijkse budgetten</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Toevoegen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">Nog geen budgetten. Maak er een aan!</p>
        )}
        {budgets.map((b) => {
          const spent = getSpent(b);
          const pct = b.bedrag > 0 ? Math.round((spent / Number(b.bedrag)) * 100) : 0;
          const over = pct > 90;
          return (
            <Card key={b.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(b)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{b.naam}</h3>
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">{b.type}</Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-lg text-xs font-normal ${
                        b.richting === "inkomsten" ? "text-income border-income/30" : "text-expense border-expense/30"
                      }`}
                    >
                      {b.richting}
                    </Badge>
                    {b.rollover && <Badge variant="outline" className="rounded-lg text-xs font-normal">rollover</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{pct}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Budget verwijderen?")) {
                          remove.mutateAsync(b.id).then(() => toast.success("Verwijderd"));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Progress value={Math.min(pct, 100)} className={`h-2 rounded-full ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>€ {spent.toFixed(2)} besteed</span>
                  <span>€ {Math.max(0, Number(b.bedrag) - spent).toFixed(2)} over</span>
                </div>
                {b.budget_categories && b.budget_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {b.budget_categories.map((bc) => (
                      <Badge key={bc.category_id} variant="secondary" className="rounded-lg text-xs font-normal">
                        {bc.categories?.naam}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditing(null); setShowAdd(false); } }}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Budget bewerken" : "Nieuw budget"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bedrag</Label>
                <Input type="number" step="0.01" value={form.bedrag} onChange={(e) => setForm({ ...form, bedrag: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Periode</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="maandelijks">Maandelijks</SelectItem>
                    <SelectItem value="jaarlijks">Jaarlijks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Richting</Label>
                <Select value={form.richting} onValueChange={(v) => setForm({ ...form, richting: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="uitgaven">Uitgaven</SelectItem>
                    <SelectItem value="inkomsten">Inkomsten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1 gap-2">
                <Switch checked={form.rollover} onCheckedChange={(v) => setForm({ ...form, rollover: v })} />
                <Label>Roll-over</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categorieën</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {categories
                  .filter((c) => c.type === form.richting)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.category_ids.includes(c.id)}
                        onCheckedChange={() => toggleCategory(c.id)}
                      />
                      <span className="text-sm">{c.naam}</span>
                    </div>
                  ))}
                {categories.filter((c) => c.type === form.richting).length === 0 && (
                  <p className="text-xs text-muted-foreground">Geen categorieën voor {form.richting}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditing(null); setShowAdd(false); }}>Annuleren</Button>
            <Button className="rounded-xl" onClick={handleSave}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;
