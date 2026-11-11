"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Role, User } from "@/types";
import Spinner from "@/components/ui/Spinner";

type Props = {
  roles?: Role[];
  children: React.ReactNode | ((user: User) => React.ReactNode);
};

export default function RequireAuth({ roles, children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">Réservé aux auteurs</p>
        <p className="mt-2 text-sm text-muted">
          Ton compte est en mode lecteur : tu peux aimer, enregistrer et commenter, mais pas publier.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return <>{typeof children === "function" ? children(user) : children}</>;
}
