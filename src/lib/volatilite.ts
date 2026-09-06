import type { SerieTaux, StatsVolatilite } from "./types";

/**
 * Statistiques de change mesurées sur l'historique réel.
 *
 * Ce module ne prédit rien et ne peut structurellement rien prédire : il ne
 * regarde que le passé et n'en extrait que des AMPLITUDES, jamais des
 * directions. « Cette paire a bougé de 1,2 % sur deux semaines, la moitié du
 * temps » est une mesure. « Elle va baisser » serait une prévision, et rien
 * ici ne la produit — aucune fonction ne retourne un taux futur.
 *
 * Les taux de change à court terme suivent une marche quasi aléatoire : la
 * volatilité passée renseigne raisonnablement sur l'ampleur des mouvements à
 * venir, la direction passée ne renseigne sur rien.
 */

/** Jours de bourse dans une année. Convention standard pour annualiser. */
const JOURS_BOURSE_PAR_AN = 252;

/** En dessous, l'écart-type n'a pas de sens statistique. */
const OBSERVATIONS_MINIMALES = 20;

/** Fenêtres glissantes minimales pour publier une amplitude. */
const FENETRES_MINIMALES = 10;

/**
 * Variations quotidiennes en rendements logarithmiques.
 *
 * Le log plutôt que la variation simple parce qu'il est symétrique : une
 * hausse puis une baisse de même ampleur logarithmique se compensent
 * exactement, ce qui n'est pas vrai en pourcentage simple. Sur une paire de
 * devises, où l'on regarde autant les baisses que les hausses, cette symétrie
 * est exactement la propriété qu'on veut.
 *
 * Les valeurs nulles ou négatives sont ignorées : un taux ne peut pas l'être,
 * et une API qui en renvoie une doit être écartée plutôt qu'interpolée.
 */
export function variationsQuotidiennes(valeurs: number[]): number[] {
  const sorties: number[] = [];
  for (let i = 1; i < valeurs.length; i++) {
    const precedent = valeurs[i - 1];
    const courant = valeurs[i];
    if (precedent > 0 && courant > 0) sorties.push(Math.log(courant / precedent));
  }
  return sorties;
}

