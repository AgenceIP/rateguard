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

export interface ImpactTaux {
  /** Taux moyen disponible sur la période couverte par les paiements. */
  tauxMoyen: number;
  /**
   * Ce que la répartition des paiements dans le temps a coûté par rapport à ce
   * taux moyen. Positif = elle a coûté ; négatif = elle a servi.
   *
   * C'est une DESCRIPTION du passé. Elle ne dit pas quand il aurait fallu
   * payer, et l'interface ne doit jamais la retourner en conseil de calendrier.
   */
  montant: number;
  n: number;
}

export function impactDuTaux(
  paiements: PaiementPasse[],
  serie: SerieTaux,
): ImpactTaux {
  const retenus = paiements
    .map((p) => ({ p, taux: tauxAuPlusProche(serie, p.date) }))
    .filter((x): x is { p: PaiementPasse; taux: number } => (x.taux ?? 0) > 0);

  if (retenus.length === 0) return { tauxMoyen: 0, montant: 0, n: 0 };

  // Moyenne de TOUS les cours de la série reçue — pas seulement des jours de
  // paiement, et pas non plus de l'intervalle entre le premier et le dernier.
  //
  // Restreindre la fenêtre aux dates des paiements fait s'effondrer la mesure :
  // sur des paiements rapprochés la moyenne se confond avec les taux payés, et
  // par convexité de 1/r le résultat devient positif quoi qu'il arrive — un
  // artefact arithmétique présenté comme une observation. C'est l'appelant qui
  // découpe la période de reporting avant d'appeler.
  const tauxMoyen =
    serie.valeurs.length > 0
      ? serie.valeurs.reduce((a, b) => a + b, 0) / serie.valeurs.length
      : retenus.reduce((a, x) => a + x.taux, 0) / retenus.length;

  const reel = retenus.reduce((a, x) => a + x.p.montantVoulu / x.taux, 0);
  const auMoyen =
    tauxMoyen > 0
      ? retenus.reduce((a, x) => a + x.p.montantVoulu, 0) / tauxMoyen
      : reel;

  return { tauxMoyen, montant: reel - auMoyen, n: retenus.length };
}

export interface CoutAttente {
  jours: number;
  tauxReference: number;
  tauxExecution: number;
  /** Positif = attendre a coûté ; négatif = attendre a servi. */
  montant: number;
}

/**
 * Ce que l'attente a réellement coûté, entre le jour où le montant était connu
 * et le jour où il est parti.
 *
 * C'est le pendant vérifiable de la promesse faite à l'écran de détail
 * (« attendre met 167 $ en jeu ») : ici on ne l'estime plus, on le constate.
 */
export function coutDeLAttente(
  p: PaiementPasse,
  serie: SerieTaux,
): CoutAttente | null {
  if (!p.dateReference) return null;
  const tauxReference = tauxAuPlusProche(serie, p.dateReference);
  const tauxExecution = tauxAuPlusProche(serie, p.date);
  if (!tauxReference || !tauxExecution) return null;

  const jours = Math.round(
    (new Date(`${p.date}T00:00:00Z`).getTime() -
      new Date(`${p.dateReference}T00:00:00Z`).getTime()) /
      86_400_000,
  );

  return {
    jours,
    tauxReference,
    tauxExecution,
    montant: p.montantVoulu / tauxExecution - p.montantVoulu / tauxReference,
  };
}

export interface LigneDevise {
  devise: string;
  n: number;
  /** Volume débité, en devise de base. */
  volume: number;
  frais: number;
  fraisPct: number;
  impactTaux: number;
  /** false dès qu'un paiement de cette devise n'a pas son montant reçu. */
  complet: boolean;
}

export interface ResumePortefeuille {
  n: number;
  volume: number;
  frais: number;
  fraisPct: number;
  impactTaux: number;
  devises: LigneDevise[];
  /** Paiements écartés faute de série pour leur devise. Affiché, jamais masqué. */
  ignores: number;
}

/**
 * La vue de trésorerie : combien est parti, combien la chaîne a prélevé, et
 * ce que le calendrier des versements a coûté — les trois séparés, parce
 * qu'ils ne se pilotent pas de la même façon.
 */
export function resumerPortefeuille(
  paiements: PaiementPasse[],
  series: Record<string, SerieTaux>,
): ResumePortefeuille {
  const parDevise = new Map<string, PaiementPasse[]>();
  let ignores = 0;

  for (const p of paiements) {
    if (!series[p.devise]) {
      ignores++;
      continue;
    }
    const liste = parDevise.get(p.devise) ?? [];
    liste.push(p);
    parDevise.set(p.devise, liste);
  }

  const devises: LigneDevise[] = [];
  for (const [devise, liste] of parDevise) {
    const serie = series[devise];
    let volume = 0;
    let frais = 0;
    let complet = true;
    let n = 0;

    for (const p of liste) {
      const taux = tauxAuPlusProche(serie, p.date);
      if (!taux) {
        ignores++;
        continue;
      }
      const c = coutReel(p, taux);
      volume += p.montantEnvoye;
      frais += c.ecart;
      complet &&= c.complet;
      n++;
    }

    if (n === 0) continue;
    devises.push({
      devise,
      n,
      volume,
      frais,
      fraisPct: volume > 0 ? (frais / volume) * 100 : 0,
      impactTaux: impactDuTaux(liste, serie).montant,
      complet,
    });
  }

  devises.sort((a, b) => b.volume - a.volume);

  const volume = devises.reduce((a, d) => a + d.volume, 0);
  const frais = devises.reduce((a, d) => a + d.frais, 0);

  return {
    n: devises.reduce((a, d) => a + d.n, 0),
    volume,
    frais,
    fraisPct: volume > 0 ? (frais / volume) * 100 : 0,
    impactTaux: devises.reduce((a, d) => a + d.impactTaux, 0),
    devises,
    ignores,
  };
}
