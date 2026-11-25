import Image from "next/image";
import Link from "next/link";
import { FileText, Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import type { Author } from "@/types";
import type { Entry } from "@/utils/notifications";
import { timeAgo } from "@/utils/time";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/profile/FollowButton";

const BADGES = {
  like: { icon: Heart, className: "bg-red-500", fill: true },
  comment: { icon: MessageCircle, className: "bg-brand", fill: false },
  reply: { icon: Reply, className: "bg-indigo-500", fill: false },
  follow: { icon: UserPlus, className: "bg-emerald-500", fill: false },
};

const VERBS = {
  like: ["a aimé ta publication", "ont aimé ta publication"],
  comment: ["a commenté ta publication", "ont commenté ta publication"],
  reply: ["a répondu à ton commentaire", "ont répondu à ton commentaire"],
  follow: ["a commencé à te suivre.", "ont commencé à te suivre."],
};

function Actors({ actors }: { actors: Author[] }) {
  const link = (a: Author) => (
    <Link key={a._id} href={`/u/${a.username}`} className="relative z-10 font-semibold hover:underline">
      {a.name}
    </Link>
  );
  if (actors.length === 1) return link(actors[0]);
  if (actors.length === 2) return <>{link(actors[0])} et {link(actors[1])}</>;
  const others = actors.length - 2;
  return (
    <>
      {link(actors[0])}, {link(actors[1])} et {others} autre{others > 1 ? "s" : ""}
    </>
  );
}

/** Une ligne de la page Notifications : toute la ligne mène à la publication, ou au profil pour un abonnement. */
export default function NotificationRow({ entry }: { entry: Entry }) {
  const { type, actors, post, comment, unread } = entry;
  const badge = BADGES[type];
  const target =
    type === "follow" || !post ? `/u/${actors[0].username}` : `/posts/${post._id}${type === "like" ? "" : "#comments"}`;
  const verb = VERBS[type][actors.length > 1 ? 1 : 0];

  return (
    <li
      className={`group relative flex items-start gap-3 rounded-2xl p-3 transition hover:bg-field/70 ${unread ? "bg-brand-soft/50" : ""}`}
    >
      <Link href={target} aria-label={`${actors[0].name} ${verb}${post ? ` « ${post.title} »` : ""}`} className="absolute inset-0 rounded-2xl" />

      <Link href={`/u/${actors[0].username}`} className="relative z-10 size-11 shrink-0">
        {actors.length > 1 ? (
          <>
            <Avatar src={actors[0].avatar} name={actors[0].name} size={32} className="absolute top-0 left-0" />
            <Avatar src={actors[1].avatar} name={actors[1].name} size={32} className="absolute right-0 bottom-0 ring-2 ring-white" />
          </>
        ) : (
          <Avatar src={actors[0].avatar} name={actors[0].name} size={44} />
        )}
        <span
          className={`absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-white ${badge.className}`}
        >
          <badge.icon className={`size-3 ${badge.fill ? "fill-white" : ""}`} />
        </span>
      </Link>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="line-clamp-2 text-sm leading-snug">
          <Actors actors={actors} /> <span className="text-muted">{verb}</span>
          {post && type !== "follow" && (
            <>
              {type === "reply" && <span className="text-muted"> sur</span>}
              <span className="font-medium"> « {post.title} »</span>
            </>
          )}
        </p>
        {comment && (
          <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-ink ring-1 ring-line">
            <span className="line-clamp-2">{comment.content}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          <time dateTime={entry.createdAt}>{timeAgo(entry.createdAt)}</time>
        </p>
      </div>

      {unread && <span aria-label="Non lue" className="mt-4 size-2 shrink-0 rounded-full bg-brand" />}

      {type === "follow" ? (
        <div className="relative z-10 shrink-0 self-center">
          <FollowButton
            userId={actors[0]._id}
            initial={entry.following}
            variant="pill"
            confirm={{ name: actors[0].name, avatar: actors[0].avatar }}
            followLabel="Suivre en retour"
          />
        </div>
      ) : (
        post && (
          <span className="size-12 shrink-0 self-center overflow-hidden rounded-xl bg-brand-soft">
            {post.image ? (
              <Image src={post.image} alt="" width={48} height={48} className="size-12 object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-brand">
                <FileText className="size-5" />
              </span>
            )}
          </span>
        )
      )}
    </li>
  );
}
