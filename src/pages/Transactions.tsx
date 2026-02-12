import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useSpace } from "@/hooks/useSpace";
import { SubcategoryPicker } from "@/components/SubcategoryPicker";
import type { SubPick } from "@/components/SubcategoryPicker";

const Transactions = () => {
  const { data: transactions = [], update } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { spaces, selectedSpaceId, effectiveSpaceId } = useSpace();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("alle"); // alle | zonder | inkomsten | uitgaven
  const [spaceFilterWhenAll, setSpaceFilterWhenAll] = useState<string>("__ALL__");

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  const subOptionsAll: SubPick[] = useMemo(() => {
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

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // when top selector is "Alles", optional additional filter
      if (selectedSpaceId === null && spaceFilterWhenAll !== "__ALL__") {
        if (t.household_id !== spaceFilterWhenAll) return false;
      }

      const s = search.trim().toLowerCase();
      const matchesSearch =
        !s ||
        t.omschrijving?.toLowerCase().includes(s) ||
        (t.alias_tegenrekening ?? "").toLowerCase().includes(s) ||
        (t.iban_tegenrekening ?? "").toLowerCase().includes(s);

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
  }, [transactions, search, filter, selectedSpaceId, spaceFilterWhenAll]);

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setOpen(true);
  };

  const [form, setForm] = useState({
    account_id: "",
    household_id: "",
    subcategory_id: "",
    notitie: "",
  });

  const resetFormFromTx = (t: Transaction) => {
    setForm({
      account_id: t.account_id ?? "",
      household_id: t.household_id ?? (effectiveSpaceId ?? ""),
      subcategory_id: t.subcategory_id ?? "",
      notitie: t.notitie ?? "",
    });
  };

  const selectedSub = useMemo(() => {
    if (!form.subcategory_id) return null;
    return subOptionsAll.find((s) => s.sub_id === form.subcategory_id) ?? null;
  }, [form.subcategory_id, subOptionsAll]);

  const save = async () => {
    try {
      if (!editing) return;

      if (!form.subcategory_id) {
        toast.error("Kies een subcategorie");
        return;
      }

      // als user in Alles staat: household_id moet gezet zijn (direct of via account)
      let householdIdToWrite = editing.household_id;

      // als er account gekozen is: space = account.household_id (consistent)
      if (form.account_id) {
        const acc = accounts.find((a) => a.id === form.account_id);
        if (acc?.household_id) householdIdToWrite = acc.household_id;
      } else if (selectedSpaceId === null) {
        // geen account gekozen en in Alles: neem gekozen household_id uit form (of effective fallback)
        householdIdToWrite = form.household_id || effectiveSpaceId || "";
      }

      if (!householdIdToWrite) {
        toast.error("Kies een space (of kies een rekening)");
        return;
      }

      await update.mutateAsync({
        id: editing.id,
        account_id: form.account_id || null,
        household_id: householdIdToWrite,
        subcategory_id: form.subcategory_id,
        notitie: form.notitie || null,
      });

      toast.success("Transactie bijgewerkt");
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Opslaan mislukt");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Transacties</h1>
          <p className="text-muted-foreground mt-1">Beheer en categoriseer je transacties</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
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
              <SelectItem value="zonder">Zonder categorie</SelectItem>
              <SelectItem value="inkomsten">Inkomsten</SelectItem>
              <SelectItem value="uitgaven">Uitgaven</SelectItem>
            </SelectContent>
          </Select>

          {selectedSpaceId === null && (
            <Select value={spaceFilterWhenAll} onValueChange={setSpaceFilterWhenAll}>
              <SelectTrigger className="w-[240px] rounded-xl border-0 bg-card shadow-sm">
                <SelectValue placeholder="Filter op space" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-lg">
                <SelectItem value="__ALL__">Alle spaces</SelectItem>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-10">
            Geen transacties gevonden.
          </div>
        )}

        {filtered.map((t) => (
          <Card
            key={t.id}
            className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              resetFormFromTx(t);
              openEdit(t);
            }}
          >
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{t.omschrijving}</p>

                  {t.subcategories?.categories?.naam && t.subcategories?.naam ? (
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                      {t.subcategories.categories.naam} / {t.subcategories.naam}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-lg text-xs font-normal text-muted-foreground border-dashed">
                      Geen subcategorie
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>{t.datum}</span>
                  <span>{t.accounts?.naam ?? "—"}</span>
                  <span className="truncate">{t.alias_tegenrekening ?? "—"}</span>
                </div>

                {t.notitie && (
                  <div className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    Notitie: {t.notitie}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <p className={`font-semibold tabular-nums whitespace-nowrap ${t.bedrag >= 0 ? "text-income" : "text-expense"}`}>
                  {t.bedrag >= 0 ? "+" : ""}€ {Math.abs(t.bedrag).toFixed(2)}
                </p>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Transactie bewerken</DialogTitle>
          </DialogHeader>

          {!editing ? (
            <div className="text-sm text-muted-foreground">—</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3">
                <div className="text-sm font-medium truncate">{editing.omschrijving}</div>
                <div className="text-xs text-muted-foreground flex justify-between mt-1">
                  <span>{editing.datum}</span>
                  <span className={editing.bedrag >= 0 ? "text-income" : "text-expense"}>
                    {editing.bedrag >= 0 ? "+" : ""}€ {Math.abs(editing.bedrag).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedSpaceId === null && !form.account_id && (
                <div className="space-y-2">
                  <Label>Space</Label>
                  <Select value={form.household_id} onValueChange={(v) => setForm({ ...form, household_id: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Kies space" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      {spaces.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Kies een rekening óf kies hier de space (alleen nodig als je in “Alles” staat).
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Rekening</Label>
                <Select value={form.account_id || "__NONE__"} onValueChange={(v) => setForm({ ...form, account_id: v === "__NONE__" ? "" : v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Kies rekening" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg">
                    <SelectItem value="__NONE__">— Geen rekening —</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Als je een rekening kiest, bepaalt die automatisch de space.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Subcategorie</Label>
                <SubcategoryPicker
                  value={form.subcategory_id || null}
                  onChange={(id) => setForm({ ...form, subcategory_id: id })}
                  options={subOptionsAll}
                  placeholder="Kies subcategorie"
                  showSearch
                />
                {selectedSub && (
                  <div className="text-xs text-muted-foreground">
                    Gekozen: <span className="font-medium">{selectedSub.cat_name}</span> / {selectedSub.sub_name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notitie</Label>
                <Textarea
                  value={form.notitie}
                  onChange={(e) => setForm({ ...form, notitie: e.target.value })}
                  className="rounded-xl"
                  placeholder="Optioneel..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Sluiten
            </Button>
            <Button className="rounded-xl" onClick={save} disabled={!editing}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
