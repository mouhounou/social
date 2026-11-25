export type Role = "reader" | "author" | "admin";

export type User = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  bio: string;
  location: string;
  website: string;
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

/** Image ou vidéo d'un paragraphe. `cloudinary` : fichier hébergé ; sinon `url` est le lecteur à intégrer. */
export type Media = {
  type: "image" | "video";
  provider: "cloudinary" | "youtube" | "vimeo" | "dailymotion";
  url: string;
  /** Lien d'origine quand le média vient d'une autre plateforme, null s'il a été envoyé depuis l'appareil. */
  link: string | null;
};

export type Paragraph = {
  title: string;
  description: string;
  media: Media | null;
};

export type Post = {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  image: string | null;
  /** Facultatif : absent ou vide pour une publication sans paragraphes. */
  paragraphs?: Paragraph[];
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
  /** Commentaire de premier niveau auquel cette réponse est rattachée ; null pour un commentaire. */
  parent: string | null;
  /** Personne à qui la réponse s'adresse. */
  replyTo: { _id: string; name: string; username: string } | null;
  repliesCount: number;
  author: Author;
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: "like" | "comment" | "reply" | "follow";
  read: boolean;
  createdAt: string;
  actor: Author;
  post: { _id: string; title: string; image: string | null } | null;
  /** Le commentaire, pour une notification de commentaire (absent des plus anciennes). */
  comment?: { _id: string; content: string } | null;
  following: boolean;
};

export type NotificationPage = { unread: number; page: number; pages: number; total: number; notifications: Notification[] };

/** Compte d'une liste d'abonnés ou d'abonnements, vu par l'utilisateur connecté. */
export type Connection = Author & { bio: string; isFollowing: boolean; followsYou: boolean; isMe: boolean };

export type Suggestion = Author & { followersCount: number; hint: string };

export type PostPage = { posts: Post[]; page: number; pages: number; total: number };
