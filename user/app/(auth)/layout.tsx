import { Heart, MessageCircle } from "lucide-react";
import GuestOnly from "@/components/auth/GuestOnly";
import Logo from "@/components/layout/Logo";

function Bubble({ className }: { className: string }) {
  return (
    <span
      className={`absolute rounded-full border border-white/50 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0.25)_35%,rgba(255,255,255,0.05)_70%)] shadow-[inset_-10px_-14px_30px_rgba(30,64,175,0.25)] backdrop-blur-sm ${className}`}
    />
  );
}

function Visual() {
  return (
    <div className="relative hidden overflow-hidden rounded-[28px] bg-gradient-to-br from-brand via-blue-500 to-indigo-600 p-10 text-white lg:flex lg:flex-col">
      <span className="absolute -right-24 -bottom-24 size-80 rounded-full bg-white/10" />
      <span className="absolute -top-16 -left-16 size-56 rounded-full bg-white/10" />
      <Bubble className="top-24 right-10 size-16" />
      <Bubble className="bottom-10 left-8 size-12" />

      <div className="relative">
        <h2 className="max-w-sm text-3xl leading-tight font-semibold">Partage tes idées. Inspire ta communauté.</h2>
        <p className="mt-3 max-w-xs text-sm text-white/80">
          Publie tes créations, échange en commentaires et suis les gens qui comptent pour toi.
        </p>
      </div>

      <div className="relative mt-auto mb-6 h-80">
        <div className="absolute top-14 left-0 w-72 rotate-[-4deg] rounded-[20px] bg-white p-4 text-ink shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-full bg-amber-200" />
            <div>
              <p className="text-sm font-semibold">Briansky</p>
              <p className="text-[11px] text-muted">il y a 12 minutes</p>
            </div>
          </div>
          <p className="mt-3 text-sm">
            Mon dernier mural est fini ! <span className="text-brand">#art #streetart</span>
          </p>
          <div className="mt-3 h-28 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700" />
          <div className="mt-3 flex gap-5 text-xs">
            <span className="flex items-center gap-1">
              <Heart className="size-4 fill-red-500 text-red-500" /> 320k
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-4" /> 120
            </span>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-56 rotate-[6deg] rounded-[20px] bg-white/95 p-4 text-ink shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-7 shrink-0 rounded-full bg-sky-200" />
            <span>
              <b>Deraa</b> te suit maintenant
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="size-7 shrink-0 rounded-full bg-rose-200" />
            <span>
              <b>Ediwp</b> a aimé ta photo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200/70 p-4 sm:p-8 lg:h-screen lg:overflow-hidden">
      <div className="grid w-full max-w-5xl gap-4 rounded-[36px] bg-white p-3 shadow-[0_30px_80px_-30px_rgba(17,24,39,0.35)] lg:h-full lg:max-h-[860px] lg:grid-cols-2">
        <Visual />
        <main className="flex flex-col [scrollbar-width:thin] px-4 py-10 sm:px-10 lg:min-h-0 lg:overflow-y-auto">
          <div className="m-auto w-full max-w-sm">
            <GuestOnly />
            <Logo className="mb-8 block text-center text-lg" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
