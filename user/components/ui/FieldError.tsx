import { CircleAlert } from "lucide-react";

type Props = { id?: string; children?: string };

export default function FieldError({ id, children }: Props) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600">
      <CircleAlert className="mt-px size-3.5 shrink-0" />
      {children}
    </p>
  );
}
