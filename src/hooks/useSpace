import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Space = {
  id: string;
  name: string;
};

type SpaceContextValue = {
  spaces: Space[];
  spacesLoading: boolean;

  selectedSpaceId: string | null; // null = Alles
  setSelectedSpaceId: (id: string | null) => void;

  defaultSpaceId?: string;
  effectiveSpaceId?: string;
  selectedSpaceLabel: string;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);

function storageKey(userId: string) {
  return `my-money-muse:selected-space:${userId}`;
}

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedSpaceId, setSelectedSpaceIdState] = useState<string | null>(null);

  // ✅ SAFE: maybeSingle zodat missende profile row geen crash veroorzaakt
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as { household_id: string | null } | null;
    },
    enabled: !!user,
  });

  const defaultSpaceId = profile?.household_id ?? undefined;

  // spaces = households (DB-naam)
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ["spaces", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("households")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Space[];
    },
    enabled: !!user && !profileLoading,
  });

  // load selection
  useEffect(() => {
    if (!user) return;

    const raw = localStorage.getItem(storageKey(user.id));
    if (!raw) {
      if (defaultSpaceId) setSelectedSpaceIdState(defaultSpaceId);
      else setSelectedSpaceIdState(null);
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

  const effectiveSpaceId = selectedSpaceId ?? defaultSpaceId;

  const selectedSpaceLabel = useMemo(() => {
    if (selectedSpaceId === null) return "Alles";
    const found = spaces.find((s) => s.id === selectedSpaceId);
    return found?.name ?? "Space";
  }, [selectedSpaceId, spaces]);

  const value: SpaceContextValue = {
    spaces,
    spacesLoading,
    selectedSpaceId,
    setSelectedSpaceId,
    defaultSpaceId,
    effectiveSpaceId,
    selectedSpaceLabel,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used within SpaceProvider");
  return ctx;
}
