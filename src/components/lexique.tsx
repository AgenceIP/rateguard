"use client";

import { useT, type Traductions } from "@/i18n";

export type CleTerme = keyof Traductions["lexique"];

/**
 * Un terme financier et son explication, côte à côte.
 *
 * La définition est TOUJOURS visible — pas une infobulle. Une explication
 * cachée derrière un survol n'existe pas au clavier, n'existe pas au doigt, et
 * n'existe pas pour la personne qui lit vite : elle ne remplit donc pas la
 * contrainte « aucun terme financier sans son explication ».
 */
export function Terme({ cle }: { cle: CleTerme }) {
  const { terme, definition } = useT().lexique[cle];
  return (
    <span>
      <span className="font-medium text-foreground">{terme}</span>{" "}
      <span className="text-muted-foreground">— {definition}</span>
    </span>
  );
}

/** Le même contenu en bloc, pour ouvrir une section. */
export function Glose({ cles }: { cles: CleTerme[] }) {
  return (
    <dl className="registre mt-4 border-y border-border text-sm">
      {cles.map((cle) => (
        <div key={cle} className="py-3">
          <Terme cle={cle} />
        </div>
      ))}
    </dl>
  );
}
