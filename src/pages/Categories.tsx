import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Home, Car, Film, Briefcase, Gift, Heart, Utensils,
  Plus, Trash2, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCategories, Category, Subcategory } from "@/hooks/useCategories";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  ShoppingCart, Home, Car, Film, Briefcase, Gift, Heart, Utensils,
};
const iconOptions = Object.keys(iconMap);

const colorOptions = [
  "hsl(28, 40%, 48%)", "hsl(155, 25%, 45%)", "hsl(38, 80%, 55%)",
  "hsl(0, 55%, 55%)", "hsl(220, 40%, 50%)", "hsl(280, 40%, 50%)",
  "hsl(180, 30%, 45%)", "hsl(340, 50%, 50%)",
];

const Categories = () => {
  const { data: categories = [], create, update, remove, addSub, removeSub } = useCategories();
  const [editing, setEditing] = useState<(Category & { subcategories: Subcategory[] }) | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ naam: "", kleur: colorOptions[0], icoon: "ShoppingCart", type: "uitgaven" });
  const [newSub, setNewSub] = useState("");

  const resetForm = () => setForm({ naam: "", kleur: colorOptions[0], icoon: "ShoppingCart", type: "uitgaven" });

  const openEdit = (c: Category & { subcategories: Subcategory[] }) => {
    setForm({ naam: c.naam, kleur: c.kleur, icoon: c.icoon, type: c.type });
    setEditing(c);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, naam: form.naam, kleur: form.kleur, icoon: form.icoon, type: form.type });
        toast.success("Categorie bijgewerkt");
      } else {
        await create.mutateAsync(form);
        toast.success("Categorie toegevoegd");
      }
      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddSub = async () => {
    if (!editing || !newSub.trim()) return;
    try {
      await addSub.mutateAsync({ category_id: editing.id, naam: newSub.trim() });
      setNewSub("");
      toast.success("Subcategorie toegevoegd");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const dialogOpen = showAdd || !!editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Categorieën</h1>
          <p className="text-muted-foreground mt-1">Beheer je categorieën en subcategorieën</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Toevoegen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 && (
          <p className="text-muted-foreground col-span-3 text-center py-8">Nog geen categorieën. Maak er een aan!</p>
        )}
        {categories.map((cat) => {
          const Icon = iconMap[cat.icoon] || ShoppingCart;
          return (
            <Card key={cat.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(cat)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: cat.kleur + "22", color: cat.kleur }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{cat.naam}</h3>
                      <Badge variant="outline" className="text-xs rounded-lg mt-0.5">{cat.type}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Categorie verwijderen?")) {
                        remove.mutateAsync(cat.id).then(() => toast.success("Verwijderd"));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subcategories?.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="rounded-lg text-xs font-normal">
                      {sub.naam}
                    </Badge>
                  ))}
                  {(!cat.subcategories || cat.subcategories.length === 0) && (
                    <span className="text-xs text-muted-foreground">Geen subcategorieën</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditing(null); setShowAdd(false); } }}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Categorie bewerken" : "Nieuwe categorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="uitgaven">Uitgaven</SelectItem>
                  <SelectItem value="inkomsten">Inkomsten</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icoon</Label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((name) => {
                  const Ic = iconMap[name];
                  return (
                    <button
                      key={name}
                      onClick={() => setForm({ ...form, icoon: name })}
                      className={`p-2 rounded-xl transition-colors ${
                        form.icoon === name ? "bg-primary/10 text-primary ring-2 ring-primary/30" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Ic className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kleur</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, kleur: c })}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      form.kleur === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Subcategories (edit mode) */}
            {editing && (
              <div className="space-y-2">
                <Label>Subcategorieën</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editing.subcategories?.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="rounded-lg text-xs font-normal gap-1">
                      {sub.naam}
                      <button onClick={() => removeSub.mutateAsync(sub.id).then(() => toast.success("Verwijderd"))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nieuwe subcategorie"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    className="rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
                  />
                  <Button size="sm" className="rounded-xl" onClick={handleAddSub}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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

export default Categories;
