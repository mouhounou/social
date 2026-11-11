import { LoaderCircle } from "lucide-react";

export default function Spinner({ className = "" }: { className?: string }) {
  return <LoaderCircle className={`size-5 animate-spin text-brand ${className}`} />;
}
