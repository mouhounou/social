import type { Metadata } from "next";
import Feed from "@/components/post/Feed";
import RequireAuth from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "Enregistrés" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-lg font-semibold">Publications enregistrées</h1>
      <RequireAuth>
        <Feed filters={{ saved: "true" }} showSort={false} empty="Tu n'as encore rien enregistré." />
      </RequireAuth>
    </div>
  );
}
