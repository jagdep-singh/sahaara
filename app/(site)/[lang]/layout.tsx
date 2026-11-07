import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDict, isLang } from "@/i18n";

import "../../globals.css";

const deva = localFont({
  src: [
    { path: "../../../assets/fonts/NotoSansDevanagari-Regular.woff2", weight: "400" },
    { path: "../../../assets/fonts/NotoSansDevanagari-Bold.woff2", weight: "700" },
  ],
  display: "swap",
  preload: false,
  variable: "--font-deva",
});

const satoshi = localFont({
  src: [
    {
      path: "../../../assets/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../assets/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../assets/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  preload: false,
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "sahaara",
  description:
    "sahaara — government schemes, eligibility checks and donations.",
};

type SiteLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function SiteLayout({
  children,
  params,
}: SiteLayoutProps) {
  const { lang } = await params;

  if (!isLang(lang)) {
    notFound();
  }

  const dict = getDict(lang);

  return (
    <html
      lang={lang}
      className={`${deva.variable} ${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-lg focus:font-bold focus:text-primary-foreground focus:ring-3 focus:ring-ring/50"
        >
          {dict.common.skip}
        </a>

        <SiteHeader lang={lang} dict={dict} />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter dict={dict} />
      </body>
    </html>
  );
}
