import { describe, expect, it } from "vitest";

import {
  amplitudeParJourDeSemaine,
  amplitudeParSemaineDuMois,
  amplitudePourDuree,
  estSeance,
  expositionEntre,
  joursFeriesTarget,
  prochaineSeance,
} from "./calendrier";
import type { SerieTaux, StatsVolatilite } from "./types";

describe("joursFeriesTarget", () => {
  it("contient les jours fériés fixes", () => {
    const f = joursFeriesTarget(2026);
    expect(f).toContain("2026-01-01");
    expect(f).toContain("2026-05-01");
    expect(f).toContain("2026-12-25");
    expect(f).toContain("2026-12-26");
  });

  it("calcule Pâques : en 2026 le dimanche est le 5 avril", () => {
    const f = joursFeriesTarget(2026);
    expect(f).toContain("2026-04-03"); // Vendredi saint
    expect(f).toContain("2026-04-06"); // Lundi de Pâques
  });

  it("calcule Pâques une autre année : 2027, dimanche le 28 mars", () => {
    const f = joursFeriesTarget(2027);
    expect(f).toContain("2027-03-26");
    expect(f).toContain("2027-03-29");
  });
});

describe("estSeance", () => {
  it("accepte un mardi ordinaire", () => {
    expect(estSeance("2026-09-08")).toBe(true);
  });

  it("refuse un samedi et un dimanche", () => {
    expect(estSeance("2026-09-05")).toBe(false);
    expect(estSeance("2026-09-06")).toBe(false);
  });

  it("refuse un jour férié tombant en semaine", () => {
    // 25 décembre 2026 est un vendredi.
    expect(estSeance("2026-12-25")).toBe(false);
  });
});

describe("prochaineSeance", () => {
  it("ne décale pas une date déjà ouvrée", () => {
    expect(prochaineSeance("2026-09-08")).toEqual({
      date: "2026-09-08",
      decalageJours: 0,
    });
  });

  it("reporte un samedi au lundi", () => {
    expect(prochaineSeance("2026-09-05")).toEqual({
      date: "2026-09-07",
      decalageJours: 2,
    });
  });

  it("saute par-dessus un férié qui suit une fin de semaine", () => {
    // 26 décembre 2026 est un samedi ; 28 décembre est le lundi suivant.
    expect(prochaineSeance("2026-12-26")).toEqual({
      date: "2026-12-28",
      decalageJours: 2,
    });
  });
});

/** Série synthétique : un point par jour civil, sauts pilotés par `bruit`. */
function serieSynthetique(
  debut: string,
  n: number,
  bruit: (i: number, date: Date) => number,
): SerieTaux {
  const dates: string[] = [];
  const valeurs: number[] = [];
  let valeur = 1;
  const d0 = new Date(`${debut}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    const d = new Date(d0.getTime() + i * 86_400_000);
    const jour = d.getUTCDay();
    if (jour === 0 || jour === 6) continue; // la BCE ne publie pas la fin de semaine
    dates.push(d.toISOString().slice(0, 10));
    valeurs.push(valeur);
    valeur *= 1 + bruit(i, d);
  }
  return { de: "CAD", vers: "USD", dates, valeurs };
}

const STATS: StatsVolatilite = {
  de: "CAD",
  vers: "USD",
  observations: 250,
  debut: "2025-09-05",
  fin: "2026-09-04",
  quotidiennePct: 0.3,
  annualiseePct: 4.8,
  fenetreJours: 30,
  fenetresObservees: 230,
  amplitudeMedianePct: 1.2,
  amplitudeP80Pct: 2,
  amplitudeP95Pct: 3,
  pireDefavorablePct: 3.5,
  meilleurFavorablePct: 3.1,
  suffisant: true,
};

describe("amplitudeParSemaineDuMois", () => {
  it("détecte un paquet nettement plus agité", () => {
    // Trois ans, avec des sauts dix fois plus gros après le 22 du mois.
    const serie = serieSynthetique("2023-09-01", 1100, (i, d) =>
      (d.getUTCDate() > 22 ? 0.01 : 0.001) * (i % 2 ? 1 : -1),
    );
    const paquets = amplitudeParSemaineDuMois(serie);
    const semaine4 = paquets.find((p) => p.cle === 4);
    expect(semaine4).toBeDefined();
    expect(semaine4!.ratio).toBeGreaterThan(1.25);
    expect(semaine4!.distinct).toBe(true);
    expect(semaine4!.n).toBeGreaterThan(40);
  });

  it("ne distingue rien quand toutes les semaines se valent", () => {
    const serie = serieSynthetique("2023-09-01", 1100, (i) =>
      0.004 * (i % 2 ? 1 : -1),
    );
    const paquets = amplitudeParSemaineDuMois(serie);
    expect(paquets.every((p) => !p.distinct)).toBe(true);
  });

  it("ne distingue rien sur un historique trop court", () => {
    const serie = serieSynthetique("2026-08-01", 30, (i, d) =>
      (d.getUTCDate() > 22 ? 0.01 : 0.001) * (i % 2 ? 1 : -1),
    );
    const paquets = amplitudeParSemaineDuMois(serie);
    expect(paquets.every((p) => !p.distinct)).toBe(true);
  });
});

describe("amplitudeParJourDeSemaine", () => {
  it("renvoie les cinq jours ouvrés", () => {
    const serie = serieSynthetique("2023-09-01", 1100, (i) =>
      0.004 * (i % 2 ? 1 : -1),
    );
    const paquets = amplitudeParJourDeSemaine(serie);
    expect(paquets.map((p) => p.cle)).toEqual([1, 2, 3, 4, 5]);
  });

  it("renvoie des paquets vides sur une série sans variation exploitable", () => {
    const serie: SerieTaux = { de: "CAD", vers: "USD", dates: [], valeurs: [] };
    expect(amplitudeParJourDeSemaine(serie).every((p) => p.n === 0)).toBe(true);
  });
});

describe("amplitudePourDuree", () => {
  it("met à l'échelle en racine du temps", () => {
    // 120 jours = 4 × 30 jours → amplitude doublée (√4).
    expect(amplitudePourDuree(STATS, 120)).toBeCloseTo(4, 6);
  });

  it("renvoie zéro quand l'historique est insuffisant", () => {
    expect(amplitudePourDuree({ ...STATS, suffisant: false }, 30)).toBe(0);
  });
});

describe("expositionEntre", () => {
  it("chiffre les jours d'attente en dollars", () => {
    const e = expositionEntre("2026-09-07", "2026-10-07", 6200, 0.7247, STATS);
    expect(e.jours).toBe(30);
    expect(e.decalageJours).toBe(0);
    expect(e.montant).toBeGreaterThan(0);
    expect(e.suffisant).toBe(true);
  });

  it("reporte une date de fin de semaine et le dit", () => {
    // 2026-09-05 est un samedi : le virement part le lundi 7.
    const e = expositionEntre("2026-09-01", "2026-09-05", 6200, 0.7247, STATS);
    expect(e.dateEffective).toBe("2026-09-07");
    expect(e.decalageJours).toBe(2);
    expect(e.jours).toBe(6);
  });

  it("ne chiffre rien quand la date d'arrivée précède le départ", () => {
    const e = expositionEntre("2026-09-30", "2026-09-07", 6200, 0.7247, STATS);
    expect(e.jours).toBe(0);
    expect(e.montant).toBe(0);
  });
});
