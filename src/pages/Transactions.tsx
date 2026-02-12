import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SubcategoryPicker, SubPick } from "@/components/SubcategoryPicker";

function alphaBackground(color: string, alpha = 0.14) {
  const c = (color ?? "").trim();
  const hslMatch = c.match(/^hsl\((.+)\)$/i);
  if (hslMatch) return `hsla(${hslMatch[1]}, ${alpha})`;
  const hexMatch = c.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) return `${c}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  return `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`;
}

const Transactions = () => {
  const { data: transactions = [], create, update, remove } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("alle");

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkSubId, setBulkSubId] = useState("");

  const subOptions: SubPick[] = useMemo(() => {
    const out: SubPick[] = [];
    for (const c of categories) {
      for (const s of c.subcategories ?? []) {
        out.push({
          sub_id: s.id,
          sub_name: s.naam,
          cat_id: c.id,
          cat_name: c.naam,
          cat_type: c.type as any,
          cat_color: c.kleur,
          cat_icon: (c as any).icoon,
        });
      }
    }
    return out.sort((a, b) => (a.cat_name + a.sub_name).localeCompare(b.cat_name + b.sub_name));
  }, [categories]);

  const [form, setForm] = useState({
    datum: new Date().toISOString().split("T")[0],
    omschrijving: "",
    bedrag: "",
    iban_tegenrekening: "",
    alias_tegenrekening: "",
    account_id: "",
    subcategory_id: "",
    notitie: "",
  });

  const resetForm = () =>
    setForm({
      datum: new Date().toISOString().split("T")[0],
      omschrijving: "",
      bedrag: "",
      iban_tegenrekening: "",
      alias_tegenrekening: "",
      account_id: "",
      subcategory_id: "",
      notitie: "",
    });

  const openEdit = (t: Transaction) => {
    setForm({
      datum: t.datum,
      omschrijving: t.omschrijving,
      bedrag: String(t.bedrag),
      iban_tegenrekening: t.iban_tegenrekening || "",
      alias_tegenrekening: t.alias_tegenrekening || "",
      account_id: t.account_id || "",
      subcategory_id: t.subcategory_id || "",
      notitie: t.notitie || "",
    });
    setEditing(t);
  };

  const handleSave = async () => {
    try {
      if (!form.subcategory_id) {
        toast.error("Kies een subcategorie (subcategorie is verplicht).");
        return;
      }

      const payload: any = {
        datum: form.datum,
        omschrijving: form.omschrijving,
        bedrag: parseFloat(form.bedrag),
        iban_tegenrekening: form.iban_tegenrekening || undefined,
        alias_tegenrekening: form.alias_tegenrekening || undefined,
        account_id: form.account_id || undefined,
        subcategory_id: form.subcategory_id,
        notitie: form.notitie || undefined,
      };

      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Transactie bijgewerkt");
      } else {
        await create.mutateAsync(payload);
        toast.success("Transactie toegevoegd");
      }

      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message ?? "Opslaan mislukt");
    }
  };

  const handleBulkSubcategory = async () => {
    if (!bulkSubId || selected.length === 0) return;

    try {
      for (const id of selected) {
        await update.mutateAsync({ id, subcategory_id: bulkSubId } as any);
      }
      toast.success(`${selected.length} transacties toegewezen`);
      setSelected([]);
      setBulkSubId("");
    } catch (err: any) {
      toast.error(err?.message ?? "Bulk update mislukt");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.omschrijving.toLowerCase().includes(search.toLowerCase()) ||
      (t.alias_tegenrekening || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "alle"
        ? true
        : filter === "zonder"
        ? !t.subcategory_id
        : filter === "inkomsten"
        ? t.bedrag > 0
        : filter === "uitgaven"
        ? t.bedrag < 0
        : true;

    return matchesSearch && matchesFilter;
  });

  const dialogOpen = showAdd || !!editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Transacties</h1>
          <p className="text-muted-foreground mt-1">Beheer en categoriseer je transacties</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
          className="rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" /> Toevoegen
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek transacties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-0 bg-card shadow-sm"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-xl border-0 bg-card shadow-sm">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-0 shadow-lg">
            <SelectItem value="alle">Alle transacties</SelectItem>
            <SelectItem value="zonder">Zonder subcategorie</SelectItem>
            <SelectItem value="inkomsten">Inkomsten</SelectItem>
            <SelectItem value="uitgaven">Uitgaven</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 && (
        <Card className="border-0 shadow-sm rounded-2xl bg-primary/5">
          <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-medium">{selected.length} geselecteerd</span>

            <div className="w-full sm:w-[420px]">
              <SubcategoryPicker value={bulkSubId} onChange={setBulkSubId} options={subOptions} placeholder="Subcategorie toewijzen" />
            </div>

            <Button size="sm" className="rounded-xl" onClick={handleBulkSubcategory} disabled={!bulkSubId}>
              Toepassen
            </Button>

            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setSelected([])}>
              Wissen
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Geen transacties gevonden</p>
        )}

        {filtered.map((t) => {
          const cat = t.subcategories?.categories ?? t.categories ?? null;
          const subName = t.subcategories?.naam ?? null;

          const label = cat && subName ? `${cat.naam} / ${subName}` : cat ? cat.naam : null;
          const color = (cat as any)?.kleur ?? "hsl(30, 10%, 50%)";

          return (
            <Card
              key={t.id}
              className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEdit(t)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Checkbox
                  checked={selected.includes(t.id)}
                  onCheckedChange={() => toggleSelect(t.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{t.omschrijving}</p>

                    {label ? (
                      <Badge
                        variant="secondary"
                        className="rounded-lg text-xs font-normal"
                        style={{ backgroundColor: alphaBackground(color), color }}
                      >
                        {label}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs font-normal text-muted-foreground border-dashed"
                      >
                        Geen subcategorie
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{t.datum}</span>
                    {t.accounts && <span>{t.accounts.naam}</span>}
                    {t.alias_tegenrekening && <span className="truncate">{t.alias_tegenrekening}</span>}
                  </div>
                </div>

                <p className={cn("font-semibold tabular-nums whitespace-nowrap ml-4", t.bedrag >= 0 ? "text-income" : "text-expense")}>
                  {t.bedrag >= 0 ? "+" : ""}€ {Math.abs(t.bedrag).toFixed(2)}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Transactie verwijderen?")) {
                      remove.mutateAsync(t.id).then(() => toast.success("Verwijderd"));
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setShowAdd(false);
          }
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Transactie bewerken" : "Nieuwe transactie"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={form.datum}
                  onChange={(e) => setForm({ ...form, datum: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Bedrag</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.bedrag}
                  onChange={(e) => setForm({ ...form, bedrag: e.target.value })}
                  className="rounded-xl"
                  placeholder="-67.43"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Omschrijving</Label>
              <Input
                value={form.omschrijving}
                onChange={(e) => setForm({ ...form, omschrijving: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>IBAN tegenrekening</Label>
                <Input
                  value={form.iban_tegenrekening}
                  onChange={(e) => setForm({ ...form, iban_tegenrekening: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Alias</Label>
                <Input
                  value={form.alias_tegenrekening}
                  onChange={(e) => setForm({ ...form, alias_tegenrekening: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rekening</Label>
              <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Kies rekening" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategorie (verplicht)</Label>
              <SubcategoryPicker
                value={form.subcategory_id}
                onChange={(subId) => setForm({ ...form, subcategory_id: subId })}
                options={subOptions}
              />
            </div>

            <div className="space-y-2">
              <Label>Notitie</Label>
              <Textarea
                value={form.notitie}
                onChange={(e) => setForm({ ...form, notitie: e.target.value })}
                className="rounded-xl"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditing(null); setShowAdd(false); }}>
              Annuleren
            </Button>
            <Button className="rounded-xl" onClick={handleSave}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
