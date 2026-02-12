import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as LucideIcons from "lucide-react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, Category, Subcategory } from "@/hooks/useCategories";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const curatedIconOptions = [
  "ShoppingCart",
  "Home",
  "Car",
  "Film",
  "Briefcase",
  "Gift",
  "Heart",
  "Utensils",
] as const;

const colorOptions = [
  "hsl(28, 40%, 48%)",
  "hsl(155, 25%, 45%)",
  "hsl(38, 80%, 55%)",
  "hsl(0, 55%, 55%)",
  "hsl(220, 40%, 50%)",
  "hsl(280, 40%, 50%)",
  "hsl(180, 30%, 45%)",
  "hsl(340, 50%, 50%)",
];

type CategoryWithSubs = Category & { subcategories: Subcategory[] };

function getLucideIconByName(name: string | null | undefined) {
  const key = (name ?? "").trim();
  const fallback = (LucideIcons as any).ShoppingCart as any;
  const Icon = (LucideIcons as any)[key] as any;
  return Icon ?? fallback;
}

const Categories = () => {
  const { data: categories = [], create, update, remove, addSub, removeSub } = useCategories();

  const [editing, setEditing] = useState<CategoryWithSubs | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    naam: "",
    kleur: colorOptions[0],
    icoon: "ShoppingCart",
    type: "uitgaven" as "uitgaven" | "inkomsten",
  });

  const [newSub, setNewSub] = useState("");

  const resetForm = () =>
    setForm({ naam: "", kleur: colorOptions[0], icoon: "ShoppingCart", type: "uitgaven" });

  // ✅ Fix: zodra categories refetcht na add/remove subcategory, update de editing reference
  useEffect(() => {
    if (!editing) return;
    const fresh = categories.find((c) => c.id === editing.id);
    if (!fresh) return;

    // Alleen updaten als subcategories/fields zijn veranderd
    const freshStr = JSON.stringify(fresh);
    const editStr = JSON.stringify(editing);
    if (freshStr !== editStr) {
      setEditing(fresh as CategoryWithSubs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, editing?.id]);

  const expenses = useMemo(
    () => categories.filter((c) => c.type === "uitgaven"),
    [categories]
  );
  const incomes = useMemo(
    () => categories.filter((c) => c.type === "inkomsten"),
    [categories]
  );

  const openEdit = (c: CategoryWithSubs) => {
    setForm({ naam: c.naam, kleur: c.kleur, icoon: c.icoon, type: c.type });
    setEditing(c);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          naam: form.naam,
          kleur: form.kleur,
          icoon: form.icoon,
          type: form.type,
        });
        toast.success("Categorie bijgewerkt");
      } else {
        await create.mutateAsync({
          naam: form.naam,
          kleur: form.kleur,
          icoon: form.icoon,
          type: form.type,
        });
        toast.success("Categorie toegevoegd");
      }
      setEditing(null);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message ?? "Opslaan mislukt");
    }
  };

  const handleAddSub = async () => {
    if (!editing || !newSub.trim()) return;
    try {
      await addSub.mutateAsync({ category_id: editing.id, naam: newSub.trim() });
      setNewSub("");
      toast.success("Subcategorie toegevoegd");
      // categories refetch gebeurt via invalidate; useEffect sync’t editing -> popup toont direct
    } catch (err: any) {
      toast.error(err.message ?? "Toevoegen mislukt");
    }
  };

  const dialogOpen = showAdd || !!editing;

  const Section = ({ title, items }: { title: string; items: CategoryWithSubs[] }) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <p className="text-muted-foreground col-span-3 text-center py-6">
              Geen categorieën in {title.toLowerCase()}.
            </p>
          )}

          {items.map((cat) => {
            const Icon = getLucideIconByName(cat.icoon);

            return (
              <Card
                key={cat.id}
                className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(cat)}
              >
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
                        <Badge variant="outline" className="text-xs rounded-lg mt-0.5">
                          {cat.type}
                        </Badge>
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Categorieën</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je categorieën en subcategorieën (gescheiden op inkomsten/uitgaven)
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

      <Section title="Uitgaven" items={expenses as CategoryWithSubs[]} />

      <Separator className="my-2" />

      <Section title="Inkomsten" items={incomes as CategoryWithSubs[]} />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setShowAdd(false);
            setNewSub("");
          }
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Categorie bewerken" : "Nieuwe categorie"}
            </DialogTitle>
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
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="uitgaven">Uitgaven</SelectItem>
                  <SelectItem value="inkomsten">Inkomsten</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icoon</Label>
              <div className="flex gap-2 flex-wrap">
                {curatedIconOptions.map((name) => {
                  const Ic = getLucideIconByName(name);
                  const active = form.icoon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm({ ...form, icoon: name })}
                      className={`p-2 rounded-xl transition-colors ${
                        active
                          ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                      title={name}
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
                    type="button"
                    onClick={() => setForm({ ...form, kleur: c })}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      form.kleur === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label>Subcategorieën</Label>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editing.subcategories?.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="rounded-lg text-xs font-normal gap-1">
                      {sub.naam}
                      <button
                        type="button"
                        onClick={() =>
                          removeSub.mutateAsync(sub.id).then(() => toast.success("Verwijderd"))
                        }
                        title="Verwijderen"
                      >
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
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setEditing(null);
                setShowAdd(false);
                setNewSub("");
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

export default Categories;
