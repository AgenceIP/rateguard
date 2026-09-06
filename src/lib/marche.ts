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

/**
 * Trois ans. Le calendrier a besoin de ~150 observations par paquet de
 * semaines pour que son garde-fou de significativité puisse conclure quoi que
 * ce soit ; un an n'en donne que ~50. Un seul appel, deux usages.
 */
const JOURS_HISTORIQUE = 1095;

/** Fenêtre courte pour les statistiques d'amplitude. */
export const JOURS_STATISTIQUES = 365;

/**
 * Le premier jour d'une fenêtre de `jours` jours civils.
 *
 * Exporté parce que la page d'accueil doit découper le journal sur exactement
 * la même borne que la série : deux bornes calculées séparément se décalent, et
 * le bilan compare alors des paiements à une moyenne d'une autre période.
 */
export function debutFenetre(jours: number): string {
  return new Date(Date.now() - jours * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Les `jours` derniers jours civils d'une série.
 *
 * Les statistiques de la page détail décrivent le régime récent, le calendrier
 * a besoin de toute la profondeur. Les deux fenêtres coexistent et chaque
 * écran affiche celle qu'il utilise — ne jamais laisser croire qu'un chiffre
 * porte sur une période qu'il ne couvre pas.
 */
export function derniersJours(serie: SerieTaux, jours: number): SerieTaux {
  const limite = debutFenetre(jours);
  const depart = serie.dates.findIndex((d) => d >= limite);

  // Aucune date n'atteint la limite : toute la série précède la fenêtre.
  // Renvoyer la série entière l'étiquetterait comme couvrant une période
  // qu'elle ne couvre pas. On renvoie du vide, et en aval `suffisant` passe
  // à false — les statistiques disparaissent au lieu d'être mal datées.
  if (depart === -1) {
    return { de: serie.de, vers: serie.vers, dates: [], valeurs: [] };
  }
  if (depart === 0) return serie;

  return {
    de: serie.de,
    vers: serie.vers,
    dates: serie.dates.slice(depart),
    valeurs: serie.valeurs.slice(depart),
  };
}

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
