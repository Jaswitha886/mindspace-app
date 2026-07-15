import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

// One family: Figtree carries display, UI, and figures alike — weight does the
// separating. Soft terminals keep it friendly at the sizes a student reads a
// mood prompt at, without going soft enough to undercut counsellor tables.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindSpace",
  description: "Campus counselling, booking, and wellbeing — in one calm place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
