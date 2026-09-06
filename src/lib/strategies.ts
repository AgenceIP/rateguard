import { INCERTITUDE_FRAIS, TRANSFERTS_ETALEMENT } from "./hypotheses";
import type {
  CleStrategie,
  CoutStrategie,
  Hypotheses,
  LigneFrais,
  StatsVolatilite,
} from "./types";
import { coutAuMouvement, coutAuTauxDuJour } from "./volatilite";

/**
 * Comparateur de stratégies de paiement.
 *
 * Chaque stratégie est chiffrée en devise de base, frais compris, et sort
 * avec une PLAGE plutôt qu'un chiffre unique. La plage a deux origines qu'il
 * ne faut pas confondre :
 *
 *   1. le taux peut bouger d'ici le paiement — mesuré sur l'historique réel ;
 *   2. les frais ne sont pas connus tant que l'utilisateur n'a pas saisi les
 *      siens — d'où `INCERTITUDE_FRAIS` sur les hypothèses par défaut.
 *
 * Aucune stratégie n'est présentée comme « la bonne ». Le forward supprime
 * l'incertitude 1 et coûte plus cher ; c'est un arbitrage, pas une réponse,
 * et il appartient à l'utilisateur.
 */

/** Coût de conversion à un taux donné, marge du canal appliquée. */
function convertir(
  montantCible: number,
  taux: number,
  margePct: number,
): number {
  const effectif = taux * (1 - margePct / 100);
  return effectif > 0 ? montantCible / effectif : 0;
}

/** Bande d'incertitude sur les frais : nulle dès que l'utilisateur a saisi les siens. */
function bandeFrais(h: Hypotheses): number {
  return h.personnalise ? 0 : INCERTITUDE_FRAIS;
}

function ligne(
  cle: LigneFrais["cle"],
  montant: number,
  mode: LigneFrais["mode"],
  valeur: number,
): LigneFrais {
  return { cle, montant, mode, valeur };
}

/**
 * Amplitude de mouvement retenue pour construire la plage.
 * Zéro quand l'historique est insuffisant : on préfère une plage plate,
 * accompagnée à l'écran d'un « données insuffisantes », à une plage inventée.
 */
function amplitude(stats: StatsVolatilite): number {
  return stats.suffisant ? stats.amplitudeP80Pct : 0;
}

/** Virement bancaire au taux du jour. Le comportement par défaut. */
export function strategieSpot(
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
  h: Hypotheses,
): CoutStrategie {
  const amp = amplitude(stats);
  const bande = bandeFrais(h);
  const fraisFixes =
    h.virementFixe + h.virementIntermediaire + h.virementReception;

  const central = convertir(montantCible, taux, h.virementMargePct) + fraisFixes;
  const tauxHaut = taux * (1 + amp / 100);
  const tauxBas = taux * (1 - amp / 100);

  const coutMarge =
    convertir(montantCible, taux, h.virementMargePct) -
    coutAuTauxDuJour(montantCible, taux);

  return {
    cle: "spot",
    coutCentral: central,
    coutPlancher:
      convertir(montantCible, tauxHaut, h.virementMargePct) +
      fraisFixes * (1 - bande),
    coutPlafond:
      convertir(montantCible, tauxBas, h.virementMargePct) +
      fraisFixes * (1 + bande),
    fraisTotal: fraisFixes + coutMarge,
    lignes: [
      ligne("virement", h.virementFixe, "fixe", h.virementFixe),
      ligne(
        "intermediaire",
        h.virementIntermediaire,
        "fixe",
        h.virementIntermediaire,
      ),
      ligne("reception", h.virementReception, "fixe", h.virementReception),
      ligne("marge", coutMarge, "pourcentage", h.virementMargePct),
    ],
    certain: false,
    incertitude: 0,
    nombreTransferts: 1,
  };
}

/**
 * Taux figé à l'avance.
 *
 * C'est la seule stratégie dont le coût est connu aujourd'hui : la plage se
 * réduit à un point. C'est précisément ce qu'on achète, et ce que coûte la
 * prime. Le modèle ne chiffre pas l'éventuel dépôt de garantie exigé par le
 * courtier — l'interface le dit.
 */
