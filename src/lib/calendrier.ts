/**
 * Le calendrier : quand un paiement part réellement, et à quel point une
 * période est agitée.
 *
 * CE QUE CE MODULE NE FAIT PAS. Il ne dit jamais quelle semaine est
 * « meilleure ». Une carte de saisonnalité directionnelle — « le CAD est plus
 * fort en semaine 32 » — serait la ligne rouge du défi déguisée en
 * statistique, et sur des données de change ces motifs sont presque toujours
 * du bruit non reproductible. Tout ce qui sort d'ici est une AMPLITUDE, donc
 * une valeur absolue, donc muette sur le sens.
 */

import type { SerieTaux, StatsVolatilite } from "./types";
import {
  coutAuMouvement,
  coutAuTauxDuJour,
  percentile,
  variationsQuotidiennes,
} from "./volatilite";

const JOUR_MS = 86_400_000;

/** Parse une date ISO en UTC. Le constructeur local décalerait d'un jour. */
function utc(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00Z`);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Dimanche de Pâques par l'algorithme grégorien anonyme.
 *
 * Deux des six fériés TARGET2 en dépendent, et ils se déplacent de plus d'un
 * mois d'une année sur l'autre : une liste écrite à la main serait fausse
 * l'année prochaine.
 */
function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const jours = h + l - 7 * m + 114;
  return new Date(Date.UTC(annee, Math.floor(jours / 31) - 1, (jours % 31) + 1));
}

/**
 * Jours fériés TARGET2 — les jours où le système de règlement de l'euro est
 * fermé, donc où la BCE ne publie aucun taux de référence.
 */
export function joursFeriesTarget(annee: number): string[] {
  const dimanche = paques(annee);
  const decale = (n: number) => iso(new Date(dimanche.getTime() + n * JOUR_MS));
  return [
    `${annee}-01-01`,
    decale(-2), // Vendredi saint
    decale(1), // Lundi de Pâques
    `${annee}-05-01`,
    `${annee}-12-25`,
    `${annee}-12-26`,
  ];
}

/** true si un virement daté de ce jour peut réellement partir ce jour-là. */
export function estSeance(dateIso: string): boolean {
  const d = utc(dateIso);
  const jour = d.getUTCDay();
  if (jour === 0 || jour === 6) return false;
  return !joursFeriesTarget(d.getUTCFullYear()).includes(dateIso);
}

/**
 * La date à laquelle le paiement partira vraiment, et le nombre de jours de
 * dérive que l'utilisateur subit sans l'avoir choisi.
 */
export function prochaineSeance(dateIso: string): {
  date: string;
  decalageJours: number;
} {
  let d = utc(dateIso);
  let decalageJours = 0;
  // Bornée : une fermeture de plus de dix jours consécutifs n'existe pas.
  while (!estSeance(iso(d)) && decalageJours < 10) {
    d = new Date(d.getTime() + JOUR_MS);
    decalageJours++;
  }
  return { date: iso(d), decalageJours };
}

/**
 * Un paquet d'observations — une semaine du mois, un jour de semaine.
 *
 * `ratio` est l'amplitude médiane du paquet rapportée à l'amplitude médiane
 * globale : 1,4 veut dire « cette période a bougé 1,4× une période ordinaire ».
 * Jamais dans quel sens.
 */
export interface PaquetAmplitude {
  cle: number;
  n: number;
  medianePct: number;
  ratio: number;
  /** true seulement si le paquet se détache vraiment. Voir les seuils ci-dessous. */
  distinct: boolean;
}

/**
 * Seuils du garde-fou de significativité.
 *
 * ponytail: heuristique, pas un test statistique formel. Sans elle, avec cinq
 * paquets et du bruit, il y en a toujours un qui « ressort » et le calendrier
 * finit par désigner du hasard. Si le produit devait porter cette mesure plus
 * loin, le chemin est un test de permutation sur les médianes.
 */
export const OBSERVATIONS_MINIMALES_PAQUET = 40;
const RATIO_HAUT = 1.25;
const RATIO_BAS = 0.8;

function paquets(
  serie: SerieTaux,
  cles: number[],
  classer: (date: Date) => number,
): PaquetAmplitude[] {
  const variations = variationsQuotidiennes(serie.valeurs);
  // `variationsQuotidiennes` renvoie n−1 valeurs : la variation d'indice i
  // s'est produite en arrivant sur `dates[i + 1]`.
  const groupes = new Map<number, number[]>(cles.map((c) => [c, []]));
  for (let i = 0; i < variations.length; i++) {
    const date = serie.dates[i + 1];
    if (!date) continue;
    const groupe = groupes.get(classer(utc(date)));
    if (groupe) groupe.push(Math.abs(variations[i]) * 100);
  }

  const toutes = variations.map((v) => Math.abs(v) * 100);
  const reference = percentile(toutes, 50);

  return cles.map((cle) => {
    const valeurs = groupes.get(cle) ?? [];
    const medianePct = valeurs.length ? percentile(valeurs, 50) : 0;
    // `reference === 0` (devise arrimée, aucune variation) donne ratio = 0 comme
    // sentinelle d'absence de référence, pas comme mesure de calme : `distinct`
    // doit l'exclure, sinon un paquet sans mouvement se lit « ∞ fois plus calme ».
    const ratio = reference > 0 ? medianePct / reference : 0;
    return {
      cle,
      n: valeurs.length,
      medianePct,
      ratio,
      distinct:
        valeurs.length >= OBSERVATIONS_MINIMALES_PAQUET &&
        ratio > 0 &&
        (ratio >= RATIO_HAUT || ratio <= RATIO_BAS),
    };
  });
}

/**
 * De combien cette paire bouge selon la semaine du mois.
 *
 * Répond à « si j'ai le choix, quelle semaine est la plus calme », jamais à
 * « quelle semaine donne un meilleur taux ». Une semaine agitée est risquée
 * dans les deux sens : c'est précisément ce qui rend la mesure publiable.
 */
export function amplitudeParSemaineDuMois(serie: SerieTaux): PaquetAmplitude[] {
  return paquets(serie, [1, 2, 3, 4, 5], (d) =>
    Math.min(5, Math.floor((d.getUTCDate() - 1) / 7) + 1),
  );
}

/** Idem par jour de semaine, du lundi (1) au vendredi (5). */
export function amplitudeParJourDeSemaine(serie: SerieTaux): PaquetAmplitude[] {
  return paquets(serie, [1, 2, 3, 4, 5], (d) => d.getUTCDay());
}

/**
 * Amplitude attendue sur une durée quelconque, mise à l'échelle depuis la
 * fenêtre mesurée.
 *
 * La volatilité croît en racine du temps : quatre fois plus de jours, deux
 * fois plus d'amplitude. L'approximation suppose des variations indépendantes,
 * ce qui est faux dans le détail mais reste l'ordre de grandeur standard —
 * et c'est un ordre de grandeur qu'on affiche, pas une borne.
 */
export function amplitudePourDuree(
  stats: StatsVolatilite,
  jours: number,
): number {
  if (!stats.suffisant || stats.fenetreJours <= 0 || jours <= 0) return 0;
  return stats.amplitudeP80Pct * Math.sqrt(jours / stats.fenetreJours);
}

export interface Exposition {
  /** Jours civils entre le départ et la date d'exécution réelle. */
  jours: number;
  /** Jours de dérive subis parce que la date tombait un jour sans virement. */
  decalageJours: number;
  dateEffective: string;
  amplitudePct: number;
  /** Ce que ces jours d'attente mettent en jeu, en devise de base. */
  montant: number;
  suffisant: boolean;
}

/**
 * Ce que coûte le fait d'attendre jusqu'à une date, plutôt que de payer au
 * départ. Une exposition, pas une prévision : on chiffre l'incertitude que
 * l'utilisateur achète, sans rien dire de son issue.
 */
export function expositionEntre(
  depart: string,
  arrivee: string,
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
): Exposition {
  const { date: dateEffective, decalageJours } = prochaineSeance(arrivee);
  const jours = Math.max(
    0,
    Math.round((utc(dateEffective).getTime() - utc(depart).getTime()) / JOUR_MS),
  );
  const amplitudePct = amplitudePourDuree(stats, jours);
  const montant =
    amplitudePct > 0 && taux > 0
      ? coutAuMouvement(montantCible, taux, -amplitudePct) -
        coutAuTauxDuJour(montantCible, taux)
      : 0;

  return {
    jours,
    decalageJours,
    dateEffective,
    amplitudePct,
    montant: Math.max(0, montant),
    suffisant: stats.suffisant && jours > 0,
  };
}
