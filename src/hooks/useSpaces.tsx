import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SpaceRow = {
  id: string;
  name: string;
  created_at: string;
};

export type ProfileRow = {
  user_id: string;
  household_id: string | null;
};

export function useSpaces() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const spacesQuery = useQuery({
    queryKey: ["spaces", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SpaceRow[];
    },
    enabled: !!user,
  });

  const profileQuery = useQuery({
    queryKey: ["profile-default-space", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, household_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProfileRow | null;
    },
    enabled: !!user,
  });

  const createSpace = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc("create_space", { space_name: name });
      if (error) throw error;
      return data as string; // uuid
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  const renameSpace = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.rpc("rename_space", {
        space_id: id,
        new_name: name,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  const deleteSpace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_space", { space_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
      await qc.invalidateQueries({ queryKey: ["profile-default-space"] });
    },
  });

  const setDefaultSpace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("set_default_space", { space_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile-default-space"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    spacesQuery,
    profileQuery,
    createSpace,
    renameSpace,
    deleteSpace,
    setDefaultSpace,
  };
}
