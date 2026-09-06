import type { PaiementPasse, SerieTaux } from "./types";

/**
 * Le journal — ce que les transferts ont RÉELLEMENT coûté.
 *
 * Tout ce module regarde en arrière. Il ne produit aucune recommandation de
 * date : il mesure ce qui s'est passé, pour que l'utilisateur puisse comparer
 * ses fournisseurs, vérifier ce que l'attente lui a coûté, et calibrer l'outil
 * sur ses propres chiffres au lieu d'ordres de grandeur publics.
 */

/**
 * Le taux de référence en vigueur à une date, c'est-à-dire le dernier cours
 * publié à cette date ou avant.
 *
 * On recule, on n'interpole pas : un paiement du samedi s'est exécuté au
 * cours du vendredi, et inventer une valeur intermédiaire fabriquerait un
 * chiffre qui n'a jamais existé.
 */
export function tauxAuPlusProche(
  serie: SerieTaux,
  dateIso: string,
): number | null {
  for (let i = serie.dates.length - 1; i >= 0; i--) {
    if (serie.dates[i] <= dateIso) return serie.valeurs[i] ?? null;
  }
  return null;
}

export interface CoutReel {
  /** Ce que la chaîne a prélevé, en devise de base. Négatif = mieux que la référence. */
  ecart: number;
  /** Le même écart en % du montant débité. */
  ecartPct: number;
  tauxReference: number;
  /**
   * false quand `montantRecu` manquait : l'écart ne compte alors pas les
   * prélèvements du trajet, donc le coût réel est AU MOINS celui affiché.
   * L'interface doit le dire, pas l'arrondir en silence.
   */
  complet: boolean;
}

/**
 * L'écart entre ce qui est sorti du compte et ce qui est arrivé, au taux de
 * référence du jour.
 *
 * Une seule soustraction capture d'un coup la marge cachée dans le taux, les
 * frais fixes et les prélèvements des banques correspondantes. C'est ce qui
 * évite de demander à l'utilisateur une ventilation qu'il ne possède pas.
 */
export function coutReel(p: PaiementPasse, tauxReference: number): CoutReel {
  const recu = p.montantRecu ?? p.montantVoulu;
  if (tauxReference <= 0 || p.montantEnvoye <= 0) {
    return { ecart: 0, ecartPct: 0, tauxReference, complet: p.montantRecu !== null };
  }
  const ecart = p.montantEnvoye - recu / tauxReference;
  return {
    ecart,
    ecartPct: (ecart / p.montantEnvoye) * 100,
    tauxReference,
    complet: p.montantRecu !== null,
  };
}
