import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { THEME_COOKIE, isTheme } from "@/features/theme/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
  // flash of the wrong theme. No cookie means light mode (the default);
  // dark is only applied when the user explicitly chooses it.
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : undefined;

  return (
    <html
      lang="en"
      {...(theme ? { "data-theme": theme } : {})}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
