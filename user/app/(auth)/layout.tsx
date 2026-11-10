import { Heart, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col">
        <span className="text-2xl font-bold">Solola</span>

        <div className="relative my-auto">
          <h2 className="max-w-md text-4xl leading-tight font-semibold">
            Partage tes idées. Inspire ta communauté.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Publie tes créations, échange en commentaires et suis les gens qui comptent pour toi.
          </p>

          <div className="mt-12 w-80 rotate-[-4deg] rounded-[20px] bg-white p-4 text-ink shadow-2xl">
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

          <div className="absolute top-40 right-6 w-56 rotate-[6deg] rounded-[20px] bg-white/95 p-4 text-ink shadow-xl xl:right-16">
            <p className="text-sm font-semibold">Activité</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="size-7 rounded-full bg-sky-200" />
              <span>
                <b>Deraa</b> te suit maintenant
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="size-7 rounded-full bg-rose-200" />
              <span>
                <b>Ediwp</b> a aimé ta photo
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -right-24 -bottom-24 size-80 rounded-full bg-white/10" />
        <div className="absolute -top-16 -left-16 size-56 rounded-full bg-white/10" />
      </aside>

      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <Logo className="mb-10 block lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
