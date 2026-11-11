"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function GuestOnly() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const decided = useRef(false);

  useEffect(() => {
    if (loading || decided.current) return;
    decided.current = true;
    if (user) router.replace("/");
  }, [loading, user, router]);

  return null;
}
