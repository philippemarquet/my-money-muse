import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { toast } from "sonner";

const Accounts = () => {
  const { data: accounts = [], create, update, remove } = useAccounts();
  const [editing, setEditing] = useState<Account | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ naam: "", rekeningnummer: "", alias: "", saldo: "" });

  const resetForm = () => setForm({ naam: "", rekeningnummer: "", alias: "", saldo: "" });

  const openEdit = (a: Account) => {
    setForm({ naam: a.naam, rekeningnummer: a.rekeningnummer, alias: a.alias || "", saldo: String(a.saldo) });
    setEditing(a);
  };

  const handleSave = async () => {
    try {
      const payload = {
        naam: form.naam,
        rekeningnummer: form.rekeningnummer,
        alias: form.alias || undefined,
        saldo: parseFloat(form.saldo) || 0,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Rekening bijgewerkt");
      } else {
        await create.mutateAsync(payload);
        toast.success("Rekening toegevoegd");
      }
      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const dialogOpen = showAdd || !!editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Rekeningen</h1>
          <p className="text-muted-foreground mt-1">Overzicht van al je bankrekeningen</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Toevoegen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">Nog geen rekeningen. Voeg er een toe!</p>
        )}
        {accounts.map((acc) => (
          <Card key={acc.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(acc)}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{acc.naam}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{acc.rekeningnummer}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Rekening verwijderen?")) {
                      remove.mutateAsync(acc.id).then(() => toast.success("Verwijderd"));
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                € {Number(acc.saldo).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditing(null); setShowAdd(false); } }}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Rekening bewerken" : "Nieuwe rekening"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="rounded-xl" placeholder="Gezamenlijk" />
            </div>
            <div className="space-y-2">
              <Label>IBAN / Rekeningnummer</Label>
              <Input value={form.rekeningnummer} onChange={(e) => setForm({ ...form, rekeningnummer: e.target.value })} className="rounded-xl" placeholder="NL91BUNQ0123456789" />
            </div>
            <div className="space-y-2">
              <Label>Alias (optioneel)</Label>
              <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Saldo</Label>
              <Input type="number" step="0.01" value={form.saldo} onChange={(e) => setForm({ ...form, saldo: e.target.value })} className="rounded-xl" placeholder="0.00" />
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

export default Accounts;
