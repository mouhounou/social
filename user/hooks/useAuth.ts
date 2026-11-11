"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const router = useRouter();
  const { user, loading, setUser, refresh, logout: clear } = useAuthStore(
    useShallow((s) => ({ user: s.user, loading: s.loading, setUser: s.setUser, refresh: s.refresh, logout: s.logout }))
  );

  const logout = useCallback(async () => {
    await clear();
    router.push("/");
    router.refresh();
  }, [clear, router]);

  return { user, loading, setUser, refresh, logout };
}
