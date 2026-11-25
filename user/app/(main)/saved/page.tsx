import type { Metadata } from "next";
import PostGrid from "@/components/post/PostGrid";
import RequireAuth from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "Enregistrés" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-lg font-semibold">Publications enregistrées</h1>
      <RequireAuth>
        <PostGrid filters={{ saved: "true" }} empty="Tu n'as encore rien enregistré." />
      </RequireAuth>
    </div>
  );
}
