import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asian LE Staff Admin",
  description: "Asian LE Staff Admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
