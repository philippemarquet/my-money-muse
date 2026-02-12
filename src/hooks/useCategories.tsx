import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "./useHousehold";

export interface Category {
  id: string;
  household_id: string;
  naam: string;
  kleur: string;
  icoon: string;
  type: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  naam: string;
  created_at: string;
}

export function useCategories() {
  const { householdId } = useHousehold();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, subcategories(*)")
        .order("naam");
      if (error) throw error;
      return data as (Category & { subcategories: Subcategory[] })[];
    },
    enabled: !!householdId,
  });

  const create = useMutation({
    mutationFn: async (cat: { naam: string; kleur: string; icoon: string; type: string }) => {
      const { error } = await supabase.from("categories").insert({
        household_id: householdId!,
        ...cat,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addSub = useMutation({
    mutationFn: async ({ category_id, naam }: { category_id: string; naam: string }) => {
      const { error } = await supabase.from("subcategories").insert({ category_id, naam });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const removeSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return { ...query, create, update, remove, addSub, removeSub };
}
