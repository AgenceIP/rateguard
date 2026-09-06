import { describe, expect, it } from "vitest";

import {
  coutDeLAttente,
  coutReel,
  impactDuTaux,
  resumerPortefeuille,
  tauxAuPlusProche,
} from "./journal";
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

describe("impactDuTaux", () => {
  it("sort négatif quand les paiements sont partis à de meilleurs taux que la moyenne", () => {
    // La série monte de 0,720 à 0,729 ; payer à la fin coûte moins cher.
    const paiements = [
      paiement({ id: "a", date: "2026-08-13", montantVoulu: 6200 }),
      paiement({ id: "b", date: "2026-08-14", montantVoulu: 6200 }),
    ];
    const impact = impactDuTaux(paiements, SERIE);
    expect(impact.montant).toBeLessThan(0);
    expect(impact.tauxMoyen).toBeCloseTo(0.7245, 4);
  });

  it("sort positif quand les paiements sont partis aux moins bons taux", () => {
    const paiements = [
      paiement({ id: "a", date: "2026-08-03", montantVoulu: 6200 }),
      paiement({ id: "b", date: "2026-08-04", montantVoulu: 6200 }),
    ];
    expect(impactDuTaux(paiements, SERIE).montant).toBeGreaterThan(0);
  });

  it("renvoie zéro sans paiement", () => {
    const impact = impactDuTaux([], SERIE);
    expect(impact.montant).toBe(0);
    expect(impact.n).toBe(0);
  });
});

describe("coutDeLAttente", () => {
  it("chiffre ce que l'attente a coûté entre la date de référence et l'exécution", () => {
    const c = coutDeLAttente(
      paiement({ dateReference: "2026-08-03", date: "2026-08-14" }),
      SERIE,
    );
    expect(c).not.toBeNull();
    expect(c!.jours).toBe(11);
    // Le taux est monté, donc le paiement a coûté MOINS cher qu'à la référence.
    expect(c!.montant).toBeLessThan(0);
  });

  it("renvoie null sans date de référence", () => {
    expect(coutDeLAttente(paiement(), SERIE)).toBeNull();
  });

  it("renvoie null quand un des deux taux manque", () => {
    expect(
      coutDeLAttente(paiement({ dateReference: "2020-01-01" }), SERIE),
    ).toBeNull();
  });
});

describe("resumerPortefeuille", () => {
  it("cumule le volume, les frais et l'impact du taux par devise", () => {
    const paiements = [
      paiement({ id: "a", date: "2026-08-04", montantRecu: 6150 }),
      paiement({ id: "b", date: "2026-08-14", montantRecu: 6150 }),
    ];
    const r = resumerPortefeuille(paiements, { USD: SERIE });
    expect(r.n).toBe(2);
    expect(r.volume).toBe(17800);
    expect(r.frais).toBeGreaterThan(0);
    expect(r.fraisPct).toBeCloseTo((r.frais / r.volume) * 100, 6);
    expect(r.devises).toHaveLength(1);
    expect(r.devises[0].devise).toBe("USD");
    expect(r.devises[0].n).toBe(2);
    expect(r.devises[0].complet).toBe(true);
  });

  it("marque la devise incomplète dès qu'un montant reçu manque", () => {
    const paiements = [
      paiement({ id: "a", date: "2026-08-04", montantRecu: 6150 }),
      paiement({ id: "b", date: "2026-08-14" }),
    ];
    const r = resumerPortefeuille(paiements, { USD: SERIE });
    expect(r.devises[0].complet).toBe(false);
  });

  it("ignore une devise sans série plutôt que d'inventer un taux", () => {
    const paiements = [paiement({ id: "a", devise: "NGN" })];
    const r = resumerPortefeuille(paiements, { USD: SERIE });
    expect(r.n).toBe(0);
    expect(r.devises).toHaveLength(0);
    expect(r.ignores).toBe(1);
  });

  it("renvoie un résumé vide sans paiement", () => {
    const r = resumerPortefeuille([], {});
    expect(r.n).toBe(0);
    expect(r.volume).toBe(0);
    expect(r.devises).toHaveLength(0);
  });
});
