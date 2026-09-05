import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import Link from "next/link";

import { t } from "@/i18n";
import "./globals.css";

// Fraunces porte les titres : une antique douce, avec ses axes SOFT et WONK
// activés dans globals.css pour lui donner un dessin un peu manuscrit.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

// Karla porte l'interface et tous les chiffres.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: `${t.app.nom} — risque de change pour agences Omra et Hajj`,
  description: t.app.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr-CA"
      className={`${fraunces.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border">
          <div className="mx-auto flex w-full max-w-6xl items-baseline gap-8 px-6 py-5">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              {t.app.nom}
            </Link>
            <nav className="flex items-baseline gap-6 text-sm">
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.nav.forfaits}
              </Link>
              <Link
                href="/conformite"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.nav.conformite}
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-border">
          <p className="mx-auto w-full max-w-6xl px-6 py-6 text-sm leading-relaxed text-muted-foreground">
            {t.detail.avertissementGeneral}
          </p>
        </footer>
      </body>
    </html>
  );
}
