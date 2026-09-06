import { describe, expect, it } from "vitest";

import { coutReel, tauxAuPlusProche } from "./journal";
import type { PaiementPasse, SerieTaux } from "./types";

const SERIE: SerieTaux = {
  de: "CAD",
  vers: "USD",
  // Lundi 3 août au vendredi 14 août 2026 : pas de fin de semaine.
  dates: [
    "2026-08-03",
    "2026-08-04",
    "2026-08-05",
    "2026-08-06",
    "2026-08-07",
    "2026-08-10",
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
  ],
  valeurs: [0.72, 0.721, 0.722, 0.723, 0.724, 0.725, 0.726, 0.727, 0.728, 0.729],
};

function paiement(p: Partial<PaiementPasse> = {}): PaiementPasse {
  return {
    id: "p1",
    beneficiaireId: null,
    beneficiaireNom: "Amina Diallo",
    date: "2026-08-14",
    deviseBase: "CAD",
    montantEnvoye: 8900,
    devise: "USD",
    montantVoulu: 6200,
    montantRecu: null,
    fraisAffiches: null,
    canal: "spot",
    dateReference: null,
    note: "",
    ...p,
  };
}

describe("tauxAuPlusProche", () => {
  it("trouve le taux du jour exact", () => {
    expect(tauxAuPlusProche(SERIE, "2026-08-10")).toBe(0.725);
  });

  it("recule au dernier cours publié pour une fin de semaine", () => {
    // Le 8 août 2026 est un samedi : c'est le vendredi 7 qui fait foi.
    expect(tauxAuPlusProche(SERIE, "2026-08-08")).toBe(0.724);
  });

  it("renvoie null avant le début de la série", () => {
    expect(tauxAuPlusProche(SERIE, "2026-07-01")).toBeNull();
  });

  it("renvoie null sur une série vide", () => {
    expect(
      tauxAuPlusProche({ de: "CAD", vers: "USD", dates: [], valeurs: [] }, "2026-08-10"),
    ).toBeNull();
  });
});

describe("coutReel", () => {
  it("chiffre le coût tout compris quand le montant reçu est connu", () => {
    // 8 900 CAD à 0,729 auraient dû livrer 6 488,1 USD ; 6 150 sont arrivés.
    const c = coutReel(paiement({ montantRecu: 6150 }), 0.729);
    expect(c.complet).toBe(true);
    expect(c.ecart).toBeCloseTo(8900 - 6150 / 0.729, 6);
    expect(c.ecartPct).toBeCloseTo((c.ecart / 8900) * 100, 6);
    expect(c.ecart).toBeGreaterThan(0);
  });

  it("retombe sur le montant voulu et se marque incomplet", () => {
    const c = coutReel(paiement(), 0.729);
    expect(c.complet).toBe(false);
    expect(c.ecart).toBeCloseTo(8900 - 6200 / 0.729, 6);
  });

  it("renvoie un écart nul sur un taux invalide plutôt qu'un infini", () => {
    const c = coutReel(paiement(), 0);
    expect(c.ecart).toBe(0);
    expect(c.ecartPct).toBe(0);
  });

  it("accepte un écart négatif — un taux meilleur que la référence existe", () => {
    const c = coutReel(paiement({ montantRecu: 6700 }), 0.729);
    expect(c.ecart).toBeLessThan(0);
  });
});
