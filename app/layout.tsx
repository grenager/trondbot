import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trondbot",
  description: "Simple language learning AI chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
