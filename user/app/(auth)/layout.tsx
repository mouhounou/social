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
    <div className="relative hidden overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 lg:block">
      <span className="absolute -top-10 -left-12 size-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#7dd3fc,#1e8fff_55%,#1d4ed8)] shadow-2xl" />
      <span className="absolute top-16 right-[-3rem] size-56 rounded-full bg-[radial-gradient(circle_at_30%_30%,#c4b5fd,#818cf8_50%,#4f46e5)] shadow-2xl" />
      <span className="absolute bottom-[-4rem] left-10 size-60 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fde68a,#fbbf24_55%,#d97706)] shadow-2xl" />
      <span className="absolute right-12 bottom-24 size-28 rotate-12 rounded-[32px] bg-[radial-gradient(circle_at_30%_30%,#93c5fd,#3b82f6_60%,#1e40af)] shadow-xl" />

      <Bubble className="top-1/3 left-1/3 size-44" />
      <Bubble className="top-10 left-1/2 size-20" />
      <Bubble className="bottom-12 left-1/2 size-24" />
      <Bubble className="top-2/3 left-6 size-14" />

      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/50 bg-white/30 p-4 text-ink backdrop-blur-xl">
        <p className="text-sm font-semibold">Partage tes idées. Inspire ta communauté.</p>
        <p className="mt-1 text-xs text-ink/70">Publie, commente et suis les gens qui comptent pour toi.</p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200/70 p-4 sm:p-8">
      <div className="grid w-full max-w-5xl gap-4 rounded-[36px] bg-white p-3 shadow-[0_30px_80px_-30px_rgba(17,24,39,0.35)] lg:min-h-[640px] lg:grid-cols-2">
        <Visual />
        <main className="flex items-center justify-center px-4 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <GuestOnly />
            <Logo className="mb-8 block text-center text-lg" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
