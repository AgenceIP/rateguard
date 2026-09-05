// Types centraux de RateGuard.
// Convention de signe utilisée PARTOUT dans le code : un `mouvementPct` positif
// signifie que le CAD achète PLUS de devise cible — donc favorable à l'agence.

export type Devise = "CAD" | "SAR" | "USD";
export type DeviseCible = Exclude<Devise, "CAD">;

/** Provenance du taux capturé — affichée telle quelle dans le reçu de verrouillage. */
export interface SourceTaux {
  fournisseur: string;
  /** "CAD/SAR" ou "CAD/USD" */
  paire: string;
  /** Date de publication du taux par la BCE (ISO yyyy-mm-dd) — distincte du moment du fetch. */
  dateTaux: string;
  /** Moment exact du clic « verrouiller » (ms epoch). */
  horodatageRecuperation: number;
  /**
   * true quand le taux CAD->SAR a été obtenu via CAD->USD puis le peg saoudien.
   * La BCE ne publie pas le SAR ; le riyal est arrimé au dollar américain
   * à 3,75 SAR = 1 USD depuis 1986.
   */
  viaPegUsd: boolean;
}

export interface LignePaiement {
  id: string;
  /** Part du montantTotalCAD, de 0 à 100. Source de vérité saisie par l'utilisateur. */
  pourcentage: number;
  /** Montant dû exprimé en `devise`, figé au taux verrouillé au moment de la création. */
  montant: number;
  devise: DeviseCible;
  /** ISO yyyy-mm-dd */
  dateEstimee: string;
  description: string;
}

export interface Forfait {
  id: string;
  nom: string;
  nombrePelerins: number;
  montantTotalCAD: number;
  deviseCible: DeviseCible;
  echeancier: LignePaiement[];
  /** Marge connue de l'agence, en pourcentage du montant total (0 à 100). */
  margeConnue: number;
  /** Moment du verrouillage de taux (ms epoch). */
  dateCreation: number;
  /** 1 CAD = tauxVerrouille unités de deviseCible. */
  tauxVerrouille: number;
  sourceTaux: SourceTaux;
}

// --- Sorties des fonctions de calcul pures -------------------------------

export interface LigneFrais {
  cle: "transfert" | "intermediaire" | "reception" | "spread";
  montantCAD: number;
  mode: "pourcentage" | "fixe";
  /** 2.5 pour 2,5 %, ou 45 pour 45 $. */
  valeur: number;
}

export interface CoutReel {
  montantCAD: number;
  tauxMidMarket: number;
  /** Ce que le montant vaudrait sans aucun frais. */
  montantCibleAuMid: number;
  /** Ce qui arrive réellement chez le fournisseur, après spread et frais fixes. */
  montantCibleRecu: number;
  frais: LigneFrais[];
  totalFraisCAD: number;
  /** Devise réellement reçue ÷ CAD réellement sortis. */
  tauxEffectif: number;
}

/** <14 jours | 14 jours à 2 mois | >2 mois */
export type PalierVolatilite = "court" | "moyen" | "long";

export interface Scenario {
  /** Signé, sur le taux CAD->cible. Positif = favorable à l'agence. */
  mouvementPct: number;
  tauxHypothetique: number;
  /** CAD nécessaires pour honorer l'échéancier à ce taux hypothétique. */
  coutCADRequis: number;
  /** Écart vs le coût au taux verrouillé. Positif = l'agence paie moins. */
  ecartCAD: number;
  margeResultanteCAD: number;
  margeResultantePct: number;
  favorable: boolean;
}

export interface SimulationScenarios {
  palier: PalierVolatilite;
  joursAvantPremierPaiement: number;
  /** Amplitudes du palier, ex. [0.5, 1, 2]. */
  amplitudes: number[];
  /** Toujours symétrique : une entrée -x et une entrée +x par amplitude. */
  scenarios: Scenario[];
}

export interface SeuilCritique {
  /** false si la marge est déjà nulle/négative ou s'il n'y a aucune exposition. */
  atteignable: boolean;
  /**
   * Ampleur POSITIVE du mouvement défavorable qui ramène la marge à zéro.
   * 6.2 se lit « un mouvement défavorable de 6,2 % annule la marge ».
   */
  mouvementDefavorablePct: number | null;
  margeCAD: number;
  expositionCAD: number;
}

export interface ComparaisonCanal {
  tauxMidMarket: number;
  /** Marge bancaire benchmark (2 à 3 %) — ESTIMATION publique, jamais un devis. */
  margeBancaireBenchmarkPct: number;
  tauxBancaireEstime: number;
  coutMidMarketCAD: number;
  coutBancaireEstimeCAD: number;
  /** Surcoût estimé du canal bancaire sur ce forfait précis. */
  ecartCAD: number;
}

export type StatutForfait = "vert" | "jaune" | "rouge";

export interface BenchmarkFrais {
  spreadBancairePct: number;
  fraisTransfertFixeCAD: number;
  fraisBanqueIntermediaireCAD: number;
  fraisReceptionCAD: number;
  /** Cité dans l'UI, pas seulement en commentaire. */
  source: string;
  derniereRevision: string;
}
