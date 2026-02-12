import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpace } from "@/hooks/useSpace";

export interface Category {
  id: string;
  household_id: string;
  naam: string;
  kleur: string;
  icoon: string;
  type: "inkomsten" | "uitgaven";
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  naam: string;
  created_at: string;
}

export function useCategories() {
  const { selectedSpaceId, effectiveSpaceId } = useSpace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", selectedSpaceId],
    queryFn: async () => {
      let q = supabase
        .from("categories")
        .select("*, subcategories(*)")
        .order("type", { ascending: true })
        .order("naam", { ascending: true });

      if (selectedSpaceId !== null) q = q.eq("household_id", selectedSpaceId);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []) as (Category & { subcategories: Subcategory[] })[];
    },
    enabled: selectedSpaceId === null || !!selectedSpaceId || !!effectiveSpaceId,
  });

  const create = useMutation({
    mutationFn: async (cat: {
      household_id?: string;
      naam: string;
      kleur: string;
      icoon: string;
      type: "inkomsten" | "uitgaven";
    }) => {
      const spaceId = cat.household_id ?? effectiveSpaceId;
      if (!spaceId) throw new Error("Geen space geselecteerd");

      const { household_id, ...payload } = cat;

      const { data, error } = await supabase
        .from("categories")
        .insert({
          household_id: spaceId,
          ...payload,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const addSub = useMutation({
    mutationFn: async ({ category_id, naam }: { category_id: string; naam: string }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert({ category_id, naam })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const removeSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return { ...query, create, update, remove, addSub, removeSub };
}
