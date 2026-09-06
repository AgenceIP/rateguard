import { describe, expect, it } from "vitest";

import { derniersJours } from "./marche";
import type { SerieTaux } from "./types";

/** Date ISO à `n` jours dans le passé, calculée comme le fait `derniersJours`. */
function ilYA(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

/** Série ordonnée du plus ancien au plus récent, comme celles de Frankfurter. */
function serie(decalages: number[]): SerieTaux {
  return {
    de: "CAD",
    vers: "USD",
    dates: decalages.map(ilYA),
    valeurs: decalages.map((_, i) => 0.7 + i / 1000),
  };
}

describe("derniersJours", () => {
  it("ne garde que les dates comprises dans la fenêtre", () => {
    const s = serie([800, 700, 400, 300, 100, 10]);
    const coupe = derniersJours(s, 365);

    expect(coupe.dates).toEqual([ilYA(300), ilYA(100), ilYA(10)]);
    expect(coupe.valeurs).toEqual([s.valeurs[3], s.valeurs[4], s.valeurs[5]]);
    expect(coupe.de).toBe("CAD");
    expect(coupe.vers).toBe("USD");
  });

  it("renvoie une série vide quand toute la série précède la fenêtre", () => {
    const coupe = derniersJours(serie([1500, 1400, 1300]), 365);

    expect(coupe.dates).toEqual([]);
    expect(coupe.valeurs).toEqual([]);
  });
});
