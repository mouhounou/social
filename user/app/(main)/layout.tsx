import { Suspense } from "react";
import Navbar from "@/components/Navbar";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-[72px] border-b border-line bg-white" />}>
        <Navbar />
      </Suspense>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</main>
    </>
  );
}
