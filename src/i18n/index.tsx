"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { definirLangueFormat, type Langue } from "@/lib/format";
import { fr } from "./fr";

/**
 * Point d'entrée unique des chaînes de l'interface.
 * Le français est la forme de référence : le type Traductions en est dérivé et
 * en.ts doit le satisfaire, donc une clé manquante casse la compilation.
 */
export type Traductions = typeof fr;
export type { Langue };

const CLE_STOCKAGE = "rateguard.langue.v1";

const Contexte = createContext<{
  langue: Langue;
  t: Traductions;
  changerLangue: (langue: Langue) => void;
}>({ langue: "fr", t: fr, changerLangue: () => {} });

/** Les chaînes de la langue active. À utiliser dans tout composant client. */
export function useT(): Traductions {
  return useContext(Contexte).t;
}

/** Pour l'unique composant qui a besoin de la langue elle-même : le sélecteur. */
export function useLangue() {
  const { langue, changerLangue } = useContext(Contexte);
  return { langue, changerLangue };
}

export function FournisseurLangue({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le serveur ne connaît pas la préférence : il rend toujours le français, et
  // le navigateur bascule au montage s'il trouve un autre choix enregistré.
  // Lire le localStorage pendant le rendu produirait une erreur d'hydratation.
  const [langue, setLangue] = useState<Langue>("fr");
  const [traductions, setTraductions] = useState<Traductions>(fr);

  useEffect(() => {
    const enregistree = localStorage.getItem(CLE_STOCKAGE);
    if (enregistree === "en" || enregistree === "fr") appliquer(enregistree);
  }, []);

  useEffect(() => {
    document.documentElement.lang = langue === "fr" ? "fr-CA" : "en-CA";
  }, [langue]);

  async function appliquer(suivante: Langue) {
    // en.ts n'est chargé que si quelqu'un demande l'anglais.
    const chargee =
      suivante === "fr" ? fr : ((await import("./en")).en as Traductions);
    setTraductions(chargee);
    setLangue(suivante);
  }

  function changerLangue(suivante: Langue) {
    localStorage.setItem(CLE_STOCKAGE, suivante);
    void appliquer(suivante);
  }

  // Appelé au rendu, pas dans un effet : les enfants formatent leurs nombres
  // dans la foulée de ce rendu-ci, et attendre un effet les ferait afficher
  // une locale en retard d'un tour.
  definirLangueFormat(langue);

  return (
    <Contexte.Provider value={{ langue, t: traductions, changerLangue }}>
      {children}
    </Contexte.Provider>
  );
}
