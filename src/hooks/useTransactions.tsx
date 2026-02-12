import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "./useHousehold";

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

  accounts?: { naam: string } | null;
  categories?: { naam: string; kleur: string; type: string } | null;
  subcategories?: { naam: string; categories: { naam: string; kleur: string; type: string } | null } | null;
}

export function useTransactions() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, accounts(naam), categories(naam, kleur, type), subcategories(naam, categories(naam, kleur, type))")
        .order("datum", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!householdId,
  });

  const create = useMutation({
    mutationFn: async (t: {
      datum: string;
      omschrijving: string;
      bedrag: number;
      iban_tegenrekening?: string;
      alias_tegenrekening?: string;
      account_id?: string;
      subcategory_id: string; // ✅ required in UI
      notitie?: string;
    }) => {
      const { error } = await supabase.from("transactions").insert({
        household_id: householdId!,
        ...t,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", householdId] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase.from("transactions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", householdId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", householdId] }),
  });

  return { ...query, create, update, remove };
}
