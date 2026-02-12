import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Account {
  id: string;
  household_id: string;
  naam: string;
  rekeningnummer: string;
  alias: string | null;
  saldo: number;
  created_at: string;
  updated_at: string;
}

type CreateAccountInput = {
  naam: string;
  rekeningnummer: string;
  alias?: string | null;
  saldo?: number;
  household_id?: string;
};

export function useAccounts() {
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["accounts", selectedSpaceId],
    queryFn: async () => {
      let q = supabase.from("accounts").select("*").order("naam", { ascending: true });
      if (selectedSpaceId !== null) q = q.eq("household_id", selectedSpaceId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
  });

  const create = useMutation({
    mutationFn: async (acc: CreateAccountInput) => {
      const spaceId = acc.household_id ?? effectiveSpaceId;
      if (!spaceId) throw new Error("Geen space geselecteerd");

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          household_id: spaceId,
          naam: acc.naam,
          rekeningnummer: acc.rekeningnummer,
          alias: acc.alias ?? null,
          saldo: acc.saldo ?? 0,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return { ...query, create, update, remove };
}
