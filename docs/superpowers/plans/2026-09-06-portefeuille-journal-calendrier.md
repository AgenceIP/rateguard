# RateGuard v3 — portefeuille, journal, calendrier — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer RateGuard d'une calculette par paiement en une vue de trésorerie : l'utilisateur saisit ses paiements passés, ces mesures réelles remplacent les estimations, et un calendrier d'amplitude non directionnel l'aide à juger sa date d'envoi.

**Architecture:** Deux nouveaux modules purs (`journal.ts`, `calendrier.ts`) sur le modèle de `volatilite.ts` — aucun import de React, de réseau ou de `localStorage`, donc testables sans mock. Le stockage étend `stockage.ts` avec la même dualité Supabase / `localStorage`. Trois écrans : `/` devient le portefeuille, `/journal` la saisie, `/paiement/[id]` est restructurée en deux colonnes avec un comparateur en tableau.

**Tech Stack:** Next.js 16.3.4 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 · Vitest 5 · Supabase JS v2 · API Frankfurter

**Spec:** `docs/superpowers/specs/2026-09-06-portefeuille-journal-calendrier-design.md`

## Global Constraints

Ces règles viennent de `AGENTS.md` et de la spec. Elles s'appliquent à **chaque** tâche.

- **Aucune sortie directionnelle.** Aucune fonction ne renvoie un « sens », une « tendance » ou une date recommandée. Uniquement des amplitudes (valeurs absolues) et des mesures du passé. Ne jamais ajouter un tel champ.
- **Aucun chiffre inventé présenté comme actuel.** Donnée absente → on le dit à l'écran (`suffisant: false`, `motif`, `distinct: false`), jamais une extrapolation.
- **Les frais restent des estimations tant qu'ils ne sont pas mesurés.** L'étiquette à l'écran change quand ils le deviennent.
- **Aucune chaîne visible en dur dans le JSX.** Toute copie va dans `src/i18n/fr.ts` puis `en.ts`. `Traductions = typeof fr` : une clé oubliée dans `en.ts` casse la compilation.
- **Règles de rédaction** (en tête de `fr.ts`) : tout terme financier glosé sur place, les montants avant les pourcentages, aucun chiffre donné comme une certitude.
- **`commun.deuxPoints`** pour tout deux-points d'énumération : `" : "` en français, `": "` en anglais.
- **Convention de taux** (en tête de `types.ts`) : un taux est « combien d'unités de la devise cible s'achètent avec 1 unité de la devise de base ». Taux qui MONTE → le paiement coûte MOINS. Un mouvement DÉFAVORABLE est une BAISSE.
- **Dates en UTC.** Toujours `new Date(iso + "T00:00:00Z")` et `getUTCDay()` / `getUTCDate()`. Jamais le constructeur local, qui décale d'un jour selon le fuseau.
- **Tests** : chaque fonction exportée de `journal.ts` et `calendrier.ts` a au moins un cas normal et un cas limite.
- Commandes : `npx vitest run` et `npm run build`.

---

### Task 1 : `calendrier.ts` — séances et jours fériés

**Files:**
- Create: `src/lib/calendrier.ts`
- Create: `src/lib/calendrier.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `estSeance(dateIso: string): boolean`, `prochaineSeance(dateIso: string): { date: string; decalageJours: number }`, `joursFeriesTarget(annee: number): string[]`.

Un virement daté d'un samedi ne part pas le samedi. La BCE ne publie ni la fin de semaine ni les jours fériés TARGET2, donc l'utilisateur hérite de jours de dérive qu'il n'a pas choisis. C'est un fait de calendrier, jamais une prévision.

- [ ] **Step 1 : écrire les tests qui échouent**

Créer `src/lib/calendrier.test.ts` :

```ts
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
```

- [ ] **Step 2 : lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/lib/calendrier.test.ts`
Expected: FAIL — `Failed to resolve import "./calendrier"`

- [ ] **Step 3 : écrire l'implémentation**

Créer `src/lib/calendrier.ts` :

```ts
/**
 * Le calendrier : quand un paiement part réellement, et à quel point une
 * période est agitée.
 *
 * CE QUE CE MODULE NE FAIT PAS. Il ne dit jamais quelle semaine est
 * « meilleure ». Une carte de saisonnalité directionnelle — « le CAD est plus
 * fort en semaine 32 » — serait la ligne rouge du défi déguisée en
 * statistique, et sur des données de change ces motifs sont presque toujours
 * du bruit non reproductible. Tout ce qui sort d'ici est une AMPLITUDE, donc
 * une valeur absolue, donc muette sur le sens.
 */

const JOUR_MS = 86_400_000;

/** Parse une date ISO en UTC. Le constructeur local décalerait d'un jour. */
function utc(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00Z`);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Dimanche de Pâques par l'algorithme grégorien anonyme.
 *
 * Deux des six fériés TARGET2 en dépendent, et ils se déplacent de plus d'un
 * mois d'une année sur l'autre : une liste écrite à la main serait fausse
 * l'année prochaine.
 */
function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const jours = h + l - 7 * m + 114;
  return new Date(Date.UTC(annee, Math.floor(jours / 31) - 1, (jours % 31) + 1));
}

/**
 * Jours fériés TARGET2 — les jours où le système de règlement de l'euro est
 * fermé, donc où la BCE ne publie aucun taux de référence.
 */
export function joursFeriesTarget(annee: number): string[] {
  const dimanche = paques(annee);
  const decale = (n: number) => iso(new Date(dimanche.getTime() + n * JOUR_MS));
  return [
    `${annee}-01-01`,
    decale(-2), // Vendredi saint
    decale(1), // Lundi de Pâques
    `${annee}-05-01`,
    `${annee}-12-25`,
    `${annee}-12-26`,
  ];
}

/** true si un virement daté de ce jour peut réellement partir ce jour-là. */
export function estSeance(dateIso: string): boolean {
  const d = utc(dateIso);
  const jour = d.getUTCDay();
  if (jour === 0 || jour === 6) return false;
  return !joursFeriesTarget(d.getUTCFullYear()).includes(dateIso);
}

/**
 * La date à laquelle le paiement partira vraiment, et le nombre de jours de
 * dérive que l'utilisateur subit sans l'avoir choisi.
 */
export function prochaineSeance(dateIso: string): {
  date: string;
  decalageJours: number;
} {
  let d = utc(dateIso);
  let decalageJours = 0;
  // Bornée : une fermeture de plus de dix jours consécutifs n'existe pas.
  while (!estSeance(iso(d)) && decalageJours < 10) {
    d = new Date(d.getTime() + JOUR_MS);
    decalageJours++;
  }
  return { date: iso(d), decalageJours };
}
```

- [ ] **Step 4 : lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run src/lib/calendrier.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5 : commit**

```bash
git add src/lib/calendrier.ts src/lib/calendrier.test.ts
git commit -m "feat(calendrier): séances, jours fériés TARGET2 et report de date"
```

---

### Task 2 : `calendrier.ts` — amplitude par période et exposition

**Files:**
- Modify: `src/lib/calendrier.ts`
- Modify: `src/lib/calendrier.test.ts`

**Interfaces:**
- Consumes: `variationsQuotidiennes`, `percentile`, `coutAuMouvement`, `coutAuTauxDuJour` de `./volatilite` ; `SerieTaux`, `StatsVolatilite` de `./types`.
- Produces: `PaquetAmplitude { cle: number; n: number; medianePct: number; ratio: number; distinct: boolean }`, `amplitudeParSemaineDuMois(serie: SerieTaux): PaquetAmplitude[]`, `amplitudeParJourDeSemaine(serie: SerieTaux): PaquetAmplitude[]`, `amplitudePourDuree(stats: StatsVolatilite, jours: number): number`, `Exposition { jours: number; decalageJours: number; dateEffective: string; amplitudePct: number; montant: number; suffisant: boolean }`, `expositionEntre(depart: string, arrivee: string, montantCible: number, taux: number, stats: StatsVolatilite): Exposition`.

**Note de conception, écart assumé avec la spec.** La spec écrivait `amplitudeParSemaineDuMois(serie, fenetreJours)` avec des fenêtres glissantes. On classe plutôt les **variations quotidiennes** par semaine du mois. C'est plus honnête : une fenêtre de 30 jours ouverte en semaine 1 déborde sur le mois suivant, donc elle ne mesure pas « la semaine 1 ». Une variation quotidienne datée du 3 du mois, elle, appartient sans ambiguïté à la semaine 1. Et ça donne ~150 observations par paquet sur trois ans au lieu de fenêtres largement redondantes.

- [ ] **Step 1 : écrire les tests qui échouent**

Ajouter à la fin de `src/lib/calendrier.test.ts` :

```ts
import {
  amplitudeParJourDeSemaine,
  amplitudeParSemaineDuMois,
  amplitudePourDuree,
  expositionEntre,
} from "./calendrier";
import type { SerieTaux, StatsVolatilite } from "./types";

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
```

- [ ] **Step 2 : lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/lib/calendrier.test.ts`
Expected: FAIL — `amplitudeParSemaineDuMois is not a function`

- [ ] **Step 3 : écrire l'implémentation**

Ajouter en tête de `src/lib/calendrier.ts`, après le bloc de commentaire :

```ts
import type { SerieTaux, StatsVolatilite } from "./types";
import {
  coutAuMouvement,
  coutAuTauxDuJour,
  percentile,
  variationsQuotidiennes,
} from "./volatilite";
```

Puis ajouter à la fin du fichier :

