import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Figtree } from "next/font/google";
import { THEME_COOKIE, isTheme } from "@/features/theme/theme";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Rendered server-side so the palette is correct in the first byte — no
  // flash of the wrong theme. No cookie means no attribute, which leaves
  // `color-scheme: light dark` in globals.css to follow the OS.
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : undefined;

  return (
    <html
      lang="en"
      {...(theme ? { "data-theme": theme } : {})}
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
