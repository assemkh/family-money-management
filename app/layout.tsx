import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader, Noto_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { WebVitalsReporter } from "@/components/observability/web-vitals-reporter";
import { defaultLocale, getDirection, getMessages } from "@/lib/i18n/config";

import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: getMessages().metadata.title,
    template: `%s | ${getMessages().metadata.title}`,
  },
  description: getMessages().metadata.description,
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
  subsets: ["latin"],
});

const displayFont = Newsreader({
  variable: "--font-display",
  weight: ["500", "600"],
  display: "swap",
  subsets: ["latin"],
});

const arabicFont = Noto_Sans_Arabic({
  variable: "--font-arabic",
  weight: ["400", "500", "600"],
  display: "swap",
  subsets: ["arabic"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      dir={getDirection(defaultLocale)}
      suppressHydrationWarning
    >
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${arabicFont.variable} font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <WebVitalsReporter />
        </ThemeProvider>
      </body>
    </html>
  );
}
