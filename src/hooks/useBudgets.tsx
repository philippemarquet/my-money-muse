import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Budget {
  id: string;
  household_id: string; // space concept
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
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets", selectedSpaceId],
    queryFn: async () => {
      let q = supabase
        .from("budgets")
        .select(
          "*, budget_categories(subcategory_id, allocated_amount, subcategories(naam, categories(naam, type)))"
        )
        .order("naam", { ascending: true });

      if (selectedSpaceId !== null) {
        q = q.eq("household_id", selectedSpaceId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Budget[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
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
      const spaceId = effectiveSpaceId;
      if (!spaceId) throw new Error("Geen space geselecteerd");

      const { subcategory_ids, ...budgetData } = b;

      const { data, error } = await supabase
        .from("budgets")
        .insert({ household_id: spaceId, ...budgetData })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
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
