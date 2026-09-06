import { describe, expect, it } from "vitest";

import { HYPOTHESES_DEFAUT } from "./hypotheses";
import {
  comparerStrategies,
  resumerPaiement,
  strategieEtalement,
  strategieForward,
  strategieMultiDevise,
  strategieSpot,
} from "./strategies";
import type { Hypotheses, SerieTaux, StatsVolatilite } from "./types";
import { calculerVolatilite } from "./volatilite";

const TAUX = 0.74;
const MONTANT = 10_000;

function serie(n: number, amplitude = 0.01): SerieTaux {
  return {
    de: "CAD",
    vers: "USD",
    dates: Array.from({ length: n }, (_, i) => `2026-01-${i}`),
    valeurs: Array.from(
      { length: n },
      (_, i) => TAUX * (1 + amplitude * Math.sin(i / 3)),
    ),
  };
}

const STATS: StatsVolatilite = calculerVolatilite(serie(260), 30);
const STATS_VIDES: StatsVolatilite = calculerVolatilite(serie(5), 30);

const SAISIES: Hypotheses = { ...HYPOTHESES_DEFAUT, personnalise: true };

describe("strategieSpot", () => {
  it("additionne les trois frais fixes et la marge du taux", () => {
    const s = strategieSpot(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    const fixes = s.lignes
      .filter((l) => l.mode === "fixe")
      .reduce((t, l) => t + l.montant, 0);
    expect(fixes).toBe(45 + 25 + 20);
    expect(s.fraisTotal).toBeGreaterThan(fixes);
    expect(s.certain).toBe(false);
  });

  it("encadre le coût central par une plage ouverte des deux côtés", () => {
    const s = strategieSpot(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    expect(s.coutPlancher).toBeLessThan(s.coutCentral);
    expect(s.coutPlafond).toBeGreaterThan(s.coutCentral);
  });

  it("resserre la plage quand l'utilisateur a saisi ses propres frais", () => {
    const parDefaut = strategieSpot(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    const saisis = strategieSpot(MONTANT, TAUX, STATS, SAISIES);
    expect(saisis.coutPlafond - saisis.coutPlancher).toBeLessThan(
      parDefaut.coutPlafond - parDefaut.coutPlancher,
    );
  });

  it("n'ouvre aucune plage de change quand l'historique est insuffisant", () => {
    const s = strategieSpot(MONTANT, TAUX, STATS_VIDES, SAISIES);
    expect(s.coutPlancher).toBeCloseTo(s.coutCentral, 6);
    expect(s.coutPlafond).toBeCloseTo(s.coutCentral, 6);
  });
});

describe("strategieForward", () => {
  it("supprime toute incertitude : la plage se réduit à un point", () => {
    const f = strategieForward(MONTANT, TAUX, HYPOTHESES_DEFAUT);
    expect(f.certain).toBe(true);
    expect(f.coutPlancher).toBe(f.coutCentral);
    expect(f.coutPlafond).toBe(f.coutCentral);
  });

  it("coûte plus cher au centre que le virement au taux du jour", () => {
    const s = strategieSpot(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    const f = strategieForward(MONTANT, TAUX, HYPOTHESES_DEFAUT);
    expect(f.coutCentral).toBeGreaterThan(s.coutCentral);
  });

  it("facture une prime nulle si l'utilisateur déclare n'en payer aucune", () => {
    const sansPrime = { ...HYPOTHESES_DEFAUT, forwardPrimePct: 0 };
    const f = strategieForward(MONTANT, TAUX, sansPrime);
    const prime = f.lignes.find((l) => l.cle === "prime");
    expect(prime?.montant).toBeCloseTo(0, 6);
  });
});

describe("strategieEtalement", () => {
  it("paie les frais fixes une fois par transfert", () => {
    const un = strategieSpot(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    const trois = strategieEtalement(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT, 3);
    expect(trois.nombreTransferts).toBe(3);
    expect(trois.coutCentral - un.coutCentral).toBeCloseTo((45 + 25 + 20) * 2, 6);
  });

  it("resserre la plage de change par rapport à un transfert unique", () => {
    const un = strategieSpot(MONTANT, TAUX, STATS, SAISIES);
    const trois = strategieEtalement(MONTANT, TAUX, STATS, SAISIES, 3);
    expect(trois.coutPlafond - trois.coutPlancher).toBeLessThan(
      un.coutPlafond - un.coutPlancher,
    );
  });

  it("ramène un nombre de transferts absurde à au moins un", () => {
    expect(
      strategieEtalement(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT, 0)
        .nombreTransferts,
    ).toBe(1);
  });
});

describe("strategieMultiDevise", () => {
  it("évite les frais de correspondant et de réception", () => {
    const m = strategieMultiDevise(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    expect(m.lignes.some((l) => l.cle === "intermediaire")).toBe(false);
    expect(m.lignes.some((l) => l.cle === "reception")).toBe(false);
  });

  it("amortit l'abonnement sur le nombre de paiements du mois", () => {
    const h = { ...HYPOTHESES_DEFAUT, multiDeviseMensuel: 30 };
    const un = strategieMultiDevise(MONTANT, TAUX, STATS, h, 1);
    const quatre = strategieMultiDevise(MONTANT, TAUX, STATS, h, 4);
    expect(un.coutCentral - quatre.coutCentral).toBeCloseTo(30 - 7.5, 6);
  });

  it("laisse le risque de change intact : sa plage reste celle du marché", () => {
    const spot = strategieSpot(MONTANT, TAUX, STATS, SAISIES);
    const m = strategieMultiDevise(MONTANT, TAUX, STATS, SAISIES, 1);
    expect(m.certain).toBe(false);
    expect(m.coutPlafond).toBeGreaterThan(m.coutCentral);
    expect(m.coutPlafond - m.coutPlancher).toBeGreaterThan(
      (spot.coutPlafond - spot.coutPlancher) * 0.8,
    );
  });
});

describe("comparerStrategies", () => {
  it("retourne les quatre options dans un ordre stable, jamais trié par prix", () => {
    const cles = comparerStrategies(
      MONTANT,
      TAUX,
      STATS,
      HYPOTHESES_DEFAUT,
    ).map((s) => s.cle);
    expect(cles).toEqual(["spot", "forward", "etalement", "multidevise"]);
  });

  it("renseigne l'incertitude comme la largeur de la plage", () => {
    for (const s of comparerStrategies(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT)) {
      expect(s.incertitude).toBeCloseTo(s.coutPlafond - s.coutPlancher, 6);
    }
  });

  it("ne produit ni NaN ni Infinity quand le taux est indisponible", () => {
    for (const s of comparerStrategies(MONTANT, 0, STATS, HYPOTHESES_DEFAUT)) {
      expect(Number.isFinite(s.coutCentral)).toBe(true);
      expect(Number.isFinite(s.coutPlafond)).toBe(true);
    }
  });

  it("réduit le coût aux seuls frais quand le montant est nul", () => {
    const spot = comparerStrategies(0, TAUX, STATS, HYPOTHESES_DEFAUT)[0];
    expect(spot.coutCentral).toBeCloseTo(45 + 25 + 20, 6);
  });
});

describe("resumerPaiement", () => {
  it("chiffre le risque et le prix de la certitude", () => {
    const r = resumerPaiement(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    expect(r.risque).toBeGreaterThan(0);
    expect(r.prixDeLaCertitude).toBeGreaterThan(0);
    expect(r.suffisant).toBe(true);
  });

  it("annonce un risque nul plutôt qu'un chiffre inventé sans historique", () => {
    const r = resumerPaiement(MONTANT, TAUX, STATS_VIDES, HYPOTHESES_DEFAUT);
    expect(r.suffisant).toBe(false);
    expect(r.risque).toBe(0);
  });

  it("désigne la moins chère et chiffre l'écart avec le virement bancaire", () => {
    const r = resumerPaiement(MONTANT, TAUX, STATS, HYPOTHESES_DEFAUT);
    expect(r.moinsChere).toBe("multidevise");
    expect(r.economie).toBeGreaterThan(0);
  });

  it("ne descend jamais en dessous de zéro pour le risque", () => {
    const fige = resumerPaiement(MONTANT, TAUX, STATS_VIDES, HYPOTHESES_DEFAUT);
    expect(fige.risque).toBeGreaterThanOrEqual(0);
  });
});
