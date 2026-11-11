import Link from "next/link";
import { Fragment } from "react";

export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(#[\p{L}0-9_]+)/gu);

  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <Link key={i} prefetch={false} href={`/?tag=${encodeURIComponent(part.slice(1).toLowerCase())}`} className="text-brand hover:underline">
            {part}
          </Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
