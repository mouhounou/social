import EditPost from "./EditPost";

export default async function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  const { id } = await params;
  return <EditPost id={id} />;
}
