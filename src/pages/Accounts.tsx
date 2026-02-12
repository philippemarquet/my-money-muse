import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { useSpace } from "@/hooks/useSpace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Accounts = () => {
  const { data: accounts = [], create, update, remove } = useAccounts();
  const { spaces, selectedSpaceId, effectiveSpaceId } = useSpace();

  const [editing, setEditing] = useState<Account | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    naam: "",
    rekeningnummer: "",
    alias: "",
    saldo: "",
    household_id: "",
  });

  const dialogOpen = showAdd || !!editing;

  const spaceLabelById = useMemo(() => {
    const map = new Map<string, string>();
    spaces.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [spaces]);

  const resetForm = () =>
    setForm({
      naam: "",
      rekeningnummer: "",
      alias: "",
      saldo: "",
      household_id: effectiveSpaceId ?? "",
    });

  const openEdit = (a: Account) => {
    setForm({
      naam: a.naam,
      rekeningnummer: a.rekeningnummer,
      alias: a.alias || "",
      saldo: String(a.saldo),
      household_id: a.household_id,
    });
    setEditing(a);
  };

  const handleSave = async () => {
    try {
      const payload = {
        naam: form.naam.trim(),
        rekeningnummer: form.rekeningnummer.trim(),
        alias: form.alias.trim() ? form.alias.trim() : null,
        saldo: parseFloat(form.saldo) || 0,
        household_id: form.household_id || effectiveSpaceId || "",
      };

      if (!payload.naam) return toast.error("Naam is verplicht");
      if (!payload.rekeningnummer) return toast.error("Rekeningnummer is verplicht");
      if (!payload.household_id) return toast.error("Kies een space");

      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          naam: payload.naam,
          rekeningnummer: payload.rekeningnummer,
          alias: payload.alias,
          saldo: payload.saldo,
          household_id: payload.household_id,
        });
        toast.success("Rekening bijgewerkt");
      } else {
        await create.mutateAsync({
          naam: payload.naam,
          rekeningnummer: payload.rekeningnummer,
          alias: payload.alias,
          saldo: payload.saldo,
          household_id: payload.household_id,
        });
        toast.success("Rekening toegevoegd");
      }

      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message ?? "Opslaan mislukt");
    }
  };

  const handleQuickMove = async (acc: Account, newSpaceId: string) => {
    try {
      if (acc.household_id === newSpaceId) return;
      await update.mutateAsync({ id: acc.id, household_id: newSpaceId });
      toast.success("Rekening verplaatst");
    } catch (e: any) {
      toast.error(e?.message ?? "Verplaatsen mislukt");
    }
  };

  const handleDelete = async (acc: Account) => {
    try {
      if (!confirm(`Rekening "${acc.naam}" verwijderen?`)) return;
      await remove.mutateAsync(acc.id);
      toast.success("Rekening verwijderd");
    } catch (e: any) {
      toast.error(e?.message ?? "Verwijderen mislukt");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Rekeningen</h1>
          <p className="text-muted-foreground mt-1">
            Overzicht van al je bankrekeningen{selectedSpaceId === null ? " (alles)" : ""}
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">
            Nog geen rekeningen. Voeg er een toe!
          </p>
        )}

        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openEdit(acc)}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{acc.naam}</h3>
                    <p className="text-xs text-muted-foreground font-mono truncate">{acc.rekeningnummer}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(acc);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold tabular-nums">
                  € {Number(acc.saldo).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                </p>

                <div className="w-[190px]" onClick={(e) => e.stopPropagation()}>
                  <Select value={acc.household_id} onValueChange={(v) => handleQuickMove(acc, v)}>
                    <SelectTrigger className="rounded-xl border-0 bg-card shadow-sm">
                      <SelectValue placeholder="Space" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      {spaces.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">
                    {spaceLabelById.get(acc.household_id) ?? "Space"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            <DialogTitle className="font-serif">{editing ? "Rekening bewerken" : "Nieuwe rekening"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input
                value={form.naam}
                onChange={(e) => setForm({ ...form, naam: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>IBAN / Rekeningnummer</Label>
              <Input
                value={form.rekeningnummer}
                onChange={(e) => setForm({ ...form, rekeningnummer: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Alias (optioneel)</Label>
              <Input
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Saldo</Label>
              <Input
                type="number"
                step="0.01"
                value={form.saldo}
                onChange={(e) => setForm({ ...form, saldo: e.target.value })}
                className="rounded-xl"
              />
            </div>

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
                Tip: als je bovenin “Alles” hebt gekozen, kies hier expliciet je space.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setEditing(null);
                setShowAdd(false);
              }}
            >
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

export default Accounts;
