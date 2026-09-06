import { describe, expect, it } from "vitest";

import type { SerieTaux } from "./types";
import {
  calculerVolatilite,
  coutAuMouvement,
  coutAuTauxDuJour,
  ecartType,
  fenetresGlissantes,
  percentile,
  risqueDAttendre,
  seancesPourJours,
  variationsQuotidiennes,
} from "./volatilite";

/** Série déterministe qui oscille autour de `base` — pas de hasard dans un test. */
function serie(n: number, base = 0.74, amplitude = 0.01): SerieTaux {
  const valeurs: number[] = [];
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    valeurs.push(base * (1 + amplitude * Math.sin(i / 3)));
    dates.push(`2026-01-${String((i % 28) + 1).padStart(2, "0")}`);
  }
  return { de: "CAD", vers: "USD", dates, valeurs };
}

function serieConstante(n: number, valeur = 0.2667): SerieTaux {
  return {
    de: "CAD",
    vers: "SAR",
    dates: Array.from({ length: n }, (_, i) => `2026-02-${i}`),
    valeurs: Array.from({ length: n }, () => valeur),
  };
}

describe("variationsQuotidiennes", () => {
  it("produit n − 1 rendements pour n observations", () => {
    expect(variationsQuotidiennes([100, 110, 121])).toHaveLength(2);
  });

  it("est symétrique : hausse puis baisse équivalente s'annulent", () => {
    const [monte, descend] = variationsQuotidiennes([100, 110, 100]);
    expect(monte + descend).toBeCloseTo(0, 12);
  });

  it("écarte les valeurs nulles ou négatives plutôt que de les interpoler", () => {
    expect(variationsQuotidiennes([100, 0, 110])).toHaveLength(0);
    expect(variationsQuotidiennes([100, -5, 110])).toHaveLength(0);
  });

  it("retourne une liste vide pour une série d'un seul point", () => {
    expect(variationsQuotidiennes([100])).toEqual([]);
  });
});

describe("ecartType", () => {
  it("calcule l'écart-type d'échantillon", () => {
    expect(ecartType([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.1381, 4);
  });

  it("vaut zéro quand il n'y a pas de dispersion", () => {
    expect(ecartType([3, 3, 3, 3])).toBe(0);
  });

  it("vaut zéro plutôt que NaN sous deux observations", () => {
    expect(ecartType([7])).toBe(0);
    expect(ecartType([])).toBe(0);
  });
});

describe("percentile", () => {
  it("interpole la médiane entre deux valeurs centrales", () => {
    expect(percentile([1, 2, 3, 4], 50)).toBeCloseTo(2.5, 10);
  });

  it("retourne les extrêmes à 0 et 100", () => {
    expect(percentile([5, 1, 9], 0)).toBe(1);
    expect(percentile([5, 1, 9], 100)).toBe(9);
  });

  it("gère une série vide sans exploser", () => {
    expect(percentile([], 80)).toBe(0);
  });

  it("ne dépend pas de l'ordre d'entrée", () => {
    expect(percentile([9, 1, 5, 3], 50)).toBeCloseTo(percentile([1, 3, 5, 9], 50), 10);
  });
});

describe("seancesPourJours", () => {
  it("convertit des jours civils en séances de bourse", () => {
    expect(seancesPourJours(7)).toBe(5);
    expect(seancesPourJours(14)).toBe(10);
    expect(seancesPourJours(30)).toBe(21);
  });

  it("ne descend jamais sous une séance", () => {
    expect(seancesPourJours(1)).toBe(1);
    expect(seancesPourJours(0)).toBe(1);
  });
});

describe("fenetresGlissantes", () => {
  it("mesure la variation sur chaque fenêtre qui tient dans la série", () => {
    expect(fenetresGlissantes([100, 101, 102, 103], 1)).toHaveLength(3);
    expect(fenetresGlissantes([100, 101, 102, 103], 3)[0]).toBeCloseTo(3, 10);
  });

  it("retourne une liste vide si la fenêtre dépasse la série", () => {
    expect(fenetresGlissantes([100, 101], 5)).toEqual([]);
  });
});

describe("calculerVolatilite", () => {
  it("décrit une série mouvementée sans jamais donner de direction", () => {
    const stats = calculerVolatilite(serie(260), 14);
    expect(stats.suffisant).toBe(true);
    expect(stats.quotidiennePct).toBeGreaterThan(0);
    expect(stats.annualiseePct).toBeGreaterThan(stats.quotidiennePct);
    expect(stats.amplitudeP95Pct).toBeGreaterThanOrEqual(stats.amplitudeP80Pct);
    expect(stats.amplitudeP80Pct).toBeGreaterThanOrEqual(
      stats.amplitudeMedianePct,
    );
  });

  it("rapporte une volatilité nulle pour une devise ancrée, sans la traiter comme une donnée manquante", () => {
    const stats = calculerVolatilite(serieConstante(120), 14);
    expect(stats.suffisant).toBe(true);
    expect(stats.quotidiennePct).toBe(0);
    expect(stats.amplitudeP80Pct).toBe(0);
    expect(stats.pireDefavorablePct).toBe(0);
  });

  it("refuse de conclure sur un historique trop court", () => {
    const stats = calculerVolatilite(serie(6), 14);
    expect(stats.suffisant).toBe(false);
  });

  it("reporte les bornes de la période observée", () => {
    const s = serie(60);
    const stats = calculerVolatilite(s, 7);
    expect(stats.debut).toBe(s.dates[0]);
    expect(stats.fin).toBe(s.dates[s.dates.length - 1]);
    expect(stats.fenetreJours).toBe(7);
  });
});

describe("coûts au taux", () => {
  it("un taux plus bas coûte plus cher, un taux plus haut coûte moins", () => {
    const base = coutAuTauxDuJour(10_000, 0.74);
    expect(coutAuMouvement(10_000, 0.74, -2)).toBeGreaterThan(base);
    expect(coutAuMouvement(10_000, 0.74, 2)).toBeLessThan(base);
  });

  it("retourne zéro plutôt qu'une division par zéro", () => {
    expect(coutAuTauxDuJour(10_000, 0)).toBe(0);
    expect(coutAuMouvement(10_000, 0, -2)).toBe(0);
  });
});

describe("risqueDAttendre", () => {
  it("chiffre un risque positif quand la paire bouge", () => {
    const stats = calculerVolatilite(serie(260), 14);
    expect(risqueDAttendre(10_000, 0.74, stats)).toBeGreaterThan(0);
  });

  it("ne chiffre rien quand l'historique est insuffisant", () => {
    const stats = calculerVolatilite(serie(6), 14);
    expect(risqueDAttendre(10_000, 0.74, stats)).toBe(0);
  });

  it("ne chiffre rien sur une devise ancrée", () => {
    const stats = calculerVolatilite(serieConstante(120), 14);
    expect(risqueDAttendre(10_000, 0.2667, stats)).toBe(0);
  });
});
