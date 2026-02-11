import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

type FilterMode = "alle" | "zonder" | "inkomsten" | "uitgaven";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
};

type AccountInfo = {
  id: string;
  name: string;
  iban: string | null;
};

type TransactionRow = {
  id: string;
  booking_date: string; // YYYY-MM-DD
  amount_cents: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  counterparty: string | null;
  note: string | null;
  account_id: string;
  category_id: string | null;

  account: AccountInfo | null;
  category: { id: string; name: string } | null;
};

function formatMoney(cents: number) {
  const abs = Math.abs(cents) / 100;
  return abs.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function guessTitle(t: TransactionRow) {
  return (
    t.description?.trim() ||
    t.merchant?.trim() ||
    t.counterparty?.trim() ||
    "Transactie"
  );
}

function guessAlias(t: TransactionRow) {
  return t.merchant?.trim() || t.counterparty?.trim() || "—";
}

const Transactions = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // UUID filters via URL (van Accounts/Categories)
  const accountParam = searchParams.get("account");   // uuid
  const categoryParam = searchParams.get("category"); // uuid

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("alle");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editable fields
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");

  // Categories for dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,type")
        .eq("archived", false)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CategoryOption[];
    },
  });

  // Transactions query
  const txQueryKey = useMemo(
    () => ["transactions", { accountParam, categoryParam, filter }],
    [accountParam, categoryParam, filter],
  );

  const { data: transactions = [], isLoading: txLoading, error: txError } = useQuery({
    queryKey: txQueryKey,
    queryFn: async () => {
      // Base query
      let q = supabase
        .from("transactions")
        .select(
          `
          id,
          booking_date,
          amount_cents,
          currency,
          description,
          merchant,
          counterparty,
          note,
          account_id,
          category_id,
          account:accounts(id,name,iban),
          category:categories(id,name)
        `
        )
        .order("booking_date", { ascending: false });

      // Apply URL filters
      if (accountParam) q = q.eq("account_id", accountParam);
      if (categoryParam) q = q.eq("category_id", categoryParam);

      // Apply filter mode server-side where possible
      if (filter === "zonder") q = q.is("category_id", null);
      if (filter === "inkomsten") q = q.gt("amount_cents", 0);
      if (filter === "uitgaven") q = q.lt("amount_cents", 0);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []) as TransactionRow[];
    },
  });

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === selectedId) ?? null,
    [transactions, selectedId],
  );

  // Client-side search (description/merchant/counterparty)
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;

    const s = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const hay = [
        t.description ?? "",
        t.merchant ?? "",
        t.counterparty ?? "",
        t.note ?? "",
        t.category?.name ?? "",
        t.account?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [transactions, search]);

  const updateTxMutation = useMutation({
    mutationFn: async (args: { id: string; category_id: string | null; note: string | null }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          category_id: args.category_id,
          note: args.note,
        })
        .eq("id", args.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
    },
  });

  function openDialog(tx: TransactionRow) {
    setSelectedId(tx.id);
    setDraftCategoryId(tx.category_id);
    setDraftNote(tx.note ?? "");
    setOpen(true);
  }

  function saveDialog() {
    if (!selectedTx) return;

    updateTxMutation.mutate({
      id: selectedTx.id,
      category_id: draftCategoryId,
      note: draftNote.trim() ? draftNote.trim() : null,
    });
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

        <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
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

      {/* State */}
      {txLoading && <p className="text-muted-foreground">Laden…</p>}
      {txError && (
        <p className="text-sm text-destructive">
          Fout bij laden van transacties: {(txError as any)?.message ?? "onbekend"}
        </p>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const title = guessTitle(t);
          const alias = guessAlias(t);
          const accountName = t.account?.name ?? "—";

          const isIncome = t.amount_cents > 0;

          return (
            <Card
              key={t.id}
              onClick={() => openDialog(t)}
              className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{title}</p>
                    {t.category ? (
                      <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                        {t.category.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs font-normal text-muted-foreground border-dashed"
                      >
                        Geen categorie
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{t.booking_date}</span>
                    <span>{accountName}</span>
                    <span className="truncate">{alias}</span>
                    {t.note ? <span className="truncate">• {t.note}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p
                    className={[
                      "font-semibold tabular-nums whitespace-nowrap",
                      isIncome ? "text-income" : "text-expense",
                    ].join(" ")}
                  >
                    {isIncome ? "+" : ""}€ {formatMoney(t.amount_cents)}
                  </p>
                  <div className="rounded-xl bg-secondary p-2 text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!txLoading && filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-10">Geen transacties gevonden.</div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Transactie bewerken</DialogTitle>
            <DialogDescription>Voeg een notitie toe en wijs een categorie toe.</DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{guessTitle(selectedTx)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTx.booking_date} • {selectedTx.account?.name ?? "—"} •{" "}
                      {guessAlias(selectedTx)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {selectedTx.account?.iban ?? "—"}
                    </p>
                  </div>

                  <p
                    className={[
                      "font-semibold tabular-nums whitespace-nowrap",
                      selectedTx.amount_cents > 0 ? "text-income" : "text-expense",
                    ].join(" ")}
                  >
                    {selectedTx.amount_cents > 0 ? "+" : ""}€ {formatMoney(selectedTx.amount_cents)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Categorie</p>
                <Select
                  value={draftCategoryId ?? "geen"}
                  onValueChange={(v) => setDraftCategoryId(v === "geen" ? null : v)}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="rounded-xl border-0 bg-card shadow-sm">
                    <SelectValue placeholder="Kies categorie" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg">
                    <SelectItem value="geen">Geen categorie</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
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

          {updateTxMutation.isError && (
            <p className="text-sm text-destructive mt-3">
              Opslaan mislukt: {(updateTxMutation.error as any)?.message ?? "onbekend"}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button variant="secondary" className="rounded-xl" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button className="rounded-xl" onClick={saveDialog} disabled={updateTxMutation.isPending}>
              {updateTxMutation.isPending ? "Opslaan…" : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
