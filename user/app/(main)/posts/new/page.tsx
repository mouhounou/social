import type { Metadata } from "next";
import PostForm from "@/components/post/PostForm";
import RequireAuth from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "Nouvelle publication" };

export default function NewPostPage() {
  return (
    <div>
      <RequireAuth roles={["author", "admin"]}>
        <PostForm />
      </RequireAuth>
    </div>
  );
}
