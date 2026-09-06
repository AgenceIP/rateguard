"use client";

import { useEffect, useState } from "react";

import type { SerieTaux } from "./types";

/**
 * Accès client aux deux routes de données de marché.
 *
 * Une seule fonction charge le taux du jour ET l'historique, parce qu'aucun
 * écran n'a besoin de l'un sans l'autre : le taux sert à convertir, la série
 * sert à mesurer de combien ça bouge.
 *
 * `motif` non nul veut dire qu'il n'y a pas de donnée, et l'interface doit le
 * dire mot pour mot. C'est la contrainte la plus explicite du cahier des
 * charges : quand une devise n'est pas publiée, on l'annonce, on n'extrapole
 * pas.
 */

export type MotifAbsence =
  | "devise_non_publiee"
  | "source_indisponible"
  | "meme_devise";

export interface Marche {
  taux: number | null;
  dateTaux: string;
  serie: SerieTaux | null;
  motif: MotifAbsence | null;
}

/** Une paire n'est chargée qu'une fois par session, promesse partagée. */
const cache = new Map<string, Promise<Marche>>();

const JOURS_HISTORIQUE = 365;

async function charger(de: string, vers: string): Promise<Marche> {
  if (de === vers) {
    return { taux: 1, dateTaux: "", serie: null, motif: "meme_devise" };
  }

  const [taux, serie] = await Promise.all([
    fetch(`/api/taux?de=${de}&vers=${vers}`)
      .then((r) => r.json())
      .catch(() => ({ disponible: false, motif: "source_indisponible" })),
    fetch(`/api/serie?de=${de}&vers=${vers}&jours=${JOURS_HISTORIQUE}`)
      .then((r) => r.json())
      .catch(() => ({ disponible: false })),
  ]);

  if (!taux.disponible) {
    return {
      taux: null,
      dateTaux: "",
      serie: null,
      motif: (taux.motif as MotifAbsence) ?? "source_indisponible",
    };
  }

  return {
    taux: taux.taux as number,
    dateTaux: taux.dateTaux as string,
    // Un taux sans historique reste utilisable : on convertit, on ne mesure
    // simplement aucun mouvement.
    serie: serie.disponible
      ? { de, vers, dates: serie.dates, valeurs: serie.valeurs }
      : null,
    motif: null,
  };
}

export function obtenirMarche(de: string, vers: string): Promise<Marche> {
  const cle = `${de}|${vers}`;
  const existante = cache.get(cle);
  if (existante) return existante;
  const promesse = charger(de, vers);
  cache.set(cle, promesse);
  return promesse;
}

/**
 * Les marchés de plusieurs devises à la fois, indexés par devise cible.
 * La page de détail passe un tableau d'un seul élément — une seule
 * implémentation pour les deux usages.
 */
export function useMarches(de: string, devises: string[]) {
  const cle = [...new Set(devises)].sort().join(",");
  const [marches, setMarches] = useState<Record<string, Marche>>({});
  const [chargement, setChargement] = useState(cle.length > 0);

  useEffect(() => {
    const liste = cle ? cle.split(",") : [];
    if (liste.length === 0) {
      setMarches({});
      setChargement(false);
      return;
    }

    let vivant = true;
    setChargement(true);
    Promise.all(liste.map((vers) => obtenirMarche(de, vers))).then(
      (resultats) => {
        if (!vivant) return;
        setMarches(Object.fromEntries(liste.map((v, i) => [v, resultats[i]])));
        setChargement(false);
      },
    );
    return () => {
      vivant = false;
    };
  }, [de, cle]);

  return { marches, chargement };
}
