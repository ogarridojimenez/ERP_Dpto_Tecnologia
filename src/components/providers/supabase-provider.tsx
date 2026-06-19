"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/database";

type SupabaseContext = {
  supabase: SupabaseClient;
  user: User | null;
  role: ProfileRole | null;
  loading: boolean;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange dispara INITIAL_SESSION al montar con la sesion
    // existente, asi que cubre tanto el primer render como cambios futuros.
    // Evitamos el SELECT a profiles duplicado del antiguo patron getUser
    // + onAuthStateChange.
    let lastUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setRole(null);
        lastUserId = null;
        setLoading(false);
        return;
      }

      // Solo refetch del profile si cambia el usuario (no en cada refresh
      // de token), ahorra round-trips.
      if (nextUser.id !== lastUserId) {
        lastUserId = nextUser.id;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", nextUser.id)
          .single();
        if (data) setRole(data.role as ProfileRole);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <Context.Provider value={{ supabase, user, role, loading }}>
      {children}
    </Context.Provider>
  );
}

export function useSupabase() {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return context;
}