export function strategieForward(
  montantCible: number,
  taux: number,
  h: Hypotheses,
): CoutStrategie {
  const fraisFixes = h.virementFixe + h.virementIntermediaire;
  const margeTotale = h.virementMargePct + h.forwardPrimePct;
  const central = convertir(montantCible, taux, margeTotale) + fraisFixes;

  const coutMarge =
    convertir(montantCible, taux, h.virementMargePct) -
    coutAuTauxDuJour(montantCible, taux);
  const coutPrime = central - fraisFixes - coutMarge - coutAuTauxDuJour(montantCible, taux);

  return {
    cle: "forward",
    coutCentral: central,
    coutPlancher: central,
    coutPlafond: central,
    fraisTotal: fraisFixes + coutMarge + coutPrime,
    lignes: [
      ligne("virement", h.virementFixe, "fixe", h.virementFixe),
      ligne(
        "intermediaire",
        h.virementIntermediaire,
        "fixe",
        h.virementIntermediaire,
      ),
      ligne("marge", coutMarge, "pourcentage", h.virementMargePct),
      ligne("prime", coutPrime, "pourcentage", h.forwardPrimePct),
    ],
    certain: true,
    incertitude: 0,
    nombreTransferts: 1,
  };
}

/**
 * Étaler le paiement sur plusieurs transferts.
 *
 * Le lissage : la moyenne de k tirages a un écart-type divisé par √k. C'est le
 * résultat classique pour des tirages indépendants ; ici les taux successifs
 * sont corrélés, donc √k SURESTIME un peu le bénéfice réel.
 *
 * ponytail: réduction en 1/√k, borne optimiste ; passer à la variance exacte
 * d'une moyenne de marche aléatoire si le chiffre devient décisionnel.
 *
 * En face, les frais fixes sont payés k fois — et sur un petit montant ils
 * dominent tout le reste. L'étalement peut donc parfaitement coûter plus cher
 * qu'il ne rassure, et le comparateur le montre sans commentaire.
 */
export function strategieEtalement(
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
  h: Hypotheses,
  transferts: number = TRANSFERTS_ETALEMENT,
): CoutStrategie {
  const k = Math.max(1, Math.round(transferts));
  const bande = bandeFrais(h);
  const fraisFixes =
    (h.virementFixe + h.virementIntermediaire + h.virementReception) * k;

  const central = convertir(montantCible, taux, h.virementMargePct) + fraisFixes;
  const ampReduite = amplitude(stats) / Math.sqrt(k);
  const tauxHaut = taux * (1 + ampReduite / 100);
  const tauxBas = taux * (1 - ampReduite / 100);

  const coutMarge =
    convertir(montantCible, taux, h.virementMargePct) -
    coutAuTauxDuJour(montantCible, taux);

  return {
    cle: "etalement",
    coutCentral: central,
    coutPlancher:
      convertir(montantCible, tauxHaut, h.virementMargePct) +
      fraisFixes * (1 - bande),
    coutPlafond:
      convertir(montantCible, tauxBas, h.virementMargePct) +
      fraisFixes * (1 + bande),
    fraisTotal: fraisFixes + coutMarge,
    lignes: [
      ligne("virement", h.virementFixe * k, "fixe", h.virementFixe),
      ligne(
        "intermediaire",
        h.virementIntermediaire * k,
        "fixe",
        h.virementIntermediaire,
      ),
      ligne("reception", h.virementReception * k, "fixe", h.virementReception),
      ligne("marge", coutMarge, "pourcentage", h.virementMargePct),
    ],
    certain: false,
    incertitude: 0,
    nombreTransferts: k,
  };
}

/**
 * Compte multi-devises : une conversion, puis des versements locaux.
 *
 * Les frais de correspondant et de réception disparaissent parce que le
 * versement final est domestique dans le pays du bénéficiaire. La marge de
 * conversion est plus basse qu'en banque. En revanche le risque de change est
 * INCHANGÉ tant que le compte n'est pas préfinancé : détenir la devise à
 * l'avance supprime le risque mais immobilise de la trésorerie, arbitrage que
 * ce modèle ne tranche pas.
 */