```ts
/**
 * Un paquet d'observations — une semaine du mois, un jour de semaine.
 *
 * `ratio` est l'amplitude médiane du paquet rapportée à l'amplitude médiane
 * globale : 1,4 veut dire « cette période a bougé 1,4× une période ordinaire ».
 * Jamais dans quel sens.
 */
export interface PaquetAmplitude {
  cle: number;
  n: number;
  medianePct: number;
  ratio: number;
  /** true seulement si le paquet se détache vraiment. Voir les seuils ci-dessous. */
  distinct: boolean;
}

/**
 * Seuils du garde-fou de significativité.
 *
 * ponytail: heuristique, pas un test statistique formel. Sans elle, avec cinq
 * paquets et du bruit, il y en a toujours un qui « ressort » et le calendrier
 * finit par désigner du hasard. Si le produit devait porter cette mesure plus
 * loin, le chemin est un test de permutation sur les médianes.
 */
const OBSERVATIONS_MINIMALES_PAQUET = 40;
const RATIO_HAUT = 1.25;
const RATIO_BAS = 0.8;

function paquets(
  serie: SerieTaux,
  cles: number[],
  classer: (date: Date) => number,
): PaquetAmplitude[] {
  const variations = variationsQuotidiennes(serie.valeurs);
  // `variationsQuotidiennes` renvoie n−1 valeurs : la variation d'indice i
  // s'est produite en arrivant sur `dates[i + 1]`.
  const groupes = new Map<number, number[]>(cles.map((c) => [c, []]));
  for (let i = 0; i < variations.length; i++) {
    const date = serie.dates[i + 1];
    if (!date) continue;
    const groupe = groupes.get(classer(utc(date)));
    if (groupe) groupe.push(Math.abs(variations[i]) * 100);
  }

  const toutes = variations.map((v) => Math.abs(v) * 100);
  const reference = percentile(toutes, 50);

  return cles.map((cle) => {
    const valeurs = groupes.get(cle) ?? [];
    const medianePct = valeurs.length ? percentile(valeurs, 50) : 0;
    const ratio = reference > 0 ? medianePct / reference : 0;
    return {
      cle,
      n: valeurs.length,
      medianePct,
      ratio,
      distinct:
        valeurs.length >= OBSERVATIONS_MINIMALES_PAQUET &&
        (ratio >= RATIO_HAUT || ratio <= RATIO_BAS),
    };
  });
}

/**
 * De combien cette paire bouge selon la semaine du mois.
 *
 * Répond à « si j'ai le choix, quelle semaine est la plus calme », jamais à
 * « quelle semaine donne un meilleur taux ». Une semaine agitée est risquée
 * dans les deux sens : c'est précisément ce qui rend la mesure publiable.
 */
export function amplitudeParSemaineDuMois(serie: SerieTaux): PaquetAmplitude[] {
  return paquets(serie, [1, 2, 3, 4, 5], (d) =>
    Math.min(5, Math.floor((d.getUTCDate() - 1) / 7) + 1),
  );
}

/** Idem par jour de semaine, du lundi (1) au vendredi (5). */
export function amplitudeParJourDeSemaine(serie: SerieTaux): PaquetAmplitude[] {
  return paquets(serie, [1, 2, 3, 4, 5], (d) => d.getUTCDay());
}

/**
 * Amplitude attendue sur une durée quelconque, mise à l'échelle depuis la
 * fenêtre mesurée.
 *
 * La volatilité croît en racine du temps : quatre fois plus de jours, deux
 * fois plus d'amplitude. L'approximation suppose des variations indépendantes,
 * ce qui est faux dans le détail mais reste l'ordre de grandeur standard —
 * et c'est un ordre de grandeur qu'on affiche, pas une borne.
 */
export function amplitudePourDuree(
  stats: StatsVolatilite,
  jours: number,
): number {
  if (!stats.suffisant || stats.fenetreJours <= 0 || jours <= 0) return 0;
  return stats.amplitudeP80Pct * Math.sqrt(jours / stats.fenetreJours);
}

export interface Exposition {
  /** Jours civils entre le départ et la date d'exécution réelle. */
  jours: number;
  /** Jours de dérive subis parce que la date tombait un jour sans virement. */
  decalageJours: number;
  dateEffective: string;
  amplitudePct: number;
  /** Ce que ces jours d'attente mettent en jeu, en devise de base. */
  montant: number;
  suffisant: boolean;
}

/**
 * Ce que coûte le fait d'attendre jusqu'à une date, plutôt que de payer au
 * départ. Une exposition, pas une prévision : on chiffre l'incertitude que
 * l'utilisateur achète, sans rien dire de son issue.
 */
export function expositionEntre(
  depart: string,
  arrivee: string,
  montantCible: number,
  taux: number,
  stats: StatsVolatilite,
): Exposition {
  const { date: dateEffective, decalageJours } = prochaineSeance(arrivee);
  const jours = Math.max(
    0,
    Math.round((utc(dateEffective).getTime() - utc(depart).getTime()) / JOUR_MS),
  );
  const amplitudePct = amplitudePourDuree(stats, jours);
  const montant =
    amplitudePct > 0 && taux > 0
      ? coutAuMouvement(montantCible, taux, -amplitudePct) -
        coutAuTauxDuJour(montantCible, taux)
      : 0;

  return {
    jours,
    decalageJours,
    dateEffective,
    amplitudePct,
    montant: Math.max(0, montant),
    suffisant: stats.suffisant && jours > 0,
  };
}
```

- [ ] **Step 4 : lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run src/lib/calendrier.test.ts`
Expected: PASS — 18 tests au total sur ce fichier

- [ ] **Step 5 : commit**

```bash
git add src/lib/calendrier.ts src/lib/calendrier.test.ts
git commit -m "feat(calendrier): amplitude par période, garde-fou de significativité, exposition"
```

---

### Task 3 : `PaiementPasse` et le coût réel d'un paiement

**Files:**
- Modify: `src/lib/types.ts` (ajouter à la fin)
- Create: `src/lib/journal.ts`
- Create: `src/lib/journal.test.ts`

**Interfaces:**
- Consumes: `SerieTaux` de `./types`.
- Produces: `CanalPaiement = CleStrategie | "autre"`, `PaiementPasse`, `tauxAuPlusProche(serie: SerieTaux, dateIso: string): number | null`, `CoutReel { ecart: number; ecartPct: number; tauxReference: number; complet: boolean }`, `coutReel(p: PaiementPasse, tauxReference: number): CoutReel`.

- [ ] **Step 1 : ajouter les types**

Ajouter à la fin de `src/lib/types.ts` :

```ts
/**
 * Canal réellement emprunté par un paiement passé. `autre` existe parce que
 * l'utilisateur a pu passer par un chemin que le comparateur ne modélise pas,
 * et qu'une liste fermée le pousserait à mentir pour pouvoir enregistrer.
 */
export type CanalPaiement = CleStrategie | "autre";

/**
 * Un paiement déjà exécuté, saisi à la main depuis un relevé bancaire.
 *
 * On ne demande que ce qui se lit sur un relevé. Les deux champs nullables
 * ne sont pas des options de confort : `montantRecu` débloque le coût TOUT
 * COMPRIS (il capture les prélèvements des banques correspondantes, invisibles
 * autrement), `dateReference` débloque le coût de l'attente. L'interface doit
 * dire ce que chacun débloque, pas se contenter de les marquer « optionnel ».
 */
export interface PaiementPasse {
  id: string;
  /** Fiche rattachée, ou null : le journal survit à la suppression d'une fiche. */
  beneficiaireId: string | null;
  /** Toujours stocké en clair pour que la ligne reste lisible sans la fiche. */
  beneficiaireNom: string;
  /** Date ISO d'exécution — le jour où l'argent est parti. */
  date: string;
  /** ISO 4217 de la devise de base au moment du paiement. */
  deviseBase: string;
  /** Ce qui a été débité, en devise de base. */
  montantEnvoye: number;
  /** ISO 4217 de la devise cible. */
  devise: string;
  /** Ce qu'on voulait faire parvenir, en devise cible. */
  montantVoulu: number;
  /** Ce qui est réellement arrivé, en devise cible. null si non confirmé. */
  montantRecu: number | null;
  /** Ligne de frais visible au relevé, en devise de base. Appoint pédagogique. */
  fraisAffiches: number | null;
  canal: CanalPaiement;
  /** Date ISO où le montant était connu (facture, début de période). */
  dateReference: string | null;
  note: string;
}
```

- [ ] **Step 2 : écrire les tests qui échouent**

Créer `src/lib/journal.test.ts` :

```ts
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
```

- [ ] **Step 3 : lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/lib/journal.test.ts`
Expected: FAIL — `Failed to resolve import "./journal"`

- [ ] **Step 4 : écrire l'implémentation**

Créer `src/lib/journal.ts` :

```ts
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
```

- [ ] **Step 5 : lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run src/lib/journal.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 6 : commit**

```bash
git add src/lib/types.ts src/lib/journal.ts src/lib/journal.test.ts
git commit -m "feat(journal): PaiementPasse et coût réel contre le taux de référence"
```

---

### Task 4 : portefeuille, impact du taux et coût de l'attente

**Files:**
- Modify: `src/lib/journal.ts`
- Modify: `src/lib/journal.test.ts`

**Interfaces:**
- Consumes: `coutReel`, `tauxAuPlusProche` (Task 3).
- Produces: `LigneDevise`, `ResumePortefeuille`, `resumerPortefeuille(paiements: PaiementPasse[], series: Record<string, SerieTaux>): ResumePortefeuille`, `ImpactTaux`, `impactDuTaux(paiements: PaiementPasse[], serie: SerieTaux): ImpactTaux`, `CoutAttente`, `coutDeLAttente(p: PaiementPasse, serie: SerieTaux): CoutAttente | null`.

**Pourquoi la moyenne de la période et non la moyenne des jours de paiement.** Pondérer par les volumes des paiements produirait un impact toujours positif : par convexité de `1/r`, `Σ mᵢ/rᵢ ≥ (Σ mᵢ)/r̄`. Ce serait un artefact mathématique, pas une observation. On compare donc au taux moyen **disponible sur la période**, ce qui peut sortir positif comme négatif — donc informatif.

- [ ] **Step 1 : écrire les tests qui échouent**

Ajouter à `src/lib/journal.test.ts` :

```ts
import {
  coutDeLAttente,
  impactDuTaux,
  resumerPortefeuille,
} from "./journal";

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
```

- [ ] **Step 2 : lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/lib/journal.test.ts`
Expected: FAIL — `impactDuTaux is not a function`

- [ ] **Step 3 : écrire l'implémentation**

Ajouter à la fin de `src/lib/journal.ts` :

```ts
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

  // Moyenne des cours publiés sur l'intervalle réellement couvert, pas
  // seulement sur les jours de paiement : c'est ce qui rend le signe informatif.
  const debut = retenus.reduce((a, x) => (x.p.date < a ? x.p.date : a), retenus[0].p.date);
  const fin = retenus.reduce((a, x) => (x.p.date > a ? x.p.date : a), retenus[0].p.date);
  const fenetre = serie.valeurs.filter(
    (_, i) => serie.dates[i] >= debut && serie.dates[i] <= fin,
  );
  const tauxMoyen = fenetre.length
    ? fenetre.reduce((a, b) => a + b, 0) / fenetre.length
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
```

- [ ] **Step 4 : lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run src/lib/journal.test.ts`
Expected: PASS — 19 tests

- [ ] **Step 5 : commit**

```bash
git add src/lib/journal.ts src/lib/journal.test.ts
git commit -m "feat(journal): portefeuille par devise, impact du taux, coût de l'attente"
```

---

### Task 5 : calibrer les hypothèses sur les paiements observés

**Files:**
- Modify: `src/lib/journal.ts`
- Modify: `src/lib/journal.test.ts`

