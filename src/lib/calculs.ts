/**
 * Fonctions de calcul pures de RateGuard.
 *
 * Aucun import React, aucun accès réseau, aucun accès au localStorage : tout ce
 * qui est ici prend des nombres en entrée et retourne des nombres en sortie.
 * C'est ce qui rend ce fichier testable sans aucun mock — voir calculs.test.ts.
 *
 * Aucun arrondi n'est fait ici. Le formatage d'affichage vit dans format.ts.
 */

import {
  AMPLITUDES_PAR_PALIER,
  BORNES_PALIERS,
  PEG_SAR_PAR_USD,
} from "./benchmarks";
import type {
  BenchmarkFrais,
  ComparaisonCanal,
  CoutReel,
  Forfait,
  LigneFrais,
  PalierVolatilite,
  Scenario,
  SeuilCritique,
  SimulationScenarios,
  StatutForfait,
} from "./types";

const MS_PAR_JOUR = 86_400_000;

/** Convertit un taux CAD vers USD en taux CAD vers SAR via le peg saoudien. */
export function tauxSarDepuisUsd(tauxCadUsd: number): number {
  return tauxCadUsd * PEG_SAR_PAR_USD;
}

/**
 * Montant d'une ligne d'échéancier, exprimé en devise cible.
 * Le pourcentage est la source de vérité ; ce montant est un instantané figé
 * au taux verrouillé au moment de la création du forfait.
 */
export function montantLigneEnDevise(
  pourcentage: number,
  montantTotalCAD: number,
  taux: number,
): number {
  return ((montantTotalCAD * pourcentage) / 100) * taux;
}

/** Somme des versements de l'échéancier, en devise cible. */
export function expositionCible(forfait: Forfait): number {
  return forfait.echeancier.reduce((somme, ligne) => somme + ligne.montant, 0);
}

/**
 * Nombre de jours entre le verrouillage et le paiement le plus proche.
 * Retourne 0 si l'échéancier est vide ou si toutes les dates sont déjà passées :
 * un forfait sans délai n'a plus d'exposition au temps.
 */
export function joursAvantPremierPaiement(forfait: Forfait): number {
  if (forfait.echeancier.length === 0) return 0;
  const delais = forfait.echeancier.map(
    (ligne) =>
      (new Date(ligne.dateEstimee + "T00:00:00Z").getTime() -
        forfait.dateCreation) /
      MS_PAR_JOUR,
  );
  return Math.max(0, Math.floor(Math.min(...delais)));
}

/**
 * Palier de volatilité selon la durée réelle d'exposition.
 * Approximation simplifiée pour un MVP de hackathon, pas un modèle de
 * volatilité financière rigoureux. Les bornes appartiennent au palier
 * inférieur : 14 jours et 60 jours tombent tous deux dans « moyen ».
 */
export function palierVolatilite(jours: number): PalierVolatilite {
  if (jours < BORNES_PALIERS.court) return "court";
  if (jours <= BORNES_PALIERS.moyen) return "moyen";
  return "long";
}

/**
 * Coût réel estimé d'un envoi de montantCAD vers la devise cible.
 *
 * Modèle : les frais fixes sont prélevés sur le montant envoyé, puis le reste
 * est converti à un taux amputé du spread bancaire. Le coût du spread est
 * reconverti en CAD pour que toutes les lignes de frais soient comparables
 * dans la même unité.
 */
export function calculerCoutReel(
  montantCAD: number,
  tauxMidMarket: number,
  benchmark: BenchmarkFrais,
): CoutReel {
  const fraisFixes: LigneFrais[] = [
    {
      cle: "transfert",
      montantCAD: benchmark.fraisTransfertFixeCAD,
      mode: "fixe",
      valeur: benchmark.fraisTransfertFixeCAD,
    },
    {
      cle: "intermediaire",
      montantCAD: benchmark.fraisBanqueIntermediaireCAD,
      mode: "fixe",
      valeur: benchmark.fraisBanqueIntermediaireCAD,
    },
    {
      cle: "reception",
      montantCAD: benchmark.fraisReceptionCAD,
      mode: "fixe",
      valeur: benchmark.fraisReceptionCAD,
    },
  ];

  const totalFixesCAD = fraisFixes.reduce((s, f) => s + f.montantCAD, 0);
  // Un petit montant peut être entièrement absorbé par les frais fixes.
  const montantNetCAD = Math.max(0, montantCAD - totalFixesCAD);
  const tauxApresSpread =
    tauxMidMarket * (1 - benchmark.spreadBancairePct / 100);

  const montantCibleAuMid = montantCAD * tauxMidMarket;
  const montantCibleRecu = montantNetCAD * tauxApresSpread;

  const coutSpreadCAD =
    tauxMidMarket > 0 ? montantNetCAD - montantCibleRecu / tauxMidMarket : 0;

  const frais: LigneFrais[] = [
    ...fraisFixes,
    {
      cle: "spread",
      montantCAD: coutSpreadCAD,
      mode: "pourcentage",
      valeur: benchmark.spreadBancairePct,
    },
  ];

  return {
    montantCAD,
    tauxMidMarket,
    montantCibleAuMid,
    montantCibleRecu,
    frais,
    totalFraisCAD: totalFixesCAD + coutSpreadCAD,
    tauxEffectif: montantCAD > 0 ? montantCibleRecu / montantCAD : 0,
  };
}