export function strategieMultiDevise(
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
  h: Hypotheses,
  paiementsParMois: number = 1,
): CoutStrategie {
  const amp = amplitude(stats);
  const bande = bandeFrais(h);
  const abonnement =
    paiementsParMois > 0 ? h.multiDeviseMensuel / paiementsParMois : 0;
  const fraisFixes = abonnement;

  const central =
    convertir(montantCible, taux, h.multiDeviseMargePct) + fraisFixes;
  const tauxHaut = taux * (1 + amp / 100);
  const tauxBas = taux * (1 - amp / 100);

  const coutMarge =
    convertir(montantCible, taux, h.multiDeviseMargePct) -
    coutAuTauxDuJour(montantCible, taux);

  return {
    cle: "multidevise",
    coutCentral: central,
    coutPlancher:
      convertir(montantCible, tauxHaut, h.multiDeviseMargePct) +
      fraisFixes * (1 - bande),
    coutPlafond:
      convertir(montantCible, tauxBas, h.multiDeviseMargePct) +
      fraisFixes * (1 + bande),
    fraisTotal: fraisFixes + coutMarge,
    lignes: [
      ligne("abonnement", abonnement, "fixe", h.multiDeviseMensuel),
      ligne("marge", coutMarge, "pourcentage", h.multiDeviseMargePct),
    ],
    certain: false,
    incertitude: 0,
    nombreTransferts: 1,
  };
}

/**
 * Les quatre stratégies, dans un ordre fixe.
 *
 * L'ordre est délibérément celui du raisonnement — ce que tu fais aujourd'hui,
 * puis les alternatives — et jamais un classement par coût : trier par prix
 * transformerait un comparateur en recommandation.
 */
export function comparerStrategies(
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
  h: Hypotheses,
  paiementsParMois = 1,
): CoutStrategie[] {
  const strategies = [
    strategieSpot(montantCible, taux, stats, h),
    strategieForward(montantCible, taux, h),
    strategieEtalement(montantCible, taux, stats, h),
    strategieMultiDevise(montantCible, taux, stats, h, paiementsParMois),
  ];
  return strategies.map((s) => ({
    ...s,
    incertitude: s.coutPlafond - s.coutPlancher,
  }));
}

export interface ResumePaiement {
  /** Coût au taux du jour par virement bancaire, frais compris. */
  coutAujourdhui: number;
  /** Ce que le paiement coûterait en plus après un mouvement défavorable P80. */
  risque: number;
  /** Surcoût du taux figé par rapport au virement au taux du jour. */
  prixDeLaCertitude: number;
  /** Stratégie la moins chère au taux du jour. Un constat, pas un conseil. */
  moinsChere: CleStrategie;
  /** Économie de la moins chère face au virement bancaire. */
  economie: number;
  /** false quand l'historique ne permet pas de chiffrer le risque. */
  suffisant: boolean;
}

/**
 * Les quatre nombres nécessaires à la phrase de résumé.
 *
 * Le calcul vit ici, la formulation vit dans `src/i18n` : la même arithmétique
 * doit produire la même phrase en français et en anglais.
 */
export function resumerPaiement(
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
  h: Hypotheses,
  paiementsParMois = 1,
): ResumePaiement {
  const strategies = comparerStrategies(
    montantCible,
    taux,
    stats,
    h,
    paiementsParMois,
  );
  const spot = strategies.find((s) => s.cle === "spot")!;
  const forward = strategies.find((s) => s.cle === "forward")!;

  const coutDefavorable =
    coutAuMouvement(montantCible, taux, -amplitude(stats)) /
      (1 - h.virementMargePct / 100) +
    (h.virementFixe + h.virementIntermediaire + h.virementReception);

  const moinsChere = strategies.reduce((a, b) =>
    b.coutCentral < a.coutCentral ? b : a,
  );

  return {
    coutAujourdhui: spot.coutCentral,
    risque: Math.max(0, coutDefavorable - spot.coutCentral),
    prixDeLaCertitude: forward.coutCentral - spot.coutCentral,
    moinsChere: moinsChere.cle,
    economie: spot.coutCentral - moinsChere.coutCentral,
    suffisant: stats.suffisant,
  };
}