**Interfaces:**
- Consumes: `coutReel`, `tauxAuPlusProche` (Task 3) ; `Hypotheses` de `./types`.
- Produces: `MargeObservee { pct: number; n: number; complet: boolean }`, `margeObservee(paiements: PaiementPasse[], serie: SerieTaux, devise: string, canal: CanalPaiement): MargeObservee | null`, `hypothesesCalibrees(h: Hypotheses, marge: MargeObservee, montantBase: number): Hypotheses`.

C'est la tâche qui fait passer l'outil de « estimation » à « mesuré ». Sous trois observations on garde les valeurs par défaut : deux points ne décrivent pas une banque.

- [ ] **Step 1 : écrire les tests qui échouent**

Ajouter à `src/lib/journal.test.ts` :

```ts
import { hypothesesCalibrees, margeObservee } from "./journal";
import { HYPOTHESES_DEFAUT } from "./hypotheses";

describe("margeObservee", () => {
  const troisPaiements = [
    paiement({ id: "a", date: "2026-08-04", montantRecu: 6150 }),
    paiement({ id: "b", date: "2026-08-10", montantRecu: 6160 }),
    paiement({ id: "c", date: "2026-08-14", montantRecu: 6155 }),
  ];

  it("renvoie la marge médiane dès trois observations", () => {
    const m = margeObservee(troisPaiements, SERIE, "USD", "spot");
    expect(m).not.toBeNull();
    expect(m!.n).toBe(3);
    expect(m!.complet).toBe(true);
    expect(m!.pct).toBeGreaterThan(0);
  });

  it("renvoie null sous trois observations", () => {
    expect(margeObservee(troisPaiements.slice(0, 2), SERIE, "USD", "spot")).toBeNull();
  });

  it("ne mélange pas les canaux", () => {
    const mixte = [
      ...troisPaiements.slice(0, 2),
      paiement({ id: "c", date: "2026-08-14", montantRecu: 6155, canal: "multidevise" }),
    ];
    expect(margeObservee(mixte, SERIE, "USD", "spot")).toBeNull();
  });

  it("se marque incomplet si un montant reçu manque", () => {
    const partiel = [
      ...troisPaiements.slice(0, 2),
      paiement({ id: "c", date: "2026-08-14" }),
    ];
    const m = margeObservee(partiel, SERIE, "USD", "spot");
    expect(m!.complet).toBe(false);
  });

  it("résiste à un virement aberrant grâce à la médiane", () => {
    const avecAberrant = [
      ...troisPaiements,
      paiement({ id: "d", date: "2026-08-12", montantEnvoye: 50, montantVoulu: 20, montantRecu: 5 }),
    ];
    const sans = margeObservee(troisPaiements, SERIE, "USD", "spot")!;
    const avec = margeObservee(avecAberrant, SERIE, "USD", "spot")!;
    expect(Math.abs(avec.pct - sans.pct)).toBeLessThan(5);
  });
});

describe("hypothesesCalibrees", () => {
  it("met la marge résiduelle une fois les frais fixes déduits", () => {
    const h = hypothesesCalibrees(
      HYPOTHESES_DEFAUT,
      { pct: 3.5, n: 5, complet: true },
      8900,
    );
    // 90 $ de frais fixes sur 8 900 $ ≈ 1,011 % ; il reste ≈ 2,489 %.
    expect(h.virementMargePct).toBeCloseTo(3.5 - (90 / 8900) * 100, 6);
    expect(h.personnalise).toBe(true);
  });

  it("plancher à zéro quand les frais fixes dépassent l'écart observé", () => {
    const h = hypothesesCalibrees(
      HYPOTHESES_DEFAUT,
      { pct: 0.2, n: 5, complet: true },
      1000,
    );
    expect(h.virementMargePct).toBe(0);
  });

  it("ne touche à aucun autre poste", () => {
    const h = hypothesesCalibrees(
      HYPOTHESES_DEFAUT,
      { pct: 3.5, n: 5, complet: true },
      8900,
    );
    expect(h.forwardPrimePct).toBe(HYPOTHESES_DEFAUT.forwardPrimePct);
    expect(h.multiDeviseMargePct).toBe(HYPOTHESES_DEFAUT.multiDeviseMargePct);
    expect(h.virementFixe).toBe(HYPOTHESES_DEFAUT.virementFixe);
  });
});
```

- [ ] **Step 2 : lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/lib/journal.test.ts`
Expected: FAIL — `margeObservee is not a function`

- [ ] **Step 3 : écrire l'implémentation**

Ajouter en tête de `src/lib/journal.ts` (à côté de l'import existant) :

```ts
import type { CanalPaiement, Hypotheses, PaiementPasse, SerieTaux } from "./types";
```

Puis ajouter à la fin du fichier :

```ts
/** Sous ce nombre d'observations, on garde les valeurs par défaut. */
const OBSERVATIONS_MINIMALES_MARGE = 3;

function mediane(xs: number[]): number {
  if (xs.length === 0) return 0;
  const tries = [...xs].sort((a, b) => a - b);
  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2
    ? tries[milieu]
    : (tries[milieu - 1] + tries[milieu]) / 2;
}

export interface MargeObservee {
  /** Écart tout compris médian, en % du montant débité. */
  pct: number;
  n: number;
  /** false si au moins un paiement n'avait pas son montant reçu. */
  complet: boolean;
}

/**
 * Ce que ce corridor coûte VRAIMENT à cet utilisateur, mesuré sur ses propres
 * virements.
 *
 * Médiane et non moyenne : un virement minuscule où les frais fixes dominent
 * produit un écart en pourcentage énorme, et il ne doit pas déplacer la
 * calibration de tous les autres.
 */
export function margeObservee(
  paiements: PaiementPasse[],
  serie: SerieTaux,
  devise: string,
  canal: CanalPaiement,
): MargeObservee | null {
  const ecarts: number[] = [];
  let complet = true;

  for (const p of paiements) {
    if (p.devise !== devise || p.canal !== canal) continue;
    const taux = tauxAuPlusProche(serie, p.date);
    if (!taux) continue;
    const c = coutReel(p, taux);
    ecarts.push(c.ecartPct);
    complet &&= c.complet;
  }

  if (ecarts.length < OBSERVATIONS_MINIMALES_MARGE) return null;
  return { pct: mediane(ecarts), n: ecarts.length, complet };
}

/**
 * Remplace la marge estimée par la marge mesurée.
 *
 * L'écart observé contient TOUT : la marge dans le taux, les frais fixes et
 * les prélèvements du trajet. On en retire donc la part des frais fixes déjà
 * modélisés, sinon ils seraient comptés deux fois.
 *
 * ponytail: la part fixe dépend du montant, donc la calibration est valable
 * pour ce montant-là. C'est assez juste pour un paiement récurrent de taille
 * stable ; si les montants variaient d'un ordre de grandeur, il faudrait
 * régresser l'écart sur le montant plutôt que prendre une médiane.
 */
export function hypothesesCalibrees(
  h: Hypotheses,
  marge: MargeObservee,
  montantBase: number,
): Hypotheses {
  const fixes = h.virementFixe + h.virementIntermediaire + h.virementReception;
  const partFixePct = montantBase > 0 ? (fixes / montantBase) * 100 : 0;
  return {
    ...h,
    virementMargePct: Math.max(0, marge.pct - partFixePct),
    personnalise: true,
  };
}
```

- [ ] **Step 4 : lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run`
Expected: PASS — 45 tests existants + 27 nouveaux = 72

- [ ] **Step 5 : commit**

```bash
git add src/lib/journal.ts src/lib/journal.test.ts
git commit -m "feat(journal): calibrer les hypothèses de frais sur les paiements observés"
```

---

### Task 6 : persistance des paiements passés

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/lib/stockage.ts`

**Interfaces:**
- Consumes: `PaiementPasse` (Task 3).
- Produces: `lireJournal(): Promise<PaiementPasse[]>`, `enregistrerPaiement(p: Omit<PaiementPasse, "id">): Promise<void>`, `supprimerPaiement(id: string): Promise<void>`.

Pas de test unitaire : ce module touche `localStorage` et le réseau, comme `lireProfil` aujourd'hui. Il est vérifié par le pilotage de l'application (Task 14).

- [ ] **Step 1 : ajouter la table au schéma**

Ajouter dans `supabase/schema.sql`, après la table `decisions` et avant le bloc RLS :

```sql
-- Paiements déjà exécutés, saisis à la main depuis un relevé bancaire.
--
-- C'est la table qui fait passer l'outil de l'estimation à la mesure : une
-- fois trois lignes présentes sur un corridor, le comparateur cesse d'utiliser
-- ses ordres de grandeur publics et se calibre sur ces chiffres-là.
--
-- montant_recu et date_reference sont nullables et le restent : le premier
-- débloque le coût tout compris, le second le coût de l'attente. Les rendre
-- obligatoires empêcherait de saisir un paiement dont on n'a pas tout retrouvé,
-- et une ligne partielle vaut mieux qu'une ligne absente.
create table if not exists paiements_passes (
  id               uuid primary key default gen_random_uuid(),
  espace           text not null references profils (espace) on delete cascade,
  beneficiaire_id  uuid references beneficiaires (id) on delete set null,
  beneficiaire_nom text not null,
  date             date not null,
  devise_base      text not null,
  montant_envoye   numeric(14, 2) not null check (montant_envoye > 0),
  devise           text not null,
  montant_voulu    numeric(14, 2) not null check (montant_voulu > 0),
  montant_recu     numeric(14, 2) check (montant_recu >= 0),
  frais_affiches   numeric(14, 2) check (frais_affiches >= 0),
  canal            text not null,
  date_reference   date,
  note             text not null default '',
  cree_le          timestamptz not null default now()
);

create index if not exists paiements_passes_espace_idx
  on paiements_passes (espace, date desc);
```

Puis, dans le bloc RLS, ajouter la table à la liste `alter table` et sa politique :

```sql
alter table paiements_passes enable row level security;

drop policy if exists paiements_passes_espace on paiements_passes;
create policy paiements_passes_espace on paiements_passes
  for all using (espace = current_setting('request.headers', true)::json ->> 'x-espace')
  with check (espace = current_setting('request.headers', true)::json ->> 'x-espace');
```

- [ ] **Step 2 : ajouter les fonctions de stockage**

Dans `src/lib/stockage.ts`, ajouter la clé locale à côté des autres :

```ts
const CLE_JOURNAL = "rateguard.journal.v1";
```

Modifier l'import de types en tête du fichier pour inclure `PaiementPasse` :

```ts
import type { Beneficiaire, Hypotheses, PaiementPasse, Profil } from "./types";
```

Puis ajouter à la fin du fichier :

```ts
/**
 * Journal des paiements passés.
 *
 * Trié du plus récent au plus ancien des deux côtés, pour que l'écran n'ait
 * jamais à savoir lequel des deux stockages a répondu.
 */
