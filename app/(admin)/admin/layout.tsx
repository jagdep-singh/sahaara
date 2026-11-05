import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

import "../../globals.css";

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
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "sahaara admin",
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/admin", label: "Schemes" },
  { href: "/admin/receipts", label: "Receipts" },
  { href: "/admin/callbacks", label: "Call-backs" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  return (
    <html
      lang="en"
      className={`${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {isAdmin ? (
          <header className="border-b border-border bg-card">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link href="/admin" className="font-heading text-lg font-bold">
                sahaara admin
              </Link>

              <div className="flex flex-wrap items-center gap-1">
                <nav aria-label="Admin" className="flex flex-wrap gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-2 font-bold hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <form action={logoutAction}>
                  <Button type="submit" variant="ghost" size="sm">
                    Log out
                  </Button>
                </form>
              </div>
            </div>
          </header>
        ) : null}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
