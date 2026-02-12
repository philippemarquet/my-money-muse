import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Account {
  id: string;
  household_id: string; // space_id concept
  naam: string;
  rekeningnummer: string;
  alias: string | null;
  saldo: number;
  created_at: string;
  updated_at: string;
}

export function useAccounts() {
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["accounts", selectedSpaceId],
    queryFn: async () => {
      let q = supabase.from("accounts").select("*").order("naam", { ascending: true });

      if (selectedSpaceId !== null) {
        q = q.eq("household_id", selectedSpaceId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Account[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
  });

  const create = useMutation({
    mutationFn: async (acc: {
      naam: string;
      rekeningnummer: string;
      alias?: string;
      saldo?: number;
    }) => {
      const spaceId = effectiveSpaceId;
      if (!spaceId) throw new Error("Geen space geselecteerd");

      const { error } = await supabase.from("accounts").insert({
        household_id: spaceId,
        naam: acc.naam,
        rekeningnummer: acc.rekeningnummer,
        alias: acc.alias ?? null,
        saldo: acc.saldo ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { error } = await supabase.from("accounts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  return { ...query, create, update, remove };
}
