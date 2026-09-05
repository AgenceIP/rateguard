import type { BenchmarkFrais } from "./types";

/**
 * ESTIMATIONS, PAS DES DEVIS.
 *
 * Ces valeurs sont des benchmarks publics de l'industrie du transfert
 * international pour une PME canadienne. Elles ne proviennent d'aucune banque
 * en particulier et ne constituent pas une offre de prix. Elles sont exposées
 * telles quelles dans l'interface — jamais cachées en petit texte — parce que
 * l'écart réel dépend de la banque, du volume annuel et de la relation client.
 *
 * Toute modification ici change les chiffres affichés à l'écran : garder la
 * source à jour en même temps que la valeur.
 */
export const BENCHMARK_FRAIS: BenchmarkFrais = {
  // Marge intégrée au taux par une banque de détail canadienne sur une paire
  // grand public. Fourchette observée publiquement : 2 % à 3 %.
  spreadBancairePct: 2.5,
  // Frais de virement international sortant, forfait typique d'une grande banque.
  fraisTransfertFixeCAD: 45,
  // Prélèvement d'une banque correspondante sur le trajet SWIFT. Souvent
  // invisible à l'envoi, découvert seulement à la réception.
  fraisBanqueIntermediaireCAD: 25,
  // Frais appliqués par la banque du bénéficiaire à l'arrivée des fonds.
  fraisReceptionCAD: 20,
  source:
    "Benchmarks publics de l'industrie du transfert international pour PME canadiennes",
  derniereRevision: "2026-09-05",
};

/** Peg saoudien : 3,75 SAR = 1 USD, fixe depuis 1986. */
export const PEG_SAR_PAR_USD = 3.75;

/**
 * Bornes des paliers de volatilité, en jours entre le verrouillage et le
 * premier paiement. Approximation simplifiée pour un MVP de hackathon —
 * PAS un modèle de volatilité financière rigoureux. « 2 mois » est arrondi
 * à 60 jours.
 */
export const BORNES_PALIERS = { court: 14, moyen: 60 } as const;

/** Amplitudes de scénario par palier, en pourcentage de mouvement. */
export const AMPLITUDES_PAR_PALIER = {
  court: [0.5, 1, 2],
  moyen: [2, 4, 6],
  long: [3, 5, 8],
} as const;
