import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import AuthInitializer from "@/components/providers/AuthInitializer";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Solola", template: "%s · Solola" },
  description: "Partage tes idées, tes créations et découvre celles des autres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
