import type { Metadata } from "next";
import PostForm from "@/components/PostForm";
import RequireAuth from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Nouvelle publication" };

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <RequireAuth roles={["author", "admin"]}>
        <PostForm />
      </RequireAuth>
    </div>
  );
}
