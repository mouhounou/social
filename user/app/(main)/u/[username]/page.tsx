import Profile from "./Profile";

export default async function ProfilePage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  return <Profile key={username} username={username} />;
}
