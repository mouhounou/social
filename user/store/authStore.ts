import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  refresh: () =>
    api<{ user: User | null }>("/auth/session")
      .then((data) => set({ user: data.user }))
      .catch(() => set({ user: null }))
      .finally(() => set({ loading: false })),
  logout: async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null });
  },
}));