export async function lireJournal(): Promise<PaiementPasse[]> {
  const sb = supabase();
  if (!sb) {
    return lireLocal<PaiementPasse[]>(CLE_JOURNAL, []).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }

  const { data, error } = await sb
    .from("paiements_passes")
    .select("*")
    .eq("espace", espace())
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map((l) => ({
    id: l.id as string,
    beneficiaireId: (l.beneficiaire_id as string | null) ?? null,
    beneficiaireNom: l.beneficiaire_nom as string,
    date: l.date as string,
    deviseBase: l.devise_base as string,
    montantEnvoye: Number(l.montant_envoye),
    devise: l.devise as string,
    montantVoulu: Number(l.montant_voulu),
    montantRecu: l.montant_recu === null ? null : Number(l.montant_recu),
    fraisAffiches: l.frais_affiches === null ? null : Number(l.frais_affiches),
    canal: l.canal as PaiementPasse["canal"],
    dateReference: (l.date_reference as string | null) ?? null,
    note: (l.note as string) ?? "",
  }));
}

export async function enregistrerPaiement(
  p: Omit<PaiementPasse, "id">,
): Promise<void> {
  const sb = supabase();
  if (!sb) {
    const existants = lireLocal<PaiementPasse[]>(CLE_JOURNAL, []);
    const ligne: PaiementPasse = { ...p, id: crypto.randomUUID() };
    window.localStorage.setItem(
      CLE_JOURNAL,
      JSON.stringify([ligne, ...existants]),
    );
    return;
  }

  await sb.from("paiements_passes").insert({
    espace: espace(),
    beneficiaire_id: p.beneficiaireId,
    beneficiaire_nom: p.beneficiaireNom,
    date: p.date,
    devise_base: p.deviseBase,
    montant_envoye: p.montantEnvoye,
    devise: p.devise,
    montant_voulu: p.montantVoulu,
    montant_recu: p.montantRecu,
    frais_affiches: p.fraisAffiches,
    canal: p.canal,
    date_reference: p.dateReference,
    note: p.note,
  });
}

export async function supprimerPaiement(id: string): Promise<void> {
  const sb = supabase();
  if (!sb) {
    const restants = lireLocal<PaiementPasse[]>(CLE_JOURNAL, []).filter(
      (p) => p.id !== id,
    );
    window.localStorage.setItem(CLE_JOURNAL, JSON.stringify(restants));
    return;
  }
  await sb.from("paiements_passes").delete().eq("espace", espace()).eq("id", id);
}
```

- [ ] **Step 3 : vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 4 : commit**

```bash
git add supabase/schema.sql src/lib/stockage.ts
git commit -m "feat(stockage): table paiements_passes, RLS par espace et repli localStorage"
```

---

### Task 7 : trois ans d'historique

**Files:**
- Modify: `src/lib/marche.ts`

**Interfaces:**
- Consumes: `SerieTaux` de `./types`.
- Produces: `derniersJours(serie: SerieTaux, jours: number): SerieTaux` ; `Marche.serie` couvre désormais trois ans.

Le calendrier découpe l'année en cinq paquets de semaines. Avec un an d'historique, chaque paquet ne contient que ~50 variations, sous le seuil de significativité — le calendrier n'afficherait jamais rien. Trois ans donnent ~150 par paquet. Les statistiques d'amplitude en tête de page restent sur 12 mois : le régime récent décrit mieux l'amplitude à venir.

- [ ] **Step 1 : élargir la fenêtre et ajouter le découpage**

Dans `src/lib/marche.ts`, remplacer la constante :

```ts
const JOURS_HISTORIQUE = 365;
```

par :

```ts
/**
 * Trois ans. Le calendrier a besoin de ~150 observations par paquet de
 * semaines pour que son garde-fou de significativité puisse conclure quoi que
 * ce soit ; un an n'en donne que ~50. Un seul appel, deux usages.
 */
const JOURS_HISTORIQUE = 1095;

/** Fenêtre courte pour les statistiques d'amplitude. */
export const JOURS_STATISTIQUES = 365;

/**
 * Les `jours` derniers jours civils d'une série.
 *
 * Les statistiques de la page détail décrivent le régime récent, le calendrier
 * a besoin de toute la profondeur. Les deux fenêtres coexistent et chaque
 * écran affiche celle qu'il utilise — ne jamais laisser croire qu'un chiffre
 * porte sur une période qu'il ne couvre pas.
 */
export function derniersJours(serie: SerieTaux, jours: number): SerieTaux {
  const limite = new Date(Date.now() - jours * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const depart = serie.dates.findIndex((d) => d >= limite);
  if (depart <= 0) return serie;
  return {
    de: serie.de,
    vers: serie.vers,
    dates: serie.dates.slice(depart),
    valeurs: serie.valeurs.slice(depart),
  };
}
```

- [ ] **Step 2 : vérifier que la route accepte la fenêtre**

Run: `grep -n "JOURS_MAX" src/app/api/serie/route.ts`
Expected: `const JOURS_MAX = 1826;` — 1095 passe sans changement de route.

- [ ] **Step 3 : vérifier la compilation**

Run: `npx tsc --noEmit && npx vitest run`
Expected: aucune erreur, 72 tests passent

- [ ] **Step 4 : commit**

```bash
git add src/lib/marche.ts
git commit -m "feat(marche): trois ans d'historique et découpage par fenêtre"
```

---

### Task 8 : la copie française et anglaise

**Files:**
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/components/chrome.tsx`

**Interfaces:**
- Produces: les clés `nav.journal`, `portefeuille.*`, `journal.*`, `paiement.date.*`, `paiement.vosChiffres.*` et les quatre clés ajoutées à `paiement.strategies`, consommées par les tâches 9 à 13.

Rappel : `Traductions = typeof fr`, donc `fr.ts` d'abord et `en.ts` doit le refléter exactement, sinon la compilation échoue. Les montants passent avant les pourcentages, tout terme financier est glosé sur place, aucun chiffre n'est donné comme une certitude.

- [ ] **Step 1 : ajouter les clés françaises**

Dans `src/i18n/fr.ts`, ajouter `journal` à l'objet `nav` :

```ts
  nav: {
    accueil: "Paiements",
    journal: "Journal",
    donnees: "D'où viennent les données",
    conformite: "Conformité",
  },
```

Puis ajouter deux blocs de premier niveau, après `accueil` :

```ts
  portefeuille: {
    titre: "Votre portefeuille",
    periode: "12 derniers mois",
    intro:
      "Ce que vos paiements internationaux vous ont réellement coûté, mesuré sur les paiements que vous avez saisis. Les frais et l'effet du taux sont séparés parce qu'ils ne se pilotent pas de la même façon : les frais se choisissent, le taux ne se choisit pas — seule votre exposition se choisit.",
    volume: "Payé à l'étranger",
    volumeDetail: (n: number) => (n === 1 ? "1 paiement" : `${n} paiements`),
    frais: "Frais et marges",
    fraisDetail: (pct: string) => `${pct} du volume`,
    fraisAide:
      "Tout ce que la chaîne a prélevé : la marge cachée dans le taux, les frais fixes et les prélèvements des banques du trajet.",
    impact: "Effet du calendrier",
    impactDetail: "par rapport au taux moyen de la période",
    impactAide:
      "Ce que la répartition de vos versements dans le temps a coûté ou rapporté, comparée au taux moyen disponible sur la période. C'est un constat sur le passé : personne ne peut savoir à l'avance quelle date sera la bonne.",
    incomplet:
      "Certains paiements n'ont pas de montant reçu. Leur coût réel est donc au moins celui affiché, jamais moins.",
    ignores: (n: number) =>
      n === 1
        ? "1 paiement est écarté du calcul : la Banque centrale européenne ne publie pas sa devise."
        : `${n} paiements sont écartés du calcul : la Banque centrale européenne ne publie pas leur devise.`,
    vide: {
      titre: "Rien à mesurer pour l'instant",
      corps:
        "Saisissez vos paiements déjà effectués et RateGuard cessera d'estimer : il mesurera. Trois paiements sur un même trajet suffisent pour que le comparateur se calibre sur votre banque plutôt que sur des ordres de grandeur publics.",
      action: "Saisir un paiement passé",
    },
    parDevise: "Par devise",
    aPayer: "À payer bientôt",
  },

  journal: {
    titre: "Vos paiements passés",
    intro:
      "Ce que vous avez réellement payé, comparé au taux de référence du jour même. C'est ici que se lit la réponse à « est-ce que j'ai économisé » : vos virements de janvier en face de ceux d'août.",
    vide: "Aucun paiement enregistré. Le premier suffit pour commencer à mesurer.",
    ajouter: "Ajouter un paiement",
    annuler: "Annuler",
    enregistrer: "Enregistrer",
    supprimer: "Retirer",
    colonnes: {
      date: "Date",
      beneficiaire: "Bénéficiaire",
      envoye: "Débité",
      recu: "Reçu",
      canal: "Par",
      ecart: "Ce que ça a coûté",
    },
    canaux: {
      spot: "Virement bancaire",
      forward: "Taux figé à l'avance",
      etalement: "Plusieurs versements",
      multidevise: "Compte multi-devises",
      autre: "Autre",
    },
    champs: {
      beneficiaire: "Qui avez-vous payé",
      date: "Date du paiement",
      dateAide: "Le jour où l'argent est sorti de votre compte.",
      montantEnvoye: "Montant débité de votre compte",
      montantVoulu: "Montant que vous vouliez lui faire parvenir",
      montantRecu: "Montant réellement reçu",
      montantRecuAide:
        "Optionnel, mais c'est le champ qui compte : sans lui, on ne peut pas voir ce que les banques du trajet ont prélevé. Demandez-le à la personne payée.",
      fraisAffiches: "Frais facturés sur votre relevé",
      fraisAffichesAide:
        "Optionnel. La ligne de frais visible, si votre banque en affiche une.",
      dateReference: "Date à laquelle vous saviez que vous deviez ce montant",
      dateReferenceAide:
        "Optionnel — date de la facture, ou début de la période de paie. La remplir permet de chiffrer ce que l'attente vous a coûté.",
      canal: "Comment avez-vous payé",
      note: "Note",
    },
    ecart: {
      complet: (montant: string, pct: string) =>
        `${montant} de plus que le taux de référence (${pct})`,
      partiel: (montant: string, pct: string) =>
        `au moins ${montant} de plus que le taux de référence (${pct})`,
      gain: (montant: string) => `${montant} de moins que le taux de référence`,
      sansTaux: "Taux de référence indisponible à cette date",
    },
    attente: {
      titre: "Ce que l'attente a coûté",
      coute: (jours: number, montant: string) =>
        `${jours} jours entre le moment où vous saviez et le versement : ${montant} de plus.`,
      rapporte: (jours: number, montant: string) =>
        `${jours} jours entre le moment où vous saviez et le versement : ${montant} de moins.`,
      note: "Le taux aurait tout aussi bien pu partir dans l'autre sens. C'est ce qu'on appelle une exposition, pas une erreur.",
    },
  },
```

Puis, dans le bloc `paiement` existant, ajouter trois sous-blocs :

```ts
    vosChiffres: {
      titre: "Vos chiffres",
      mesure: (n: number, paire: string) =>
        `Mesuré sur vos ${n} derniers paiements ${paire}.`,
      defaut:
        "Estimations, tant que vous n'avez pas saisi de paiements passés sur ce trajet.",
      pourAffiner: (manquants: number) =>
        manquants === 1
          ? "Encore 1 paiement enregistré sur ce trajet et ces chiffres deviendront des mesures."
          : `Encore ${manquants} paiements enregistrés sur ce trajet et ces chiffres deviendront des mesures.`,
      marge: "Marge dans le taux",
      fraisFixes: "Frais fixes",
      ajuster: "Ajuster",
      fermer: "Terminer",
    },

    date: {
      titre: "Votre date",
      exposition: (jours: number, montant: string) =>
        `${jours} jours d'attente, soit environ ${montant} d'incertitude sur ce paiement.`,
      expositionCourte: "Le paiement est dû aujourd'hui : aucune attente à chiffrer.",
      decalage: (prevue: string, reelle: string, jours: number) =>
        `Le ${prevue} n'est pas un jour de virement. Le paiement partira le ${reelle}, soit ${jours} jours de plus que vous n'avez pas choisis.`,
      semaine: {
        titre: "Cette semaine du mois",
        agitee: (ratio: string) =>
          `Sur trois ans, cette semaine du mois a bougé ${ratio} fois plus qu'une semaine ordinaire pour cette paire. Plus de mouvement veut dire plus d'incertitude — dans les deux sens.`,
        calme: (ratio: string) =>
          `Sur trois ans, cette semaine du mois a bougé ${ratio} fois moins qu'une semaine ordinaire pour cette paire.`,
        indistincte:
          "Aucune semaine du mois ne se distingue nettement des autres pour cette paire. C'est le cas le plus fréquent, et c'est une information : votre date de versement ne change pas grand-chose à votre incertitude.",
        insuffisant:
          "Pas assez d'historique sur cette paire pour comparer les semaines entre elles.",
      },
      nonPrediction:
        "RateGuard ne vous dira jamais quelle semaine donnera un meilleur taux — sur quelques semaines, la direction d'un taux de change n'est pas prévisible, et prétendre le contraire serait vous mentir. Ce qui se mesure, et que vous voyez ici, c'est de combien ça bouge.",
    },