/**
 * Scénarios hypothétiques de mouvement du taux.
 *
 * Les amplitudes sont choisies dynamiquement selon la durée réelle entre le
 * verrouillage et le premier paiement — approximation simplifiée pour un MVP
 * de hackathon, pas un modèle de volatilité financière rigoureux.
 *
 * Chaque amplitude produit obligatoirement une paire négative / positive dans
 * la même itération. C'est structurel, pas cosmétique : il devient impossible
 * de générer une seule direction, donc impossible que la sortie ressemble à
 * une prédiction directionnelle.
 */
export function simulerScenarios(forfait: Forfait): SimulationScenarios {
  const jours = joursAvantPremierPaiement(forfait);
  const palier = palierVolatilite(jours);
  const amplitudes = [...AMPLITUDES_PAR_PALIER[palier]];

  const exposition = expositionCible(forfait);
  const coutAuTauxVerrouille =
    forfait.tauxVerrouille > 0 ? exposition / forfait.tauxVerrouille : 0;
  const margeCAD = (forfait.montantTotalCAD * forfait.margeConnue) / 100;

  const construire = (mouvementPct: number): Scenario => {
    const tauxHypothetique = forfait.tauxVerrouille * (1 + mouvementPct / 100);
    const coutCADRequis =
      tauxHypothetique > 0 ? exposition / tauxHypothetique : 0;
    const ecartCAD = coutAuTauxVerrouille - coutCADRequis;
    const margeResultanteCAD = margeCAD + ecartCAD;
    return {
      mouvementPct,
      tauxHypothetique,
      coutCADRequis,
      ecartCAD,
      margeResultanteCAD,
      margeResultantePct:
        forfait.montantTotalCAD > 0
          ? (margeResultanteCAD / forfait.montantTotalCAD) * 100
          : 0,
      favorable: ecartCAD >= 0,
    };
  };

  const scenarios = amplitudes
    .flatMap((amplitude) => [construire(-amplitude), construire(amplitude)])
    .sort((a, b) => a.mouvementPct - b.mouvementPct);

  return {
    palier,
    joursAvantPremierPaiement: jours,
    amplitudes,
    scenarios,
  };
}

/**
 * Ampleur du mouvement défavorable qui ramène la marge du forfait à zéro.
 *
 * On cherche x tel que exposition/(taux*(1+x)) - exposition/taux = marge,
 * ce qui donne x = -k/(1+k) avec k = marge/exposition. On retourne l'ampleur
 * positive, plus lisible pour l'utilisateur.
 */
export function calculerSeuilCritique(forfait: Forfait): SeuilCritique {
  const exposition = expositionCible(forfait);
  const expositionCAD =
    forfait.tauxVerrouille > 0 ? exposition / forfait.tauxVerrouille : 0;
  const margeCAD = (forfait.montantTotalCAD * forfait.margeConnue) / 100;

  if (expositionCAD <= 0 || margeCAD < 0) {
    return {
      atteignable: false,
      mouvementDefavorablePct: null,
      margeCAD,
      expositionCAD,
    };
  }

  const k = margeCAD / expositionCAD;
  return {
    atteignable: true,
    mouvementDefavorablePct: (100 * k) / (1 + k),
    margeCAD,
    expositionCAD,
  };
}

/**
 * Compare le taux mid-market réel au taux qu'une banque de détail applique
 * typiquement, sur l'exposition précise de ce forfait.
 *
 * Le taux bancaire est une estimation construite à partir d'un benchmark
 * public, jamais un devis. C'est un coût de canal — réductible en comparant
 * les fournisseurs de transfert — indépendant du mouvement du marché.
 */
export function comparerCanaux(
  exposition: number,
  tauxMidMarket: number,
  margeBancaireBenchmarkPct: number,
): ComparaisonCanal {
  const tauxBancaireEstime =
    tauxMidMarket * (1 - margeBancaireBenchmarkPct / 100);
  const coutMidMarketCAD = tauxMidMarket > 0 ? exposition / tauxMidMarket : 0;
  const coutBancaireEstimeCAD =
    tauxBancaireEstime > 0 ? exposition / tauxBancaireEstime : 0;

  return {
    tauxMidMarket,
    margeBancaireBenchmarkPct,
    tauxBancaireEstime,
    coutMidMarketCAD,
    coutBancaireEstimeCAD,
    ecartCAD: coutBancaireEstimeCAD - coutMidMarketCAD,
  };
}

/**
 * Statut d'un forfait à la lumière du taux actuel re-fetché.
 * Vert : mouvement favorable, ou défavorable sous la moitié du seuil.
 * Jaune : défavorable, à mi-chemin du seuil ou au-delà.
 * Rouge : défavorable, seuil atteint — le forfait devient déficitaire.
 */
export function calculerStatut(
  forfait: Forfait,
  tauxActuel: number,
): StatutForfait {
  if (forfait.tauxVerrouille <= 0) return "vert";
  const mouvementPct =
    ((tauxActuel - forfait.tauxVerrouille) / forfait.tauxVerrouille) * 100;
  if (mouvementPct >= 0) return "vert";

  const seuil = calculerSeuilCritique(forfait);
  if (!seuil.atteignable || seuil.mouvementDefavorablePct === null) {
    return "rouge";
  }

  const ampleur = -mouvementPct;
  if (ampleur >= seuil.mouvementDefavorablePct) return "rouge";
  if (ampleur >= seuil.mouvementDefavorablePct / 2) return "jaune";
  return "vert";
}
