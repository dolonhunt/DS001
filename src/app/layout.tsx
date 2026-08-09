import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Couple Budget App",
  description: "Monthly shared budget web app for couples",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
