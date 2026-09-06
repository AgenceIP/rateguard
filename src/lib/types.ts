/**
 * Modèle de domaine — paie internationale.
 *
 * CONVENTION DE TAUX, valable dans tout le code : un taux est toujours exprimé
 * « combien d'unités de la devise du bénéficiaire s'achètent avec 1 unité de la
 * devise de base ». CAD→USD = 0,74 veut dire qu'un dollar canadien achète
 * 0,74 dollar américain.
 *
 * Il en découle la convention de signe, qui compte parce que l'utilisateur
 * PAIE dans la devise étrangère :
 *
 *   taux qui MONTE  → la devise de base achète plus → le paiement coûte MOINS
 *   taux qui BAISSE → la devise de base achète moins → le paiement coûte PLUS
 *
 * Donc un mouvement DÉFAVORABLE est une BAISSE du taux. Toute fonction qui
 * parle de « défavorable » applique cette définition, jamais l'inverse.
 */

/** Rythme de paiement. Sert à choisir la fenêtre d'observation historique. */
export type Frequence =
  | "hebdomadaire"
  | "bihebdomadaire"
  | "mensuelle"
  | "trimestrielle"
  | "ponctuelle";

/** Nombre de jours civils entre deux paiements, par fréquence. */
export const JOURS_PAR_FREQUENCE: Record<Frequence, number> = {
  hebdomadaire: 7,
  bihebdomadaire: 14,
  mensuelle: 30,
  trimestrielle: 91,
  // Un paiement unique n'a pas de cycle : on prend un mois comme horizon
  // d'observation par défaut, l'utilisateur voit la fenêtre affichée.
  ponctuelle: 30,
};

export type TypeBeneficiaire = "employe" | "contractant";

export interface Beneficiaire {
  id: string;
  nom: string;
  /** ISO 3166-1 alpha-2, majuscules. Clé de la fiche réglementaire crypto. */
  pays: string;
  /** ISO 4217, majuscules. Devise dans laquelle cette personne est payée. */
  devise: string;
  /** Montant dû, exprimé dans `devise` — pas dans la devise de base. */
  montant: number;
  frequence: Frequence;
  type: TypeBeneficiaire;
  /** Date ISO du prochain versement. */
  prochainPaiement: string;
}

/**
 * Hypothèses de frais.
 *
 * Ce sont des ESTIMATIONS par défaut, pas des devis. L'utilisateur peut toutes
 * les remplacer par les chiffres de son propre fournisseur ; `personnalise`
 * bascule alors à true et l'interface change d'étiquette, parce qu'un chiffre
 * fourni par l'utilisateur et un chiffre par défaut ne méritent pas la même
 * confiance à l'écran.
 */
export interface Hypotheses {
  /** Frais fixes d'un virement bancaire sortant, en devise de base. */
  virementFixe: number;
  /** Prélèvement d'une banque correspondante sur le trajet. */
  virementIntermediaire: number;
  /** Frais appliqués à l'arrivée, subis par le bénéficiaire. */
  virementReception: number;
  /** Marge que la banque intègre au taux, en %. */
  virementMargePct: number;
  /** Marge d'un spécialiste du transfert (Wise, OFX…), en %. */
  specialisteMargePct: number;
  specialisteFixe: number;
  /** Surcoût d'un taux figé à l'avance, en % du montant. */
  forwardPrimePct: number;
  /** Frais de conversion d'un compte multi-devises, en %. */
  multiDeviseMargePct: number;
  /** Abonnement mensuel d'un compte multi-devises, en devise de base. */
  multiDeviseMensuel: number;
  personnalise: boolean;
}

export interface Profil {
  /** ISO 4217. Devise dans laquelle l'entreprise tient ses comptes. */
  deviseBase: string;
  beneficiaires: Beneficiaire[];
  hypotheses: Hypotheses;
}

/** Une série de taux de clôture, alignée : `dates[i]` ↔ `valeurs[i]`. */
export interface SerieTaux {
  de: string;
  vers: string;
  dates: string[];
  valeurs: number[];
}

/**
 * Statistiques mesurées sur l'historique. Aucune de ces valeurs n'est une
 * prévision : ce sont des descriptions de ce qui s'est produit.
 */
