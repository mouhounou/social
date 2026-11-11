import PostDetail from "./PostDetail";

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  return <PostDetail key={id} id={id} />;
}