/** Écart-type d'échantillon (dénominateur n − 1). */
export function ecartType(xs: number[]): number {
  if (xs.length < 2) return 0;
  const moyenne = xs.reduce((s, x) => s + x, 0) / xs.length;
  const variance =
    xs.reduce((s, x) => s + (x - moyenne) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/**
 * Percentile par interpolation linéaire sur la série triée.
 * `p` est exprimé sur 100. percentile(xs, 50) est la médiane.
 */
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const tries = [...xs].sort((a, b) => a - b);
  if (tries.length === 1) return tries[0];
  const rang = ((tries.length - 1) * p) / 100;
  const bas = Math.floor(rang);
  const haut = Math.ceil(rang);
  if (bas === haut) return tries[bas];
  return tries[bas] + (tries[haut] - tries[bas]) * (rang - bas);
}

/**
 * Convertit une durée en jours civils en nombre de séances.
 * L'API ne publie que les jours ouvrables : 14 jours civils ≈ 10 séances.
 * Toujours au moins 1, sinon la fenêtre glissante serait vide.
 */
export function seancesPourJours(joursCiviles: number): number {
  return Math.max(1, Math.round((joursCiviles * 5) / 7));
}

/**
 * Variations en % sur toutes les fenêtres glissantes de `seances` séances.
 *
 * On prend toutes les fenêtres qui se chevauchent, pas seulement les fenêtres
 * disjointes : sur un an d'historique il n'y a que 26 quinzaines disjointes,
 * ce qui est trop peu pour un percentile. Le chevauchement corrèle les
 * observations et resserre donc un peu les extrêmes — c'est un compromis
 * assumé, pas un oubli.
 */
export function fenetresGlissantes(
  valeurs: number[],
  seances: number,
): number[] {
  const sorties: number[] = [];
  for (let i = 0; i + seances < valeurs.length; i++) {
    const depart = valeurs[i];
    const arrivee = valeurs[i + seances];
    if (depart > 0 && arrivee > 0) sorties.push((arrivee / depart - 1) * 100);
  }
  return sorties;
}

/**
 * Décrit ce que cette paire a fait, sur la fenêtre qui correspond au rythme de
 * paie réel de l'utilisateur.
 *
 * `suffisant` à false signifie que l'appelant doit afficher « données
 * insuffisantes » et non un chiffre : mieux vaut un trou déclaré qu'une
 * statistique fabriquée sur trois points.
 */
export function calculerVolatilite(
  serie: SerieTaux,
  fenetreJours: number,
): StatsVolatilite {
  const variations = variationsQuotidiennes(serie.valeurs);
  const seances = seancesPourJours(fenetreJours);
  const fenetres = fenetresGlissantes(serie.valeurs, seances);

  // Une paire fixée par un ancrage officiel (SAR/USD, XAF/EUR…) produit une
  // volatilité nulle. Ce n'est pas une donnée manquante, c'est le résultat.
  const quotidienne = ecartType(variations);
  const suffisant =
    variations.length >= OBSERVATIONS_MINIMALES &&
    fenetres.length >= FENETRES_MINIMALES;

  const amplitudes = fenetres.map(Math.abs);
  // Défavorable = le taux baisse = la devise de base achète moins.
  const defavorables = fenetres.filter((x) => x < 0).map(Math.abs);
  const favorables = fenetres.filter((x) => x > 0);

  return {
    de: serie.de,
    vers: serie.vers,
    observations: variations.length,
    debut: serie.dates[0] ?? "",
    fin: serie.dates[serie.dates.length - 1] ?? "",
    quotidiennePct: quotidienne * 100,
    annualiseePct: quotidienne * Math.sqrt(JOURS_BOURSE_PAR_AN) * 100,
    fenetreJours,
    fenetresObservees: fenetres.length,
    amplitudeMedianePct: percentile(amplitudes, 50),
    amplitudeP80Pct: percentile(amplitudes, 80),
    amplitudeP95Pct: percentile(amplitudes, 95),
    pireDefavorablePct: defavorables.length ? Math.max(...defavorables) : 0,
    meilleurFavorablePct: favorables.length ? Math.max(...favorables) : 0,
    suffisant,
  };
}

/**
 * Ce que coûte le paiement si le taux bouge de `mouvementPct`.
 *
 * Sert uniquement à illustrer des cas de figure fournis par l'appelant. La
 * fonction ne choisit aucun mouvement : c'est ce qui la garde du bon côté de
 * la ligne « pas de prédiction ».
 */
export function coutAuMouvement(
  montantCible: number,
  tauxActuel: number,
  mouvementPct: number,
): number {
  const taux = tauxActuel * (1 + mouvementPct / 100);
  return taux > 0 ? montantCible / taux : 0;
}

/**
 * Exposition en devise de base : ce que le paiement coûte au taux du jour,
 * avant tout frais.
 */
export function coutAuTauxDuJour(
  montantCible: number,
  tauxActuel: number,
): number {
  return tauxActuel > 0 ? montantCible / tauxActuel : 0;
}

/**
 * Montant que l'utilisateur risque de payer en plus s'il attend, exprimé en
 * devise de base.
 *
 * On retient l'amplitude P80 : quatre fenêtres historiques sur cinq ont bougé
 * moins que ça. Ce n'est pas un plafond, et l'interface ne doit jamais le
 * présenter comme tel — c'est un ordre de grandeur du risque, pas une borne.
 */
export function risqueDAttendre(
  montantCible: number,
  tauxActuel: number,
  stats: StatsVolatilite,
): number {
  if (!stats.suffisant) return 0;
  const aujourdhui = coutAuTauxDuJour(montantCible, tauxActuel);
  const defavorable = coutAuMouvement(
    montantCible,
    tauxActuel,
    -stats.amplitudeP80Pct,
  );
  return defavorable - aujourdhui;
}