**Ne pas créer de bloc `comparateur`.** Le bloc `paiement.strategies` existant fournit
déjà `titre`, `intro`, `colonneOption`, `colonneCout`, `colonneCertitude`, `certain`,
`incertain(plage)`, `plage(bas, haut)`, `central(montant)`, `transferts(n)`, `detailFrais`,
`postes` et les quatre fiches `spot` / `forward` / `etalement` / `multidevise`. Le tableau
les réutilise tels quels. **Ajouter seulement ces quatre clés**, dans `paiement.strategies`,
à côté de `detailFrais` :

```ts
      moinsChere: "La moins chère aujourd'hui",
      incertainCourt: "Une fourchette",
      deplier: "Voir le détail",
      replier: "Masquer le détail",
```

`incertainCourt` existe parce que `incertain(plage)` répète la fourchette, déjà affichée
dans la colonne du coût. Dans un tableau, la répéter dilue la lecture.
```

- [ ] **Step 2 : refléter en anglais**

Dans `src/i18n/en.ts`, ajouter les mêmes clés. `nav` :

```ts
  nav: {
    accueil: "Payments",
    journal: "Ledger",
    donnees: "Where the data comes from",
    conformite: "Compliance",
  },
```

Puis :

```ts
  portefeuille: {
    titre: "Your portfolio",
    periode: "Last 12 months",
    intro:
      "What your international payments actually cost, measured on the payments you entered. Fees and rate effect are shown separately because you steer them differently: you choose your fees, you don't choose the rate — you only choose your exposure.",
    volume: "Paid abroad",
    volumeDetail: (n: number) => (n === 1 ? "1 payment" : `${n} payments`),
    frais: "Fees and margins",
    fraisDetail: (pct: string) => `${pct} of volume`,
    fraisAide:
      "Everything the chain took: the margin hidden in the rate, the fixed fees, and the deductions made by banks along the way.",
    impact: "Timing effect",
    impactDetail: "against the period's average rate",
    impactAide:
      "What the spread of your payments over time cost or earned, compared with the average rate available during the period. It describes the past: nobody can know in advance which date will turn out well.",
    incomplet:
      "Some payments have no received amount. Their real cost is therefore at least the figure shown, never less.",
    ignores: (n: number) =>
      n === 1
        ? "1 payment is left out of the calculation: the European Central Bank does not publish its currency."
        : `${n} payments are left out of the calculation: the European Central Bank does not publish their currency.`,
    vide: {
      titre: "Nothing to measure yet",
      corps:
        "Enter payments you have already made and RateGuard will stop estimating: it will measure. Three payments along the same route are enough for the comparison to calibrate on your bank rather than on public orders of magnitude.",
      action: "Enter a past payment",
    },
    parDevise: "By currency",
    aPayer: "Due soon",
  },

  journal: {
    titre: "Your past payments",
    intro:
      "What you actually paid, against the reference rate of that same day. This is where you read the answer to “did I save anything”: your January transfers next to your August ones.",
    vide: "No payment recorded yet. The first one is enough to start measuring.",
    ajouter: "Add a payment",
    annuler: "Cancel",
    enregistrer: "Save",
    supprimer: "Remove",
    colonnes: {
      date: "Date",
      beneficiaire: "Paid to",
      envoye: "Debited",
      recu: "Received",
      canal: "Via",
      ecart: "What it cost",
    },
    canaux: {
      spot: "Bank wire",
      forward: "Rate locked in advance",
      etalement: "Several transfers",
      multidevise: "Multi-currency account",
      autre: "Other",
    },
    champs: {
      beneficiaire: "Who did you pay",
      date: "Payment date",
      dateAide: "The day the money left your account.",
      montantEnvoye: "Amount debited from your account",
      montantVoulu: "Amount you wanted them to receive",
      montantRecu: "Amount actually received",
      montantRecuAide:
        "Optional, but this is the field that matters: without it, there is no way to see what the banks along the way took. Ask the person you paid.",
      fraisAffiches: "Fees charged on your statement",
      fraisAffichesAide:
        "Optional. The visible fee line, if your bank shows one.",
      dateReference: "Date you knew you owed this amount",
      dateReferenceAide:
        "Optional — invoice date, or start of the pay period. Filling it in lets us price what waiting cost you.",
      canal: "How did you pay",
      note: "Note",
    },
    ecart: {
      complet: (montant: string, pct: string) =>
        `${montant} more than the reference rate (${pct})`,
      partiel: (montant: string, pct: string) =>
        `at least ${montant} more than the reference rate (${pct})`,
      gain: (montant: string) => `${montant} less than the reference rate`,
      sansTaux: "No reference rate available for that date",
    },
    attente: {
      titre: "What waiting cost",
      coute: (jours: number, montant: string) =>
        `${jours} days between knowing and paying: ${montant} more.`,
      rapporte: (jours: number, montant: string) =>
        `${jours} days between knowing and paying: ${montant} less.`,
      note: "The rate could just as easily have gone the other way. That is called exposure, not a mistake.",
    },
  },
```

Et dans le bloc `paiement` d'`en.ts` :

```ts
    vosChiffres: {
      titre: "Your numbers",
      mesure: (n: number, paire: string) =>
        `Measured on your last ${n} ${paire} payments.`,
      defaut:
        "Estimates, until you enter past payments along this route.",
      pourAffiner: (manquants: number) =>
        manquants === 1
          ? "One more payment recorded along this route and these figures become measurements."
          : `${manquants} more payments recorded along this route and these figures become measurements.`,
      marge: "Margin in the rate",
      fraisFixes: "Fixed fees",
      ajuster: "Adjust",
      fermer: "Done",
    },

    date: {
      titre: "Your date",
      exposition: (jours: number, montant: string) =>
        `${jours} days of waiting, or about ${montant} of uncertainty on this payment.`,
      expositionCourte: "The payment is due today: there is no wait to price.",
      decalage: (prevue: string, reelle: string, jours: number) =>
        `${prevue} is not a transfer day. The payment will leave on ${reelle}, ${jours} days later than you chose.`,
      semaine: {
        titre: "This week of the month",
        agitee: (ratio: string) =>
          `Over three years, this week of the month moved ${ratio} times more than an ordinary week for this pair. More movement means more uncertainty — in both directions.`,
        calme: (ratio: string) =>
          `Over three years, this week of the month moved ${ratio} times less than an ordinary week for this pair.`,
        indistincte:
          "No week of the month stands out clearly from the others for this pair. That is the most common case, and it is information: your payment date does not change your uncertainty much.",
        insuffisant:
          "Not enough history on this pair to compare weeks against each other.",
      },
      nonPrediction:
        "RateGuard will never tell you which week will give a better rate — over a few weeks the direction of an exchange rate is not predictable, and pretending otherwise would be lying to you. What can be measured, and what you see here, is how much it moves.",
    },

Et dans `paiement.strategies` d'`en.ts`, les quatre mêmes clés :

