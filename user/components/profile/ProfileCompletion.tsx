import { Circle, CircleCheck } from "lucide-react";
import type { User } from "@/types";

export default function ProfileCompletion({ user, onEdit }: { user: User; onEdit: () => void }) {
  const steps = [
    { label: "Photo de profil", done: !!user.avatar },
    { label: "Photo de couverture", done: !!user.cover },
    { label: "Bio", done: !!user.bio },
    { label: "Ville", done: !!user.location },
    { label: "Site web", done: !!user.website },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const percent = Math.round((done / steps.length) * 100);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Complète ton profil</p>
        <span className="text-sm font-semibold text-brand">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-field">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {steps.map((s) => (
          <li key={s.label} className={`flex items-center gap-2.5 ${s.done ? "text-muted line-through" : ""}`}>
            {s.done ? <CircleCheck className="size-4 text-emerald-500" /> : <Circle className="size-4 text-line" />}
            {s.label}
          </li>
        ))}
      </ul>
      <button onClick={onEdit} className="btn-primary mt-5 w-full py-2.5">
        Compléter
      </button>
    </div>
  );
}
