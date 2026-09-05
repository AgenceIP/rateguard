import { describe, expect, it } from "vitest";

import { BENCHMARK_FRAIS } from "./benchmarks";
import {
  calculerCoutReel,
  calculerSeuilCritique,
  calculerStatut,
  comparerCanaux,
  expositionCible,
  joursAvantPremierPaiement,
  palierVolatilite,
  simulerScenarios,
} from "./calculs";
import type { Forfait, LignePaiement } from "./types";

const VERROUILLAGE = Date.UTC(2026, 8, 5); // 2026-09-05, minuit UTC
const TAUX = 2.75; // 1 CAD = 2,75 SAR

function ligne(part: Partial<LignePaiement> = {}): LignePaiement {
  return {
    id: "l1",
    pourcentage: 100,
    montant: 50_000 * TAUX,
    devise: "SAR",
    dateEstimee: "2026-09-12", // 7 jours après le verrouillage
    description: "Solde fournisseur",
    ...part,
  };
}

function forfait(part: Partial<Forfait> = {}): Forfait {
  return {
    id: "f1",
    nom: "Groupe Omra Décembre 2026, 20 pèlerins",
    nombrePelerins: 20,
    montantTotalCAD: 50_000,
    deviseCible: "SAR",
    echeancier: [ligne()],
    margeConnue: 10,
    dateCreation: VERROUILLAGE,
    tauxVerrouille: TAUX,
    sourceTaux: {
      fournisseur: "Frankfurter (taux de référence BCE)",
      paire: "CAD/SAR",
      dateTaux: "2026-09-04",
      horodatageRecuperation: VERROUILLAGE,
      viaPegUsd: true,
    },
    ...part,
  };
}

describe("calculerCoutReel", () => {
  it("retient les frais fixes puis applique le spread, donnant un taux effectif inférieur au mid-market", () => {
    const cout = calculerCoutReel(50_000, TAUX, BENCHMARK_FRAIS);

    expect(cout.montantCibleAuMid).toBe(137_500);
    // 45 + 25 + 20 = 90 $ de frais fixes, prélevés avant conversion.
    const montantNet = 50_000 - 90;
    expect(cout.montantCibleRecu).toBeCloseTo(montantNet * TAUX * 0.975, 6);
    expect(cout.tauxEffectif).toBeLessThan(TAUX);
    // Les 4 lignes de frais : 3 fixes + le spread.
    expect(cout.frais).toHaveLength(4);
    expect(cout.totalFraisCAD).toBeCloseTo(90 + montantNet * 0.025, 6);
  });

  it("ne produit aucun NaN sur un montant de zéro", () => {
    const cout = calculerCoutReel(0, TAUX, BENCHMARK_FRAIS);

    expect(cout.montantCibleRecu).toBe(0);
    expect(cout.tauxEffectif).toBe(0);
    expect(Number.isNaN(cout.totalFraisCAD)).toBe(false);
  });

  it("absorbe entièrement un montant inférieur aux frais fixes", () => {
    const cout = calculerCoutReel(50, TAUX, BENCHMARK_FRAIS);

    expect(cout.montantCibleRecu).toBe(0);
    expect(cout.tauxEffectif).toBe(0);
  });
});

describe("palierVolatilite", () => {
  it("place les bornes 14 et 60 jours dans le palier inférieur", () => {
    expect(palierVolatilite(13)).toBe("court");
    expect(palierVolatilite(14)).toBe("moyen");
    expect(palierVolatilite(60)).toBe("moyen");
    expect(palierVolatilite(61)).toBe("long");
  });
});

describe("joursAvantPremierPaiement", () => {
  it("retient la date la plus proche quand l'échéancier a plusieurs lignes", () => {
    const f = forfait({
      echeancier: [
        ligne({ id: "a", pourcentage: 40, dateEstimee: "2026-12-01" }),
        ligne({ id: "b", pourcentage: 60, dateEstimee: "2026-09-20" }),
      ],
    });

    expect(joursAvantPremierPaiement(f)).toBe(15);
  });

  it("retourne 0 sur un échéancier vide ou entièrement passé", () => {
    expect(joursAvantPremierPaiement(forfait({ echeancier: [] }))).toBe(0);
    expect(
      joursAvantPremierPaiement(
        forfait({ echeancier: [ligne({ dateEstimee: "2026-08-01" })] }),
      ),
    ).toBe(0);
  });
});

