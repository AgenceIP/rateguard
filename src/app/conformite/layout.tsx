import type { Metadata } from "next";

import { fr } from "@/i18n/fr";

// Le titre de page est produit sur le serveur : il reste en français, comme
// celui de la racine. La page elle-même suit la langue choisie à l'écran.
export const metadata: Metadata = {
  title: `${fr.conformite.titre} — ${fr.app.nom}`,
};

export default function ConformiteLayout({
  children,
}: LayoutProps<"/conformite">) {
  return children;
}
