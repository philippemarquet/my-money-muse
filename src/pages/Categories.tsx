import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Home, Car, Film, Briefcase, Gift, Heart, Utensils,
} from "lucide-react";

const iconMap: Record<string, any> = {
  ShoppingCart, Home, Car, Film, Briefcase, Gift, Heart, Utensils,
};

const mockCategories = [
  {
    id: 1, naam: "Wonen", kleur: "hsl(28, 40%, 48%)", icoon: "Home",
    subs: [{ naam: "Hypotheek" }, { naam: "Energie" }, { naam: "Verzekeringen" }],
  },
  {
    id: 2, naam: "Boodschappen", kleur: "hsl(155, 25%, 45%)", icoon: "ShoppingCart",
    subs: [{ naam: "Albert Heijn" }, { naam: "Jumbo" }],
  },
  {
    id: 3, naam: "Transport", kleur: "hsl(38, 80%, 55%)", icoon: "Car",
    subs: [{ naam: "Brandstof" }, { naam: "OV" }],
  },
  {
    id: 4, naam: "Entertainment", kleur: "hsl(0, 55%, 55%)", icoon: "Film",
    subs: [{ naam: "Streaming" }, { naam: "Uit eten" }],
  },
  {
    id: 5, naam: "Inkomen", kleur: "hsl(155, 30%, 42%)", icoon: "Briefcase",
    subs: [{ naam: "Salaris" }, { naam: "Freelance" }],
  },
];

const Categories = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Categorieën</h1>
        <p className="text-muted-foreground mt-1">Beheer je categorieën en subcategorieën</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategories.map((cat) => {
          const Icon = iconMap[cat.icoon] || ShoppingCart;
          return (
            <Card key={cat.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: cat.kleur + "22", color: cat.kleur }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">{cat.naam}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subs.map((sub) => (
                    <Badge key={sub.naam} variant="secondary" className="rounded-lg text-xs font-normal">
                      {sub.naam}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