```ts
      moinsChere: "Cheapest today",
      incertainCourt: "A range",
      deplier: "See the detail",
      replier: "Hide the detail",
```
```

- [ ] **Step 3 : ajouter le lien de navigation**

Dans `src/components/chrome.tsx`, ajouter le lien `/journal` entre `/` et `/donnees`, en suivant exactement le motif des liens existants :

```tsx
<Link href="/journal" className="...">{t.nav.journal}</Link>
```

(Reprendre les classes du lien `/donnees` voisin — ne pas inventer de style.)

- [ ] **Step 4 : vérifier que les deux langues coïncident**

Run: `npx tsc --noEmit`
Expected: aucune erreur — une clé oubliée dans `en.ts` produirait ici une erreur de type

- [ ] **Step 5 : commit**

```bash
git add src/i18n/fr.ts src/i18n/en.ts src/components/chrome.tsx
git commit -m "feat(i18n): copie du portefeuille, du journal, du calendrier et du comparateur"
```

---

### Task 9 : l'écran `/journal`

**Files:**
- Create: `src/app/journal/page.tsx`

**Interfaces:**
- Consumes: `lireJournal`, `enregistrerPaiement`, `supprimerPaiement` (Task 6) ; `coutReel`, `coutDeLAttente`, `tauxAuPlusProche` (Tasks 3–4) ; `useMarches` de `@/lib/marche` ; `t.journal.*` (Task 8).

Suivre le motif de `src/app/donnees/page.tsx` : `"use client"`, `useT()`, chargement asynchrone dans un effet. Utiliser des `<select>` natifs comme dans `src/app/page.tsx` — accessibles, sans dépendance.

- [ ] **Step 1 : écrire la page**

Créer `src/app/journal/page.tsx` :

```tsx
"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { formaterDate, formaterMontant, formaterPourcentage } from "@/lib/format";
import { coutDeLAttente, coutReel, tauxAuPlusProche } from "@/lib/journal";
import { useMarches } from "@/lib/marche";
import {
  enregistrerPaiement,
  lireJournal,
  lireProfil,
  supprimerPaiement,
} from "@/lib/stockage";
import type { CanalPaiement, PaiementPasse, Profil } from "@/lib/types";

const CANAUX: CanalPaiement[] = [
  "spot",
  "forward",
  "etalement",
  "multidevise",
  "autre",
];

