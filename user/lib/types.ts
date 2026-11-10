export type Role = "reader" | "author" | "admin";

export type User = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  bio: string;
  avatar: string | null;
  cover: string | null;
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  isFollowing?: boolean;
  isMe?: boolean;
  createdAt: string;
};

export type Author = Pick<User, "_id" | "name" | "username" | "avatar">;

export type Post = {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  image: string | null;
  visibility: "public" | "followers";
  author: Author;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  liked: boolean;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  _id: string;
  content: string;
  post: string;
  author: Author;
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  createdAt: string;
  actor: Author;
  post: { _id: string; title: string; image: string | null } | null;
  following: boolean;
};

export type Suggestion = Author & { followersCount: number; hint: string };

export type PostPage = { posts: Post[]; page: number; pages: number; total: number };
