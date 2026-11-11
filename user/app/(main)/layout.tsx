import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-line bg-white md:h-[72px]" />}>
        <Navbar />
      </Suspense>
      <main className="mx-auto max-w-7xl px-3 pt-4 pb-24 sm:px-4 md:pt-6 md:pb-10 lg:px-6">{children}</main>
    </>
  );
}