describe("simulerScenarios", () => {
  it("choisit les amplitudes courtes pour un paiement à 7 jours", () => {
    const sim = simulerScenarios(forfait());

    expect(sim.palier).toBe("court");
    expect(sim.joursAvantPremierPaiement).toBe(7);
    expect(sim.amplitudes).toEqual([0.5, 1, 2]);
  });

  it("choisit les amplitudes longues pour un bloc hôtelier réservé à plusieurs mois", () => {
    const sim = simulerScenarios(
      forfait({ echeancier: [ligne({ dateEstimee: "2027-03-01" })] }),
    );

    expect(sim.palier).toBe("long");
    expect(sim.amplitudes).toEqual([3, 5, 8]);
  });

  it("produit toujours des paires symétriques, jamais une seule direction", () => {
    const sim = simulerScenarios(forfait());

    expect(sim.scenarios).toHaveLength(6);
    expect(sim.scenarios.map((s) => s.mouvementPct)).toEqual([
      -2, -1, -0.5, 0.5, 1, 2,
    ]);
    expect(sim.scenarios.filter((s) => s.favorable)).toHaveLength(3);
    expect(sim.scenarios.filter((s) => !s.favorable)).toHaveLength(3);
  });

  it("traite un mouvement positif comme favorable à l'agence", () => {
    const sim = simulerScenarios(forfait());
    const hausse = sim.scenarios.find((s) => s.mouvementPct === 2)!;
    const baisse = sim.scenarios.find((s) => s.mouvementPct === -2)!;

    // Le CAD achète plus de SAR : il en faut moins pour honorer l'échéancier.
    expect(hausse.coutCADRequis).toBeLessThan(50_000);
    expect(hausse.ecartCAD).toBeGreaterThan(0);
    expect(hausse.margeResultantePct).toBeGreaterThan(10);

    expect(baisse.ecartCAD).toBeLessThan(0);
    expect(baisse.margeResultantePct).toBeLessThan(10);
  });

  it("ne produit aucun écart sur un forfait sans exposition", () => {
    const sim = simulerScenarios(forfait({ echeancier: [] }));

    expect(sim.palier).toBe("court");
    expect(sim.scenarios.every((s) => s.ecartCAD === 0)).toBe(true);
  });
});

describe("calculerSeuilCritique", () => {
  it("calcule le mouvement défavorable qui annule la marge", () => {
    const seuil = calculerSeuilCritique(forfait());

    // marge 5 000 $ sur une exposition de 50 000 $ : k = 0,1 → 100k/(1+k).
    expect(seuil.atteignable).toBe(true);
    expect(seuil.mouvementDefavorablePct).toBeCloseTo(9.0909, 3);
    expect(seuil.margeCAD).toBe(5_000);
    expect(seuil.expositionCAD).toBeCloseTo(50_000, 6);
  });

  it("est cohérent avec le simulateur : au seuil, la marge tombe à zéro", () => {
    const f = forfait();
    const seuil = calculerSeuilCritique(f);
    const exposition = expositionCible(f);

    const tauxAuSeuil =
      f.tauxVerrouille * (1 - seuil.mouvementDefavorablePct! / 100);
    const margeRestante =
      (f.montantTotalCAD * f.margeConnue) / 100 +
      (exposition / f.tauxVerrouille - exposition / tauxAuSeuil);

    expect(margeRestante).toBeCloseTo(0, 6);
  });

  it("retourne un seuil nul quand la marge est déjà à zéro", () => {
    const seuil = calculerSeuilCritique(forfait({ margeConnue: 0 }));

    expect(seuil.atteignable).toBe(true);
    expect(seuil.mouvementDefavorablePct).toBe(0);
  });

  it("déclare le seuil inatteignable sur une marge négative", () => {
    const seuil = calculerSeuilCritique(forfait({ margeConnue: -5 }));

    expect(seuil.atteignable).toBe(false);
    expect(seuil.mouvementDefavorablePct).toBeNull();
  });
});

describe("comparerCanaux", () => {
  it("chiffre le surcoût du canal bancaire sur l'exposition du forfait", () => {
    const comparaison = comparerCanaux(137_500, TAUX, 2.5);

    expect(comparaison.tauxBancaireEstime).toBeCloseTo(2.68125, 6);
    expect(comparaison.coutMidMarketCAD).toBeCloseTo(50_000, 6);
    expect(comparaison.coutBancaireEstimeCAD).toBeGreaterThan(50_000);
    expect(comparaison.ecartCAD).toBeCloseTo(
      comparaison.coutBancaireEstimeCAD - 50_000,
      6,
    );
  });

  it("ne produit aucun NaN sur une exposition de zéro", () => {
    const comparaison = comparerCanaux(0, TAUX, 2.5);

    expect(comparaison.ecartCAD).toBe(0);
    expect(Number.isNaN(comparaison.coutBancaireEstimeCAD)).toBe(false);
  });
});

describe("calculerStatut", () => {
  it("classe le forfait selon la distance au seuil critique", () => {
    const f = forfait(); // seuil ≈ 9,09 %
    const taux = (mouvementPct: number) => TAUX * (1 + mouvementPct / 100);

    expect(calculerStatut(f, taux(1))).toBe("vert"); // favorable
    expect(calculerStatut(f, taux(-2))).toBe("vert"); // sous la mi-course
    expect(calculerStatut(f, taux(-6))).toBe("jaune"); // au-delà de 4,55 %
    expect(calculerStatut(f, taux(-10))).toBe("rouge"); // seuil dépassé
  });
});
