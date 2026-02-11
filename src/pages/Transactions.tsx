import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Pencil } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Tx = {
  id: number;
  datum: string; // YYYY-MM-DD
  omschrijving: string;
  bedrag: number;
  iban: string;
  rekening: string; // straks account.name
  alias: string;
  categorie: string | null; // straks category.name
  notitie?: string | null;
};

const mockTransactions: Tx[] = [
  { id: 1, datum: "2025-02-10", omschrijving: "Albert Heijn", bedrag: -67.43, iban: "NL91BUNQ0123456789", rekening: "Gezamenlijk", alias: "Albert Heijn Utrecht", categorie: "Boodschappen", notitie: null },
  { id: 2, datum: "2025-02-09", omschrijving: "Salaris Februari", bedrag: 3850.0, iban: "NL20INGB0001234567", rekening: "Gezamenlijk", alias: "Werkgever BV", categorie: "Salaris", notitie: "Bonus inbegrepen" },
  { id: 3, datum: "2025-02-08", omschrijving: "Shell Tankstation", bedrag: -58.2, iban: "NL44RABO0987654321", rekening: "Privé", alias: "Shell Express", categorie: null, notitie: null },
  { id: 4, datum: "2025-02-07", omschrijving: "Netflix", bedrag: -15.49, iban: "NL55BUNQ1122334455", rekening: "Gezamenlijk", alias: "Netflix", categorie: "Entertainment", notitie: null },
  { id: 5, datum: "2025-02-06", omschrijving: "Hypotheek", bedrag: -1245.0, iban: "NL66ABNA5566778899", rekening: "Gezamenlijk", alias: "Rabobank Hypotheek", categorie: "Wonen", notitie: "Maandelijkse afschrijving" },
  { id: 6, datum: "2025-02-05", omschrijving: "Bol.com", bedrag: -34.99, iban: "NL77BUNQ9988776655", rekening: "Privé", alias: "Bol.com", categorie: null, notitie: null },
  { id: 7, datum: "2025-02-04", omschrijving: "Freelance project", bedrag: 1200.0, iban: "NL88INGB4433221100", rekening: "Zakelijk", alias: "Klant BV", categorie: "Inkomsten", notitie: null },
  { id: 8, datum: "2025-02-03", omschrijving: "Jumbo", bedrag: -42.15, iban: "NL99RABO1122334455", rekening: "Gezamenlijk", alias: "Jumbo Supermarkt", categorie: "Boodschappen", notitie: null },
];

// Voor de dialog dropdown (mock). In stap E komt dit uit Supabase.
const mockCategoryOptions = [
  "Wonen",
  "Boodschappen",
  "Transport",
  "Entertainment",
  "Inkomsten",
  "Salaris",
];

const Transactions = () => {
  const [searchParams] = useSearchParams();

  // URL filters (komen van Accounts/Categories knoppen)
  const accountParam = searchParams.get("account");   // later uuid
  const categoryParam = searchParams.get("category"); // later uuid

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"alle" | "zonder" | "inkomsten" | "uitgaven">("alle");

  // Detail dialog state
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Editable fields (mock local)
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");

  // In D werken we nog met mockdata, maar maken het gedrag alvast netjes.
  const [rows, setRows] = useState<Tx[]>(mockTransactions);

  const selectedTx = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  // Filter + search (account/category param zijn nu name-based, straks uuid-based)
  const filtered = useMemo(() => {
    return rows.filter((t) => {
      const matchesSearch =
        t.omschrijving.toLowerCase().includes(search.toLowerCase()) ||
        t.alias.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "alle" ? true :
        filter === "zonder" ? t.categorie === null :
        filter === "inkomsten" ? t.bedrag > 0 :
        filter === "uitgaven" ? t.bedrag < 0 : true;

      // Voor D: accountParam/categoryParam komen straks als uuid.
      // Nu gebruiken we ze “best effort” op naam, zodat je flow al werkt in de UI.
      const matchesAccount = accountParam ? t.rekening === accountParam : true;
      const matchesCategory = categoryParam ? t.categorie === categoryParam : true;

      return matchesSearch && matchesFilter && matchesAccount && matchesCategory;
    });
  }, [rows, search, filter, accountParam, categoryParam]);

  function openDialog(tx: Tx) {
    setSelectedId(tx.id);
    setDraftCategory(tx.categorie);
    setDraftNote(tx.notitie ?? "");
    setOpen(true);
  }

  function saveDialog() {
    if (!selectedTx) return;

    setRows((prev) =>
      prev.map((t) =>
        t.id === selectedTx.id
          ? { ...t, categorie: draftCategory, notitie: draftNote.trim() ? draftNote.trim() : null }
          : t
      )
    );
    setOpen(false);
  }

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

        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
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
          <Card
            key={t.id}
            onClick={() => openDialog(t)}
            className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardContent className="p-4 flex items-center justify-between gap-4">
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
                  {t.notitie ? <span className="truncate">• {t.notitie}</span> : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className={`font-semibold tabular-nums whitespace-nowrap ${t.bedrag >= 0 ? "text-income" : "text-expense"}`}>
                  {t.bedrag >= 0 ? "+" : ""}€ {Math.abs(t.bedrag).toFixed(2)}
                </p>
                <div className="rounded-xl bg-secondary p-2 text-muted-foreground">
                  <Pencil className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            Geen transacties gevonden.
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Transactie bewerken</DialogTitle>
            <DialogDescription>
              Voeg een notitie toe en wijs een categorie toe.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedTx.omschrijving}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTx.datum} • {selectedTx.rekening} • {selectedTx.alias}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {selectedTx.iban}
                    </p>
                  </div>

                  <p className={`font-semibold tabular-nums whitespace-nowrap ${selectedTx.bedrag >= 0 ? "text-income" : "text-expense"}`}>
                    {selectedTx.bedrag >= 0 ? "+" : ""}€ {Math.abs(selectedTx.bedrag).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Categorie</p>
                <Select
                  value={draftCategory ?? "geen"}
                  onValueChange={(v) => setDraftCategory(v === "geen" ? null : v)}
                >
                  <SelectTrigger className="rounded-xl border-0 bg-card shadow-sm">
                    <SelectValue placeholder="Kies categorie" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg">
                    <SelectItem value="geen">Geen categorie</SelectItem>
                    {mockCategoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Notitie</p>
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Bijv. waarom deze uitgave?"
                  className="rounded-xl border-0 bg-card shadow-sm min-h-[110px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="secondary" className="rounded-xl" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button className="rounded-xl" onClick={saveDialog}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
