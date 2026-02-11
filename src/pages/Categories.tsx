import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  ShoppingCart,
  Home,
  Car,
  Film,
  Briefcase,
  Gift,
  Heart,
  Utensils,
} from "lucide-react";

const iconMap: Record<string, any> = {
  ShoppingCart,
  Home,
  Car,
  Film,
  Briefcase,
  Gift,
  Heart,
  Utensils,
};

type CategoryRow = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  color: string | null;
  icon: string | null;
  parent_id: string | null;
};

const Categories = () => {
  const navigate = useNavigate();
  const params = useParams();
  const categoryId = params.id ?? null;

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,type,color,icon,parent_id,archived,sort_order")
        .eq("archived", false)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const parents = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories],
  );

  const subsByParent = useMemo(() => {
    const m = new Map<string, CategoryRow[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      if (!m.has(c.parent_id)) m.set(c.parent_id, []);
      m.get(c.parent_id)!.push(c);
    }
    return m;
  }, [categories]);

  const selected = useMemo(
    () => (categoryId ? categories.find((c) => c.id === categoryId) ?? null : null),
    [categories, categoryId],
  );

  const viewParents = selected ? parents.filter((p) => p.id === selected.id) : parents;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Categorieën</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je categorieën en subcategorieën
            {selected ? ` — ${selected.name}` : ""}
          </p>
        </div>

        {selected && (
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate("/categorieen")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Laden…</p>}
      {error && (
        <p className="text-sm text-destructive">
          Fout bij laden van categorieën: {(error as any)?.message ?? "onbekend"}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewParents.map((cat) => {
          const Icon = (cat.icon && iconMap[cat.icon]) || ShoppingCart;
          const subs = subsByParent.get(cat.id) ?? [];
          const isSelected = cat.id === categoryId;

          return (
            <Card
              key={cat.id}
              onClick={() => navigate(`/categorieen/${cat.id}`)}
              className={[
                "border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer",
                isSelected ? "ring-2 ring-primary" : "",
              ].join(" ")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: (cat.color ?? "hsl(28, 40%, 48%)") + "22",
                      color: cat.color ?? "hsl(28, 40%, 48%)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {cat.type === "income"
                        ? "inkomsten"
                        : cat.type === "expense"
                        ? "uitgaven"
                        : "transfer"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {subs.length === 0 ? (
                    <Badge
                      variant="outline"
                      className="rounded-lg text-xs font-normal text-muted-foreground border-dashed"
                    >
                      Geen subcategorieën
                    </Badge>
                  ) : (
                    subs.map((sub) => (
                      <Badge
                        key={sub.id}
                        variant="secondary"
                        className="rounded-lg text-xs font-normal"
                      >
                        {sub.name}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="pt-2 flex gap-2">
          <Button
            className="rounded-xl"
            onClick={() => navigate(`/transacties?category=${encodeURIComponent(selected.id)}`)}
          >
            Bekijk transacties met deze categorie
          </Button>
        </div>
      )}
    </div>
  );
};

export default Categories;