export interface StatsVolatilite {
  de: string;
  vers: string;
  /** Nombre de variations quotidiennes exploitées. */
  observations: number;
  debut: string;
  fin: string;
  /** Écart-type des variations quotidiennes, en %. */
  quotidiennePct: number;
  /** Idem, annualisé (× √252), en %. Le chiffre que citent les financiers. */
  annualiseePct: number;
  /** Longueur de la fenêtre d'observation, en jours civils. */
  fenetreJours: number;
  /** Fenêtres glissantes réellement mesurées à cette longueur. */
  fenetresObservees: number;
  /** Amplitude absolue de mouvement sur la fenêtre : médiane, P80, P95, en %. */
  amplitudeMedianePct: number;
  amplitudeP80Pct: number;
  amplitudeP95Pct: number;
  /** Pire mouvement défavorable observé sur une fenêtre (valeur positive). */
  pireDefavorablePct: number;
  /** Meilleur mouvement favorable observé (valeur positive). */
  meilleurFavorablePct: number;
  /**
   * false quand l'historique est trop court pour dire quoi que ce soit.
   * L'interface affiche alors « données insuffisantes », jamais un chiffre.
   */
  suffisant: boolean;
}

export type CleStrategie = "spot" | "forward" | "etalement" | "multidevise";

export interface LigneFrais {
  cle:
    | "virement"
    | "intermediaire"
    | "reception"
    | "marge"
    | "prime"
    | "abonnement";
  montant: number;
  /** Texte de la valeur brute (« 2,5 % », « 45 $ ») construit à l'affichage. */
  mode: "pourcentage" | "fixe";
  valeur: number;
}

export interface CoutStrategie {
  cle: CleStrategie;
  /** Coût central en devise de base, au taux du jour. */
  coutCentral: number;
  /** Borne basse de la plage plausible (mouvement favorable P80). */
  coutPlancher: number;
  /** Borne haute (mouvement défavorable P80). */
  coutPlafond: number;
  /** Frais et marges seuls, sans le montant converti. */
  fraisTotal: number;
  lignes: LigneFrais[];
  /** true quand le coût est connu d'avance : la plage est réduite à un point. */
  certain: boolean;
  /** Largeur de la plage. Zéro = aucune incertitude de change. */
  incertitude: number;
  /** Nombre de transferts. > 1 pour l'étalement. */
  nombreTransferts: number;
}

export type StatutCrypto =
  | "fiat_obligatoire"
  | "permis_sous_conditions"
  | "cours_legal"
  | "interdit"
  | "non_verifie";

export interface FicheCrypto {
  pays: string;
  statut: StatutCrypto;
  /** Une phrase, en langage simple. */
  resume: string;
  risques: string[];
  sources: { titre: string; url: string }[];
  /** Date ISO de la dernière vérification humaine de cette fiche. */
  verifieLe: string;
}

/**
 * Canal réellement emprunté par un paiement passé. `autre` existe parce que
 * l'utilisateur a pu passer par un chemin que le comparateur ne modélise pas,
 * et qu'une liste fermée le pousserait à mentir pour pouvoir enregistrer.
 */
export type CanalPaiement = CleStrategie | "autre";

/**
 * Un paiement déjà exécuté, saisi à la main depuis un relevé bancaire.
 *
 * On ne demande que ce qui se lit sur un relevé. Les deux champs nullables
 * ne sont pas des options de confort : `montantRecu` débloque le coût TOUT
 * COMPRIS (il capture les prélèvements des banques correspondantes, invisibles
 * autrement), `dateReference` débloque le coût de l'attente. L'interface doit
 * dire ce que chacun débloque, pas se contenter de les marquer « optionnel ».
 */
export interface PaiementPasse {
  id: string;
  /** Fiche rattachée, ou null : le journal survit à la suppression d'une fiche. */
  beneficiaireId: string | null;
  /** Toujours stocké en clair pour que la ligne reste lisible sans la fiche. */
  beneficiaireNom: string;
  /** Date ISO d'exécution — le jour où l'argent est parti. */
  date: string;
  /** ISO 4217 de la devise de base au moment du paiement. */
  deviseBase: string;
  /** Ce qui a été débité, en devise de base. */
  montantEnvoye: number;
  /** ISO 4217 de la devise cible. */
  devise: string;
  /** Ce qu'on voulait faire parvenir, en devise cible. */
  montantVoulu: number;
  /** Ce qui est réellement arrivé, en devise cible. null si non confirmé. */
  montantRecu: number | null;
  /** Ligne de frais visible au relevé, en devise de base. Appoint pédagogique. */
  fraisAffiches: number | null;
  canal: CanalPaiement;
  /** Date ISO où le montant était connu (facture, début de période). */
  dateReference: string | null;
  note: string;
}
