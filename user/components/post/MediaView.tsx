import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Media } from "@/types";
import { hostname } from "@/lib/media";

/** Affiche le média d'un paragraphe : image ou vidéo hébergée, ou lecteur YouTube, Vimeo, Dailymotion. */
export default function MediaView({ media, title }: { media: Media; title: string }) {
  if (media.provider !== "cloudinary") {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          src={media.url}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      </div>
    );
  }

  return (
    <figure>
      {media.type === "video" ? (
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          className="max-h-[640px] w-full rounded-2xl bg-black"
        />
      ) : (
        <Image
          src={media.url}
          alt={title}
          width={1200}
          height={800}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="max-h-[640px] w-full rounded-2xl bg-field object-contain"
        />
      )}
      {media.link && (
        <figcaption className="mt-1.5 text-[11px] text-muted">
          <a
            href={media.link}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="inline-flex items-center gap-1 hover:text-ink hover:underline"
          >
            Source : {hostname(media.link)} <ExternalLink className="size-3" />
          </a>
        </figcaption>
      )}
    </figure>
  );
}
