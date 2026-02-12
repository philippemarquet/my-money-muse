import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "./useHousehold";

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

export function useAccounts() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["accounts", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("naam");
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!householdId,
  });

  const create = useMutation({
    mutationFn: async (acc: { naam: string; rekeningnummer: string; alias?: string; saldo?: number }) => {
      const { error } = await supabase.from("accounts").insert({
        household_id: householdId!,
        ...acc,
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
