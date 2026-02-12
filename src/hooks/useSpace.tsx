import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Space = {
  id: string;
  name: string;
  created_at?: string;
};

type SpaceContextValue = {
  // list
  spaces: Space[];
  spacesLoading: boolean;

  // selection
  selectedSpaceId: string | null; // null = Alles
  setSelectedSpaceId: (id: string | null) => void;

  // default / effective
  defaultSpaceId: string | null;
  effectiveSpaceId: string | null;
  selectedSpaceLabel: string;

  // CRUD
  createSpace: (name: string) => Promise<string>;
  renameSpace: (id: string, name: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  setDefaultSpace: (id: string) => Promise<void>;

  // loading state for actions
  creating: boolean;
  renaming: boolean;
  deleting: boolean;
  settingDefault: boolean;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);

function storageKey(userId: string) {
  return `my-money-muse:selected-space:${userId}`;
}

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedSpaceId, setSelectedSpaceIdState] = useState<string | null>(null);

  // profile (default space)
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, household_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as { user_id: string; household_id: string | null } | null;
    },
    enabled: !!user,
  });

  const defaultSpaceId = profileQuery.data?.household_id ?? null;

  // spaces list (households)
  const spacesQuery = useQuery({
    queryKey: ["spaces", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Space[];
    },
    enabled: !!user && !profileQuery.isLoading,
  });

  const spaces = spacesQuery.data ?? [];
  const spacesLoading = spacesQuery.isLoading;

  // load selection from localStorage (or fallback to default)
  useEffect(() => {
    if (!user) return;

    const raw = localStorage.getItem(storageKey(user.id));
    if (!raw) {
      // default to profile default
      setSelectedSpaceIdState(defaultSpaceId ?? null);
      return;
    }

    if (raw === "__ALL__") setSelectedSpaceIdState(null);
    else setSelectedSpaceIdState(raw);
  }, [user, defaultSpaceId]);

  const setSelectedSpaceId = (id: string | null) => {
    if (!user) return;
    setSelectedSpaceIdState(id);
    localStorage.setItem(storageKey(user.id), id === null ? "__ALL__" : id);
  };

  // effective: if All selected => use default for creation fallback
  const effectiveSpaceId = selectedSpaceId ?? defaultSpaceId ?? null;

  const selectedSpaceLabel = useMemo(() => {
    if (selectedSpaceId === null) return "Alles";
    const found = spaces.find((s) => s.id === selectedSpaceId);
    return found?.name ?? "Space";
  }, [selectedSpaceId, spaces]);

  // ---- CRUD via RPC ----
  const createMut = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc("create_space", { space_name: name });
      if (error) throw error;
      return data as string; // uuid
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  const renameMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.rpc("rename_space", { space_id: id, new_name: name });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_space", { space_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["spaces"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      // also refresh all space-dependent data
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      await qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const setDefaultMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("set_default_space", { space_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      // refresh space-dependent data
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      await qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const value: SpaceContextValue = {
    spaces,
    spacesLoading,

    selectedSpaceId,
    setSelectedSpaceId,

    defaultSpaceId,
    effectiveSpaceId,
    selectedSpaceLabel,

    createSpace: async (name) => createMut.mutateAsync(name),
    renameSpace: async (id, name) => renameMut.mutateAsync({ id, name }),
    deleteSpace: async (id) => deleteMut.mutateAsync(id),
    setDefaultSpace: async (id) => setDefaultMut.mutateAsync(id),

    creating: createMut.isPending,
    renaming: renameMut.isPending,
    deleting: deleteMut.isPending,
    settingDefault: setDefaultMut.isPending,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used within SpaceProvider");
  return ctx;
}
