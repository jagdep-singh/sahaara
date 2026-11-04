import type { Metadata } from "next";
import { Laila } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const deva = Laila({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-deva",
});

const satoshi = localFont({
  src: [
    {
      path: "../assets/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "sahaara",
  description: "sahaara - for NGOs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      className={`${deva.variable} ${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
