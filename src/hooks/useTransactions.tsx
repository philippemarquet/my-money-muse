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
  categories?: { naam: string; kleur: string } | null;
  accounts?: { naam: string } | null;
}

export function useTransactions() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, categories(naam, kleur), accounts(naam)")
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
      category_id?: string;
    }) => {
      const { error } = await supabase.from("transactions").insert({
        household_id: householdId!,
        ...t,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase.from("transactions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  return { ...query, create, update, remove };
}
