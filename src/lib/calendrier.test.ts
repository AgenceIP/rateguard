import { describe, expect, it } from "vitest";

import { estSeance, joursFeriesTarget, prochaineSeance } from "./calendrier";

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
