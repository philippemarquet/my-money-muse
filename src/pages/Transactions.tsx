import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockTransactions = [
  { id: 1, datum: "2025-02-10", omschrijving: "Albert Heijn", bedrag: -67.43, iban: "NL91BUNQ0123456789", rekening: "Gezamenlijk", alias: "Albert Heijn Utrecht", categorie: "Boodschappen" },
  { id: 2, datum: "2025-02-09", omschrijving: "Salaris Februari", bedrag: 3850.00, iban: "NL20INGB0001234567", rekening: "Gezamenlijk", alias: "Werkgever BV", categorie: "Salaris" },
  { id: 3, datum: "2025-02-08", omschrijving: "Shell Tankstation", bedrag: -58.20, iban: "NL44RABO0987654321", rekening: "Privé", alias: "Shell Express", categorie: null },
  { id: 4, datum: "2025-02-07", omschrijving: "Netflix", bedrag: -15.49, iban: "NL55BUNQ1122334455", rekening: "Gezamenlijk", alias: "Netflix", categorie: "Entertainment" },
  { id: 5, datum: "2025-02-06", omschrijving: "Hypotheek", bedrag: -1245.00, iban: "NL66ABNA5566778899", rekening: "Gezamenlijk", alias: "Rabobank Hypotheek", categorie: "Wonen" },
  { id: 6, datum: "2025-02-05", omschrijving: "Bol.com", bedrag: -34.99, iban: "NL77BUNQ9988776655", rekening: "Privé", alias: "Bol.com", categorie: null },
  { id: 7, datum: "2025-02-04", omschrijving: "Freelance project", bedrag: 1200.00, iban: "NL88INGB4433221100", rekening: "Zakelijk", alias: "Klant BV", categorie: "Inkomsten" },
  { id: 8, datum: "2025-02-03", omschrijving: "Jumbo", bedrag: -42.15, iban: "NL99RABO1122334455", rekening: "Gezamenlijk", alias: "Jumbo Supermarkt", categorie: "Boodschappen" },
];

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("alle");

  const filtered = mockTransactions.filter((t) => {
    const matchesSearch = t.omschrijving.toLowerCase().includes(search.toLowerCase()) ||
      t.alias.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "alle" ? true :
      filter === "zonder" ? t.categorie === null :
      filter === "inkomsten" ? t.bedrag > 0 :
      filter === "uitgaven" ? t.bedrag < 0 : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Transacties</h1>
        <p className="text-muted-foreground mt-1">Beheer en categoriseer je transacties</p>
      </div>

      {/* Filters */}
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
          <SelectTrigger className="w-[180px] rounded-xl border-0 bg-card shadow-sm">
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
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <Card key={t.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{t.omschrijving}</p>
                  {t.categorie ? (
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                      {t.categorie}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-lg text-xs font-normal text-muted-foreground border-dashed">
                      Geen categorie
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{t.datum}</span>
                  <span>{t.rekening}</span>
                  <span className="truncate">{t.alias}</span>
                </div>
              </div>
              <p className={`font-semibold tabular-nums whitespace-nowrap ml-4 ${t.bedrag >= 0 ? "text-income" : "text-expense"}`}>
                {t.bedrag >= 0 ? "+" : ""}€ {Math.abs(t.bedrag).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
