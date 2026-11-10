import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`text-2xl font-bold tracking-tight text-ink ${className}`}>
      Solola
    </Link>
  );
}
