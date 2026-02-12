import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Transaction {
  id: string;
  household_id: string; // space concept
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
  categories?: { naam: string; kleur: string; type?: string } | null;
  subcategories?:
    | {
        naam: string;
        categories?: { naam: string; kleur: string; type?: string } | null;
      }
    | null;
}

export function useTransactions() {
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", selectedSpaceId],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select(
          "*, accounts(naam), categories(naam, kleur, type), subcategories(naam, categories(naam, kleur, type))"
        )
        .order("datum", { ascending: false });

      if (selectedSpaceId !== null) {
        q = q.eq("household_id", selectedSpaceId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
  });

  const create = useMutation({
    mutationFn: async (t: {
      datum: string;
      omschrijving: string;
      bedrag: number;
      iban_tegenrekening?: string;
      alias_tegenrekening?: string;
      account_id?: string;
      subcategory_id: string; // verplicht in jouw model
      notitie?: string;
    }) => {
      const spaceId = effectiveSpaceId;
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
