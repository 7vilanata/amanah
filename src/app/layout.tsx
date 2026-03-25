import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Amanah Project Hub",
    template: "%s | Amanah Project Hub",
  },
  description: "Sistem project management internal untuk agency berbasis Next.js, MySQL, dan Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
