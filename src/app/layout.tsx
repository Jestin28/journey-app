import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { ParksProvider } from "@/components/providers/ParksProvider";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A clean Next.js 14 starter with App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <ParksProvider>
          <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
            <Header />
            <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6">{children}</main>
          </div>
        </ParksProvider>
      </body>
    </html>
  );
}
