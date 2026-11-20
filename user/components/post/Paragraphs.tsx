import type { Paragraph } from "@/types";
import RichText from "@/components/ui/RichText";
import MediaView from "@/components/post/MediaView";

export default function Paragraphs({ paragraphs }: { paragraphs: Paragraph[] }) {
  if (!paragraphs.length) return null;

  return (
    <div className="mt-6 space-y-8">
      {paragraphs.map((p, i) => (
        <section key={i} className="space-y-3">
          <h2 className="text-base font-semibold">{p.title}</h2>
          {p.description && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-line">
              <RichText text={p.description} />
            </p>
          )}
          {p.media && <MediaView media={p.media} title={p.title} />}
        </section>
      ))}
    </div>
  );
}