export default function Journal() {
  const t = useT();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [paiements, setPaiements] = useState<PaiementPasse[]>([]);
  const [ouvert, setOuvert] = useState(false);

  const recharger = () => lireJournal().then(setPaiements);
  useEffect(() => {
    lireProfil().then(setProfil);
    recharger();
  }, []);

  const base = profil?.deviseBase ?? "CAD";
  const { marches } = useMarches(base, paiements.map((p) => p.devise));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {t.journal.titre}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
        {t.journal.intro}
      </p>

      {paiements.length === 0 ? (
        <p className="mt-10 leading-relaxed">{t.journal.vide}</p>
      ) : (
        <ul className="registre mt-10 border-y border-border">
          {paiements.map((p) => {
            const serie = marches[p.devise]?.serie ?? null;
            const taux = serie ? tauxAuPlusProche(serie, p.date) : null;
            const cout = taux ? coutReel(p, taux) : null;
            const attente = serie ? coutDeLAttente(p, serie) : null;

            return (
              <li key={p.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="font-medium">{p.beneficiaireNom}</span>
                  <span className="chiffres text-sm text-muted-foreground">
                    {formaterDate(p.date)} · {t.journal.canaux[p.canal]}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  {t.journal.colonnes.envoye}
                  {t.commun.deuxPoints}
                  <span className="chiffres">
                    {formaterMontant(p.montantEnvoye, p.deviseBase)}
                  </span>
                  {" · "}
                  {t.journal.colonnes.recu}
                  {t.commun.deuxPoints}
                  <span className="chiffres">
                    {formaterMontant(p.montantRecu ?? p.montantVoulu, p.devise)}
                  </span>
                </p>

                <p className="mt-1 text-sm">
                  {!cout
                    ? t.journal.ecart.sansTaux
                    : cout.ecart < 0
                      ? t.journal.ecart.gain(
                          formaterMontant(-cout.ecart, p.deviseBase, 0),
                        )
                      : cout.complet
                        ? t.journal.ecart.complet(
                            formaterMontant(cout.ecart, p.deviseBase, 0),
                            formaterPourcentage(cout.ecartPct),
                          )
                        : t.journal.ecart.partiel(
                            formaterMontant(cout.ecart, p.deviseBase, 0),
                            formaterPourcentage(cout.ecartPct),
                          )}
                </p>

                {attente && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {attente.montant >= 0
                      ? t.journal.attente.coute(
                          attente.jours,
                          formaterMontant(attente.montant, p.deviseBase, 0),
                        )
                      : t.journal.attente.rapporte(
                          attente.jours,
                          formaterMontant(-attente.montant, p.deviseBase, 0),
                        )}
                  </p>
                )}

                <button
                  type="button"
                  className="mt-2 text-sm text-muted-foreground underline underline-offset-4"
                  onClick={() => supprimerPaiement(p.id).then(recharger)}
                >
                  {t.journal.supprimer}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {ouvert ? (
        <Formulaire
          base={base}
          onAnnuler={() => setOuvert(false)}
          onEnregistrer={async (p) => {
            await enregistrerPaiement(p);
            await recharger();
            setOuvert(false);
          }}
        />
      ) : (
        <Button className="mt-8" onClick={() => setOuvert(true)}>
          {t.journal.ajouter}
        </Button>
      )}
    </div>
  );
}

function Formulaire({
  base,
  onAnnuler,
  onEnregistrer,
}: {
  base: string;
  onAnnuler: () => void;
  onEnregistrer: (p: Omit<PaiementPasse, "id">) => void;
}) {
  const t = useT();
  const [nom, setNom] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [devise, setDevise] = useState("USD");
  const [envoye, setEnvoye] = useState("");
  const [voulu, setVoulu] = useState("");
  const [recu, setRecu] = useState("");
  const [frais, setFrais] = useState("");
  const [reference, setReference] = useState("");
  const [canal, setCanal] = useState<CanalPaiement>("spot");

  const valide = nom.trim() && Number(envoye) > 0 && Number(voulu) > 0;

  return (
    <form
      className="mt-8 border-t border-border pt-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valide) return;
        onEnregistrer({
          beneficiaireId: null,
          beneficiaireNom: nom.trim(),
          date,
          deviseBase: base,
          montantEnvoye: Number(envoye),
          devise: devise.toUpperCase(),
          montantVoulu: Number(voulu),
          montantRecu: recu ? Number(recu) : null,
          fraisAffiches: frais ? Number(frais) : null,
          canal,
          dateReference: reference || null,
          note: "",
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label={t.journal.champs.beneficiaire}>
          <input
            className="champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </Champ>

        <Champ label={t.journal.champs.date} aide={t.journal.champs.dateAide}>
          <input
            className="champ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Champ>

        <Champ label={`${t.journal.champs.montantEnvoye} (${base})`}>
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={envoye}
            onChange={(e) => setEnvoye(e.target.value)}
            required
          />
        </Champ>

        <Champ label={t.journal.champs.montantVoulu}>
          <div className="flex gap-2">
            <input
              className="champ chiffres"
              type="number"
              min="0"
              step="0.01"
              value={voulu}
              onChange={(e) => setVoulu(e.target.value)}
              required
            />
            <input
              className="champ w-24 uppercase"
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              maxLength={3}
              required
            />
          </div>
        </Champ>

        <Champ
          label={t.journal.champs.montantRecu}
          aide={t.journal.champs.montantRecuAide}
        >
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={recu}
            onChange={(e) => setRecu(e.target.value)}
          />
        </Champ>

        <Champ
          label={t.journal.champs.dateReference}
          aide={t.journal.champs.dateReferenceAide}
        >
          <input
            className="champ"
            type="date"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Champ>

        <Champ
          label={`${t.journal.champs.fraisAffiches} (${base})`}
          aide={t.journal.champs.fraisAffichesAide}
        >
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={frais}
            onChange={(e) => setFrais(e.target.value)}
          />
        </Champ>

        <Champ label={t.journal.champs.canal}>
          <select
            className="champ"
            value={canal}
            onChange={(e) => setCanal(e.target.value as CanalPaiement)}
          >
            {CANAUX.map((c) => (
              <option key={c} value={c}>
                {t.journal.canaux[c]}
              </option>
            ))}
          </select>
        </Champ>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={!valide}>
          {t.journal.enregistrer}
        </Button>
        <Button type="button" variant="ghost" onClick={onAnnuler}>
          {t.journal.annuler}
        </Button>
      </div>
    </form>
  );
}

function Champ({
  label,
  aide,
  children,
}: {
  label: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {aide && (
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {aide}
        </span>
      )}
    </label>
  );
}
```

- [ ] **Step 2 : ajouter la classe `.champ`**

`globals.css` ne définit aujourd'hui que `.recu` et `.registre` — `.champ` est à créer.
L'ajouter à côté de `.registre` :

```css
/* Un champ de saisie : filet bas seulement, comme le reste des registres. */
.champ {
  @apply mt-1 w-full border-b border-border bg-transparent py-1.5 text-sm
         outline-none focus-visible:border-primary;
}
```

- [ ] **Step 3 : vérifier compilation et build**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur, route `/journal` présente dans la sortie

- [ ] **Step 4 : commit**

```bash
git add src/app/journal/page.tsx src/app/globals.css
git commit -m "feat(journal): écran de saisie et de revue des paiements passés"
```

---

### Task 10 : la page d'accueil devient le portefeuille

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `resumerPortefeuille` (Task 4), `lireJournal` (Task 6), `t.portefeuille.*` (Task 8).

La liste « à payer bientôt » existante est conservée telle quelle et descend sous le résumé. On n'affiche jamais de zéros qui ressembleraient à des mesures : sans paiement enregistré, l'état vide invite à en saisir un.

- [ ] **Step 1 : charger le journal et calculer le résumé**

Dans `src/app/page.tsx`, ajouter aux imports :

```tsx
import { resumerPortefeuille } from "@/lib/journal";
import { lireJournal } from "@/lib/stockage";
import type { PaiementPasse } from "@/lib/types";
```

Ajouter l'état et le chargement à côté de ceux du profil :

```tsx
const [journal, setJournal] = useState<PaiementPasse[]>([]);
useEffect(() => {
  lireJournal().then(setJournal);
}, []);
```

Étendre la liste de devises passée à `useMarches` pour couvrir aussi celles du journal, afin que le résumé dispose des séries :

```tsx
const devises = [
  ...new Set([
    ...beneficiaires.map((b) => b.devise),
    ...journal.map((p) => p.devise),
  ]),
];
```

Calculer le résumé à partir des séries chargées :

```tsx
const series = Object.fromEntries(
  Object.entries(marches)
    .filter(([, m]) => m.serie)
    .map(([d, m]) => [d, m.serie!]),
);
const portefeuille = resumerPortefeuille(journal, series);
```

- [ ] **Step 2 : rendre le bloc portefeuille**

Insérer avant la liste des bénéficiaires, après le titre de page :

```tsx
<section className="mt-10">
  <div className="flex flex-wrap items-baseline justify-between gap-4">
    <h2 className="font-heading text-2xl font-semibold">
      {t.portefeuille.titre}
    </h2>
    <span className="text-sm text-muted-foreground">
      {t.portefeuille.periode}
    </span>
  </div>

  {portefeuille.n === 0 ? (
    <div className="mt-4 max-w-2xl">
      <p className="font-medium">{t.portefeuille.vide.titre}</p>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        {t.portefeuille.vide.corps}
      </p>
      <Link
        href="/journal"
        className="mt-3 inline-block text-sm underline underline-offset-4"
      >
        {t.portefeuille.vide.action}
      </Link>
    </div>
  ) : (
    <>
      <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
        {t.portefeuille.intro}
      </p>

      <dl className="registre mt-6 border-y border-border">
        <ChiffreCle
          terme={t.portefeuille.volume}
          valeur={formaterMontant(portefeuille.volume, base, 0)}
          detail={t.portefeuille.volumeDetail(portefeuille.n)}
        />
        <ChiffreCle
          terme={t.portefeuille.frais}
          valeur={formaterMontant(portefeuille.frais, base, 0)}
          detail={t.portefeuille.fraisDetail(
            formaterPourcentage(portefeuille.fraisPct),
          )}
          aide={t.portefeuille.fraisAide}
        />
        <ChiffreCle
          terme={t.portefeuille.impact}
          valeur={formaterMontant(portefeuille.impactTaux, base, 0)}
          detail={t.portefeuille.impactDetail}
          aide={t.portefeuille.impactAide}
        />
      </dl>

      {portefeuille.devises.some((d) => !d.complet) && (
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          {t.portefeuille.incomplet}
        </p>
      )}
      {portefeuille.ignores > 0 && (
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t.portefeuille.ignores(portefeuille.ignores)}
        </p>
      )}

      <h3 className="mt-8 font-heading text-lg font-semibold">
        {t.portefeuille.parDevise}
      </h3>
      <ul className="registre mt-3 border-y border-border text-sm">
        {portefeuille.devises.map((d) => (
          <li
            key={d.devise}
            className="flex flex-wrap justify-between gap-x-8 gap-y-1 py-3"
          >
            <span className="chiffres">
              {d.devise} · {t.portefeuille.volumeDetail(d.n)} ·{" "}
              {formaterMontant(d.volume, base, 0)}
            </span>
            <span className="chiffres text-muted-foreground">
              {formaterMontant(d.frais, base, 0)} (
              {formaterPourcentage(d.fraisPct)})
            </span>
          </li>
        ))}
      </ul>
    </>
  )}
</section>

<h2 className="mt-14 font-heading text-2xl font-semibold">
  {t.portefeuille.aPayer}
</h2>
```

Ajouter le composant local en bas du fichier :

```tsx
/** Une ligne de chiffre clé : le montant d'abord, le pourcentage ensuite et en gris. */
function ChiffreCle({
  terme,
  valeur,
  detail,
  aide,
}: {
  terme: string;
  valeur: string;
  detail: string;
  aide?: string;
}) {
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <dt className="font-medium">{terme}</dt>
        <dd className="flex items-baseline gap-3">
          <span className="chiffres text-lg">{valeur}</span>
          <span className="chiffres text-sm text-muted-foreground">
            {detail}
          </span>
        </dd>
      </div>
      {aide && (
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {aide}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3 : vérifier compilation et build**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur

- [ ] **Step 4 : commit**

```bash
git add src/app/page.tsx
git commit -m "feat(portefeuille): vue de trésorerie en tête de la page d'accueil"
```

---

### Task 11 : le comparateur en tableau

**Files:**
- Create: `src/components/comparateur.tsx`

**Interfaces:**
- Consumes: `CoutStrategie`, `CleStrategie` de `@/lib/types` ; `t.paiement.strategies.*` (bloc existant + les quatre clés de la Task 8) et `t.paiement.decision.bouton`.
- Produces: `<Comparateur strategies={CoutStrategie[]} base={string} moinsChere={CleStrategie} onNoter={(cle: CleStrategie) => void} />`.

Quatre blocs empilés ne se comparent pas : les coûts doivent tomber dans une même colonne. La prose actuelle n'est pas supprimée, elle passe sous le pli de chaque ligne.

- [ ] **Step 1 : écrire le composant**

Créer `src/components/comparateur.tsx` :

```tsx
"use client";

import { Fragment, useState } from "react";

import { useT } from "@/i18n";
import { formaterMontant } from "@/lib/format";
import type { CleStrategie, CoutStrategie } from "@/lib/types";

/**
 * Le comparateur.
 *
 * L'ordre des lignes reste celui du raisonnement — ce que tu fais aujourd'hui,
 * puis les alternatives — et jamais un tri par prix : classer transformerait un
 * comparateur en recommandation. La moins chère est SIGNALÉE, pas remontée.
 */
export function Comparateur({
  strategies,
  base,
  moinsChere,
  onNoter,
}: {
  strategies: CoutStrategie[];
  base: string;
  moinsChere: CleStrategie;
  onNoter: (cle: CleStrategie) => void;
}) {
  const t = useT();
  const s = t.paiement.strategies;
  const [depliee, setDepliee] = useState<CleStrategie | null>(null);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="py-2 font-normal">
              {s.colonneOption}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {s.colonneCout}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {s.colonneCertitude}
            </th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((option) => {
            const texte = s[option.cle];
            const ouverte = depliee === option.cle;
            return (
              <Fragment key={option.cle}>
                <tr className="border-b border-border align-baseline">
                  <th scope="row" className="py-4 pr-4 text-left font-medium">
                    {texte.nom}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {texte.court}
                    </span>
                    {option.cle === moinsChere && (
                      <span className="mt-1 block text-xs font-normal text-primary">
                        {s.moinsChere}
                      </span>
                    )}
                  </th>
                  <td className="py-4 text-right">
                    <span className="chiffres">
                      {formaterMontant(option.coutCentral, base, 0)}
                    </span>
                    {!option.certain && (
                      <span className="chiffres block text-xs text-muted-foreground">
                        {s.plage(
                          formaterMontant(option.coutPlancher, base, 0),
                          formaterMontant(option.coutPlafond, base, 0),
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right text-muted-foreground">
                    {option.certain ? s.certain : s.incertainCourt}
                    <button
                      type="button"
                      className="mt-1 block w-full text-right text-xs underline underline-offset-4"
                      aria-expanded={ouverte}
                      onClick={() => setDepliee(ouverte ? null : option.cle)}
                    >
                      {ouverte ? s.replier : s.deplier}
                    </button>
                  </td>
                </tr>

                {ouverte && (
                  <tr className="border-b border-border">
                    <td colSpan={3} className="py-4">
                      <p className="max-w-2xl leading-relaxed">
                        {texte.explication}
                      </p>
                      <p className="mt-2 max-w-2xl leading-relaxed">
                        + {texte.pour}
                      </p>
                      <p className="mt-1 max-w-2xl leading-relaxed">
                        − {texte.contre}
                      </p>
                      <dl className="registre mt-4 max-w-md border-y border-border">
                        {option.lignes.map((l) => (
                          <div
                            key={l.cle}
                            className="flex justify-between gap-6 py-2"
                          >
                            <dt className="text-muted-foreground">
                              {s.postes[l.cle]}
                            </dt>
                            <dd className="chiffres">
                              {formaterMontant(l.montant, base, 0)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {option.nombreTransferts > 1 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {s.transferts(option.nombreTransferts)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="mt-3 text-xs underline underline-offset-4"
                        onClick={() => onNoter(option.cle)}
                      >
                        {t.paiement.decision.bouton}
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

Toutes les clés utilisées ici existent déjà dans `paiement.strategies`, sauf les quatre
ajoutées en Task 8 (`moinsChere`, `deplier`, `replier`, `incertainCourt`). Le bouton
d'enregistrement réutilise `t.paiement.decision.bouton` (« Noter cette décision »).

- [ ] **Step 2 : vérifier compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : commit**

```bash
git add src/components/comparateur.tsx
git commit -m "feat(comparateur): tableau comparatif avec détail dépliable par option"
```

---

### Task 12 : le bloc « Votre date »

**Files:**
- Create: `src/components/date-paiement.tsx`

**Interfaces:**
- Consumes: `expositionEntre`, `amplitudeParSemaineDuMois`, `PaquetAmplitude` (Tasks 1–2) ; `t.paiement.date.*` (Task 8).
- Produces: `<DatePaiement serie3ans={SerieTaux | null} stats={StatsVolatilite} datePaiement={string} montantCible={number} taux={number} base={string} />`.

- [ ] **Step 1 : écrire le composant**

Créer `src/components/date-paiement.tsx` :

```tsx
"use client";

import { useT } from "@/i18n";
import {
  amplitudeParSemaineDuMois,
  expositionEntre,
} from "@/lib/calendrier";
import { formaterDate, formaterMontant, formaterNombre } from "@/lib/format";
import type { SerieTaux, StatsVolatilite } from "@/lib/types";

/**
 * Est-ce que ma date est un bon choix ?
 *
 * La réponse ne parle jamais du sens dans lequel ira le taux. Elle parle de
 * l'incertitude que l'utilisateur achète en attendant, des jours de dérive
 * qu'il subit sans les avoir choisis, et de l'agitation habituelle de cette
 * semaine du mois. Trois faits mesurables, zéro prédiction.
 */
export function DatePaiement({
  serie3ans,
  stats,
  datePaiement,
  montantCible,
  taux,
  base,
}: {
  serie3ans: SerieTaux | null;
  stats: StatsVolatilite;
  datePaiement: string;
  montantCible: number;
  taux: number;
  base: string;
}) {
  const t = useT();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const exposition = expositionEntre(
    aujourdhui,
    datePaiement,
    montantCible,
    taux,
    stats,
  );

  const semaine = Math.min(
    5,
    Math.floor((Number(datePaiement.slice(8, 10)) - 1) / 7) + 1,
  );
  const paquets = serie3ans ? amplitudeParSemaineDuMois(serie3ans) : [];
  const paquet = paquets.find((p) => p.cle === semaine);

  return (
    <section className="mt-12">
      <h2 className="font-heading text-2xl font-semibold">
        {t.paiement.date.titre}
      </h2>

      <p className="mt-3 max-w-3xl leading-relaxed">
        {exposition.suffisant
          ? t.paiement.date.exposition(
              exposition.jours,
              formaterMontant(exposition.montant, base, 0),
            )
          : t.paiement.date.expositionCourte}
      </p>

      {exposition.decalageJours > 0 && (
        <p className="mt-3 max-w-3xl border-l-2 border-statut-jaune pl-4 leading-relaxed">
          {t.paiement.date.decalage(
            formaterDate(datePaiement),
            formaterDate(exposition.dateEffective),
            exposition.decalageJours,
          )}
        </p>
      )}

      <h3 className="mt-8 font-heading text-lg font-semibold">
        {t.paiement.date.semaine.titre}
      </h3>
      <p className="mt-2 max-w-3xl leading-relaxed">
        {!serie3ans || paquets.every((p) => p.n === 0)
          ? t.paiement.date.semaine.insuffisant
          : !paquet?.distinct
            ? t.paiement.date.semaine.indistincte
            : paquet.ratio >= 1
              ? t.paiement.date.semaine.agitee(formaterNombre(paquet.ratio, 1))
              : t.paiement.date.semaine.calme(
                  formaterNombre(1 / paquet.ratio, 1),
                )}
      </p>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t.paiement.date.nonPrediction}
      </p>
    </section>
  );
}
```

- [ ] **Step 2 : ajouter `formaterNombre`**

`format.ts` expose `formaterMontant`, `formaterMontantSigne`, `formaterTaux`,
`formaterPourcentage`, `formaterEntier`, `formaterDate` et `formaterHorodatage` — aucun ne
rend un nombre nu. L'ajouter à côté de `formaterPourcentage` :

```ts
/** Un nombre nu, sans devise ni pourcentage. Sert aux ratios du calendrier. */
export function formaterNombre(valeur: number, decimales = 1): string {
  return new Intl.NumberFormat(localeActive(), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur);
}
```

- [ ] **Step 3 : vérifier compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 4 : commit**

```bash
git add src/components/date-paiement.tsx src/lib/format.ts
git commit -m "feat(calendrier): bloc « Votre date » — exposition, report de séance, amplitude"
```

---

### Task 13 : restructurer la page détail

**Files:**
- Modify: `src/app/paiement/[id]/detail.tsx`

**Interfaces:**
- Consumes: `<Comparateur>` (Task 11), `<DatePaiement>` (Task 12), `margeObservee` / `hypothesesCalibrees` (Task 5), `lireJournal` (Task 6), `derniersJours` / `JOURS_STATISTIQUES` (Task 7), `t.paiement.vosChiffres.*` (Task 8).

- [ ] **Step 1 : charger le journal et calibrer**

Ajouter aux imports de `detail.tsx` :

```tsx
import { Comparateur } from "@/components/comparateur";
import { DatePaiement } from "@/components/date-paiement";
import { hypothesesCalibrees, margeObservee } from "@/lib/journal";
import { derniersJours, JOURS_STATISTIQUES } from "@/lib/marche";
import { lireJournal } from "@/lib/stockage";
import type { PaiementPasse } from "@/lib/types";
```

Ajouter l'état :

```tsx
const [journal, setJournal] = useState<PaiementPasse[]>([]);
useEffect(() => {
  lireJournal().then(setJournal);
}, []);
```

Découper la série en deux fenêtres et calibrer les hypothèses :

```tsx
const serie3ans = marche?.serie ?? null;
const serieStats = serie3ans ? derniersJours(serie3ans, JOURS_STATISTIQUES) : null;
const stats = serieStats
  ? calculerVolatilite(serieStats, JOURS_PAR_FREQUENCE[b.frequence])
  : null;

const marge = serie3ans
  ? margeObservee(journal, serie3ans, b.devise, "spot")
  : null;
const hypotheses = marge
  ? hypothesesCalibrees(profil.hypotheses, marge, coutBrut)
  : profil.hypotheses;
```

où `coutBrut` est le coût au taux du jour déjà calculé dans le composant (`coutAuTauxDuJour(b.montant, taux)`). **Remplacer partout ailleurs dans le fichier `profil.hypotheses` par `hypotheses`**, sans quoi la calibration serait calculée mais pas utilisée.

- [ ] **Step 2 : remonter le bloc « Vos chiffres » et l'étiqueter**

Déplacer le bloc d'édition des hypothèses (actuellement en bas, sous le titre `t.paiement.hypotheses.titre`) juste après l'en-tête de la personne, et ajouter au-dessus la ligne de provenance :

```tsx
<p className="mt-2 text-sm text-muted-foreground">
  {marge
    ? t.paiement.vosChiffres.mesure(marge.n, `${base} → ${b.devise}`)
    : t.paiement.vosChiffres.defaut}
</p>
{!marge && (
  <p className="mt-1 text-sm text-muted-foreground">
    {t.paiement.vosChiffres.pourAffiner(
      3 - journal.filter((p) => p.devise === b.devise && p.canal === "spot").length,
    )}
  </p>
)}
```

- [ ] **Step 3 : remplacer les quatre blocs de stratégie par le tableau**

Supprimer le composant local `Strategie` et sa boucle, et rendre à la place :

```tsx
<section className="mt-12">
  <h2 className="font-heading text-2xl font-semibold">
    {t.paiement.strategies.titre}
  </h2>
  <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
    {t.paiement.strategies.intro}
  </p>
  <Comparateur
    strategies={strategies}
    base={base}
    moinsChere={resume.moinsChere}
    onNoter={noter}
  />
</section>
```

où `noter` est la fonction existante d'enregistrement de décision.

- [ ] **Step 4 : insérer le bloc « Votre date » avant le comparateur**

```tsx
{stats && taux && (
  <DatePaiement
    serie3ans={serie3ans}
    stats={stats}
    datePaiement={b.prochainPaiement}
    montantCible={b.montant}
    taux={taux}
    base={base}
  />
)}
```

- [ ] **Step 5 : passer en deux colonnes avec panneau fixe**

Envelopper le contenu :

```tsx
<div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
  <div>{/* colonne principale, contenu existant dans l'ordre défini */}</div>

  <aside className="hidden lg:block">
    <dl className="registre sticky top-8 border-y border-border text-sm">
      {/* taux et sa date, marge observée, exposition, option la moins chère */}
    </dl>
  </aside>
</div>
```

Le panneau réutilise les valeurs déjà calculées — `taux`, `marche.dateTaux`, `marge`, `exposition`, `resume.moinsChere` — et n'introduit aucun calcul nouveau. Il est masqué sous `lg` : sur mobile l'information est déjà dans le flux.

Ordre final de la colonne principale : en-tête → Vos chiffres → résumé `.recu` → Votre date → Vos options → statistiques → crypto → journal des décisions.

- [ ] **Step 6 : vérifier**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: aucune erreur, 72 tests passent

- [ ] **Step 7 : commit**

```bash
git add src/app/paiement/[id]/detail.tsx
git commit -m "feat(detail): deux colonnes, chiffres calibrés en tête, comparateur en tableau"
```

---

### Task 14 : vérification de bout en bout et documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1 : lancer la porte de vérification**

```bash
rm -rf .next && npx vitest run && npm run build
```
Expected: 72 tests passent, build propre, routes `/`, `/journal`, `/donnees`, `/conformite`, `/paiement/[id]`, `/api/taux`, `/api/serie`

- [ ] **Step 2 : piloter l'application dans les deux langues**

Démarrer `npm run dev`, puis parcourir : accueil vide → `/journal` → saisir deux paiements (un avec `montantRecu`, un sans) → vérifier que l'écart s'affiche et que le second porte la mention « au moins » → saisir un troisième → vérifier sur `/paiement/[id]` que l'étiquette passe de « Estimations » à « Mesuré sur vos 3 derniers paiements » → basculer en anglais et refaire le parcours.

Ce que le build ne voit pas se trouve à l'écran : c'est ce pilotage qui a trouvé les cinq bugs de copie de la v2.

- [ ] **Step 3 : vérifier les trois refus explicites**

- Une devise non publiée (NGN) : aucun taux, message dédié, paiement écarté du portefeuille avec `t.portefeuille.ignores`.
- Un corridor sous trois paiements : les hypothèses restent étiquetées « Estimations ».
- Une paire sans semaine distincte : le calendrier affiche « aucune semaine ne se distingue nettement ».

- [ ] **Step 4 : mettre à jour la documentation**

Dans `AGENTS.md`, section Architecture, ajouter `journal.ts` et `calendrier.ts` à la liste des fonctions pures, avec une ligne chacun. Ajouter les écrans `/journal` et le portefeuille. Mettre le compte de tests à jour (« 72 tests »). Ajouter aux lignes rouges : *« Le calendrier mesure des amplitudes, jamais une saisonnalité directionnelle. `PaquetAmplitude` ne porte que des valeurs absolues et un `distinct` conservateur. »*

Dans `README.md`, remplacer « 45 tests » par « 72 tests », et ajouter au bloc « Ce qu'il fait » un paragraphe **Mesurer ce qui s'est vraiment passé** décrivant le journal et la calibration à trois paiements.

- [ ] **Step 5 : commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: journal, calendrier et portefeuille dans AGENTS.md et README"
```

---

## Auto-revue du plan

**Couverture de la spec.** Modèle `PaiementPasse` → Task 3. Coût réel et repli sans `montantRecu` → Task 3. Mesures A et B → Task 4. `margeObservee` et seuil de 3 → Task 5. Stockage Supabase + RLS + repli local → Task 6. Fenêtres 12 mois / 3 ans → Task 7. Amplitude par semaine et par jour, garde-fou, report de séance, exposition → Tasks 1–2. Copie bilingue → Task 8. Écrans `/journal`, `/`, `/paiement/[id]` → Tasks 9, 10, 13. Comparateur en tableau → Task 11. Bloc « Votre date » → Task 12. Vérification et docs → Task 14.

**Écarts assumés, signalés dans les tâches concernées :**
- `amplitudeParSemaineDuMois` prend `(serie)` et non `(serie, fenetreJours)`, et classe des variations quotidiennes plutôt que des fenêtres glissantes (Task 2). Plus honnête et mieux échantillonné.
- L'impact du taux se mesure contre le taux moyen **de la période** et non contre une moyenne pondérée par les paiements, qui serait positive par construction (Task 4).

**Cohérence des types.** `CanalPaiement` est défini une fois (Task 3) et réutilisé Tasks 5, 6, 9. `PaquetAmplitude` défini Task 2, consommé Task 12. `MargeObservee` défini Task 5, consommé Task 13. `Exposition` défini Task 2, consommé Task 12. `ResumePortefeuille` défini Task 4, consommé Task 10. Les fonctions de `volatilite.ts` réutilisées (`percentile`, `variationsQuotidiennes`, `coutAuMouvement`, `coutAuTauxDuJour`) existent toutes et sont exportées.

**Trois références vérifiées dans le dépôt avant l'écriture du plan**, donc plus rien n'est laissé à l'implémenteur : `formaterNombre` n'existe pas et est créé en Task 12 ; `.champ` n'existe pas et est créée en Task 9 ; la clé du bouton de décision est `t.paiement.decision.bouton`. Le bloc `paiement.strategies` fournissant déjà les en-têtes de colonnes, les quatre fiches et les postes de frais, la Task 8 n'y ajoute que quatre clés au lieu de créer un bloc `comparateur` doublon.
