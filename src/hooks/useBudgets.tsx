import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "./useHousehold";

export interface Budget {
  id: string;
  household_id: string;
  naam: string;
  bedrag: number;
  type: string;
  richting: string;
  rollover: boolean;
  created_at: string;
  updated_at: string;
  budget_categories?: { category_id: string; categories: { naam: string } }[];
}

export function useBudgets() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, budget_categories(category_id, categories(naam))")
        .order("naam");
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!householdId,
  });

  const create = useMutation({
    mutationFn: async (b: {
      naam: string;
      bedrag: number;
      type: string;
      richting: string;
      rollover: boolean;
      category_ids: string[];
    }) => {
      const { category_ids, ...budgetData } = b;
      const { data, error } = await supabase
        .from("budgets")
        .insert({ household_id: householdId!, ...budgetData })
        .select()
        .single();
      if (error) throw error;
      if (category_ids.length > 0) {
        const { error: linkError } = await supabase
          .from("budget_categories")
          .insert(category_ids.map((cid) => ({ budget_id: data.id, category_id: cid })));
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      category_ids,
      ...updates
    }: Partial<Budget> & { id: string; category_ids?: string[] }) => {
      const { error } = await supabase.from("budgets").update(updates).eq("id", id);
      if (error) throw error;
      if (category_ids !== undefined) {
        await supabase.from("budget_categories").delete().eq("budget_id", id);
        if (category_ids.length > 0) {
          const { error: linkError } = await supabase
            .from("budget_categories")
            .insert(category_ids.map((cid) => ({ budget_id: id, category_id: cid })));
          if (linkError) throw linkError;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  return { ...query, create, update, remove };
}
