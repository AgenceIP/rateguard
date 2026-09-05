import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";

import { EnTete, PiedDePage } from "@/components/chrome";
import { FournisseurLangue } from "@/i18n";
// Les métadonnées sont produites sur le serveur, hors de React : elles lisent
// le français directement plutôt que la langue active du navigateur.
import { fr } from "@/i18n/fr";
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
  title: `${fr.app.nom} — risque de change pour agences Omra et Hajj`,
  description: fr.app.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr-CA"
      className={`${fraunces.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FournisseurLangue>
          <EnTete />
          <main className="flex-1">{children}</main>
          <PiedDePage />
        </FournisseurLangue>
      </body>
    </html>
  );
}
