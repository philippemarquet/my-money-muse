import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Transaction {
  id: string;
  household_id: string;
  account_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  datum: string;
  omschrijving: string;
  bedrag: number;
  iban_tegenrekening: string | null;
  alias_tegenrekening: string | null;
  notitie: string | null;
  created_at: string;
  updated_at: string;

  accounts?: { naam: string; household_id?: string } | null;
  categories?: { naam: string; kleur: string; type?: string } | null;
  subcategories?:
    | {
        naam: string;
        categories?: { naam: string; kleur: string; type?: string } | null;
      }
    | null;
}

type CreateTxInput = {
  household_id?: string;
  datum: string;
  omschrijving: string;
  bedrag: number;
  iban_tegenrekening?: string;
  alias_tegenrekening?: string;
  account_id?: string;
  subcategory_id: string; // in jouw model verplicht
  notitie?: string;
};

export function useTransactions() {
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", selectedSpaceId],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*, accounts(naam, household_id), categories(naam, kleur, type), subcategories(naam, categories(naam, kleur, type))")
        .order("datum", { ascending: false });

      if (selectedSpaceId !== null) q = q.eq("household_id", selectedSpaceId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
  });

  const create = useMutation({
    mutationFn: async (t: CreateTxInput) => {
      let spaceId = t.household_id ?? null;

      // if no explicit space, derive from account
      if (!spaceId && t.account_id) {
        const { data: acc, error: accErr } = await supabase
          .from("accounts")
          .select("household_id")
          .eq("id", t.account_id)
          .maybeSingle();

        if (accErr) throw accErr;
        spaceId = acc?.household_id ?? null;
      }

      // fallback
      if (!spaceId) spaceId = effectiveSpaceId;

      if (!spaceId) throw new Error("Geen space geselecteerd");

      const { error } = await supabase.from("transactions").insert({
        household_id: spaceId,
        datum: t.datum,
        omschrijving: t.omschrijving,
        bedrag: t.bedrag,
        iban_tegenrekening: t.iban_tegenrekening ?? null,
        alias_tegenrekening: t.alias_tegenrekening ?? null,
        account_id: t.account_id ?? null,
        subcategory_id: t.subcategory_id,
        notitie: t.notitie ?? null,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase.from("transactions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return { ...query, create, update, remove };
}
