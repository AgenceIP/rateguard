import type { Hypotheses } from "./types";

/**
 * HYPOTHÈSES PAR DÉFAUT — DES ESTIMATIONS, PAS DES DEVIS.
 *
 * Aucune de ces valeurs ne provient d'une banque en particulier ni d'une
 * cotation en direct. Ce sont des ordres de grandeur publiquement observés
 * pour une PME qui envoie des paiements internationaux depuis le Canada.
 *
 * Elles existent pour qu'un utilisateur qui ne connaît pas encore ses propres
 * chiffres voie quand même la forme du problème. Dès qu'il saisit les siens,
 * `personnalise` passe à true, l'incertitude tombe à zéro et l'interface
 * cesse d'afficher des plages — parce qu'un chiffre qu'il a lu sur son relevé
 * et un chiffre que nous avons supposé ne valent pas la même chose.
 */
export const HYPOTHESES_DEFAUT: Hypotheses = {
  // Virement international sortant, forfait d'une grande banque canadienne.
  // Fourchette publiquement observée : 30 $ à 80 $.
  virementFixe: 45,
  // Prélèvement d'une banque correspondante sur le trajet SWIFT. Invisible à
  // l'envoi : en instruction SHA, il sort du montant en transit.
  virementIntermediaire: 25,
  // Frais de la banque du bénéficiaire à l'arrivée. Subi par le bénéficiaire.
  virementReception: 20,
  // Marge intégrée au taux par une banque de détail. Observé : 2 % à 3 %.
  virementMargePct: 2.5,
  // Spécialiste du transfert (Wise, OFX, Remitly Business…) sur une paire
  // majeure. Observé : 0,4 % à 0,8 %.
  specialisteMargePct: 0.55,
  specialisteFixe: 4,
  // Surcoût d'un taux figé à l'avance chez un courtier, pour une PME sans
  // ligne de crédit négociée. Observé : 0,5 % à 2 %, parfois avec dépôt de
  // garantie que ce modèle ne chiffre pas.
  forwardPrimePct: 1,
  // Conversion dans un compte multi-devises.
  multiDeviseMargePct: 0.5,
  // Abonnement mensuel. Beaucoup d'offres PME sont à 0 $ avec des frais
  // d'ouverture ponctuels ; laissé à 0 et à la charge de l'utilisateur.
  multiDeviseMensuel: 0,
  personnalise: false,
};

/**
 * Largeur de la plage affichée tant que l'utilisateur n'a pas saisi ses vrais
 * chiffres. ±35 % autour de l'estimation, ce qui couvre à peu près l'écart
 * entre une banque de détail chère et une banque avec relation négociée.
 *
 * Le défi le dit explicitement : « intermediary-bank fees may not be known
 * until after the transfer ». Afficher « 162,75 $ » sur une donnée dont on
 * sait qu'elle n'est pas connaissable serait une fausse précision ; afficher
 * « entre 106 $ et 220 $ » est ce qu'on sait réellement.
 */
export const INCERTITUDE_FRAIS = 0.35;

/**
 * Marge à retenir selon le canal. Regroupé ici pour que le comparateur de
 * stratégies n'ait pas à connaître le détail des noms de champs.
 */
export function margeDuCanal(
  h: Hypotheses,
  canal: "banque" | "specialiste" | "multidevise",
): number {
  if (canal === "banque") return h.virementMargePct;
  if (canal === "specialiste") return h.specialisteMargePct;
  return h.multiDeviseMargePct;
}

/**
 * Nombre de versements pour la stratégie d'étalement, selon le rythme.
 *
 * Trois est un compromis : assez pour que la moyenne lisse quelque chose,
 * assez peu pour que les frais fixes ne mangent pas le bénéfice. L'utilisateur
 * voit le nombre et son coût, il peut juger.
 */
export const TRANSFERTS_ETALEMENT = 3;

/** Instructions de frais SWIFT. Le champ 71A d'un virement. */
export const INSTRUCTIONS_FRAIS = ["SHA", "OUR", "BEN"] as const;
export type InstructionFrais = (typeof INSTRUCTIONS_FRAIS)[number];
