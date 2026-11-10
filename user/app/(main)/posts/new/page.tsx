import type { Metadata } from "next";
import PostForm from "@/components/PostForm";

export const metadata: Metadata = { title: "Nouvelle publication" };

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PostForm />
    </div>
  );
}
