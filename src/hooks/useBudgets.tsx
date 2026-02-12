import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "./useHousehold";

export interface Budget {
  id: string;
  household_id: string;
  naam: string;
  bedrag: number;
  type: "maandelijks" | "jaarlijks";
  richting: "inkomsten" | "uitgaven";
  rollover: boolean;
  created_at: string;
  updated_at: string;

  budget_categories?: {
    subcategory_id: string | null;
    allocated_amount: number;
    subcategories?: {
      naam: string;
      categories?: { naam: string; type: string } | null;
    } | null;
  }[];
}

export function useBudgets() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select(
          "*, budget_categories(subcategory_id, allocated_amount, subcategories(naam, categories(naam, type)))"
        )
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
      type: "maandelijks" | "jaarlijks";
      richting: "inkomsten" | "uitgaven";
      rollover: boolean;
      subcategory_ids: string[];
    }) => {
      const { subcategory_ids, ...budgetData } = b;

      const { data, error } = await supabase
        .from("budgets")
        .insert({ household_id: householdId!, ...budgetData })
        .select()
        .single();

      if (error) throw error;

      if (subcategory_ids.length > 0) {
        const { error: linkError } = await supabase.from("budget_categories").insert(
          subcategory_ids.map((sid) => ({
            budget_id: data.id,
            subcategory_id: sid,
            allocated_amount: 0,
          }))
        );
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets", householdId] }),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      subcategory_ids,
      ...updates
    }: Partial<Budget> & { id: string; subcategory_ids?: string[] }) => {
      const { error } = await supabase.from("budgets").update(updates).eq("id", id);
      if (error) throw error;

      if (subcategory_ids !== undefined) {
        await supabase.from("budget_categories").delete().eq("budget_id", id);

        if (subcategory_ids.length > 0) {
          const { error: linkError } = await supabase.from("budget_categories").insert(
            subcategory_ids.map((sid) => ({
              budget_id: id,
              subcategory_id: sid,
              allocated_amount: 0,
            }))
          );
          if (linkError) throw linkError;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets", householdId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets", householdId] }),
  });

  return { ...query, create, update, remove };
}
