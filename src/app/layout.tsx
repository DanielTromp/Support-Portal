import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Support Portal",
  description: "Veelgestelde vragen over mobiele dienstverlening",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
