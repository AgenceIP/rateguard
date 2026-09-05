<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RateGuard

Outil de visibilité sur le risque de change pour petites agences de voyage Omra/Hajj à Montréal. MVP hackathon (MuslimHacks 2026, défi *International Trades*). Textes d'interface en français.

## Quatre lignes rouges — ne jamais franchir

1. **Aucune prédiction de taux.** Tout scénario est étiqueté « scénario hypothétique » et présente toujours au moins une direction favorable ET une défavorable. La symétrie est garantie par construction dans `simulerScenarios` (un `flatMap` qui émet `-amplitude` et `+amplitude` à chaque itération) — ne pas la casser en filtrant ou en triant par direction.
2. **Aucun mouvement de fonds.** Pas de paiement, pas de transfert, pas de détention. Outil de calcul et de visibilité uniquement.
3. **Tous les frais sont des estimations**, issues de benchmarks publics — jamais des devis bancaires réels. Ils vivent tous dans `src/lib/benchmarks.ts` et l'interface le dit en clair, pas en petits caractères.
4. **Conformité Sharia : citer AAOIFI Shariah Standard No. 65** (Wa'd) et mentionner explicitement l'existence d'un désaccord savant légitime. Jamais une position unique présentée comme « la » position islamique.

Hors périmètre, même si ça semble utile : authentification, intégration bancaire réelle, recommandation de « meilleur moment pour convertir », bascule multi-contexte (agence / organisme de dons).

## Architecture

- `src/lib/calculs.ts` — toutes les fonctions pures. N'importe ni React, ni réseau, ni localStorage : testable sans mock. Toute nouvelle logique de calcul va ici.
- `src/lib/types.ts` — la convention de signe est documentée en tête de fichier : `mouvementPct` positif = le CAD achète plus de devise cible = favorable à l'agence.
- `src/lib/benchmarks.ts` — les seules constantes de frais, de paliers de volatilité et le peg SAR/USD.
- `src/lib/format.ts` — le seul endroit où l'on arrondit. Locale `fr-CA`.
- `src/i18n/fr.ts` — toute la copie d'interface. Aucune chaîne visible en dur dans le JSX. Pour ajouter l'anglais : créer `en.ts` avec la même forme, changer l'export de `src/i18n/index.ts`.
- `src/app/api/taux/route.ts` — proxy Frankfurter, revalidation 1 h. La BCE ne publie pas le SAR : le taux CAD→SAR est dérivé via CAD→USD × 3,75 (peg saoudien depuis 1986) et le drapeau `viaPegUsd` le dit à l'écran.
- Pas de base de données. `localStorage`, clé `rateguard.forfaits.v1`.

## Vérification

`npm test` (Vitest, 18 tests sur les fonctions pures) puis `npm run build`. Toute fonction ajoutée à `calculs.ts` a au moins un cas normal et un cas limite — le jury demande explicitement la couverture de tests.

## Design

Le produit fabrique une preuve horodatée : la page est un papier avoine, les documents des surfaces plus claires posées dessus. L'accent lapis est délibérément hors de la plage vert/jaune/rouge des statuts pour qu'aucune couleur de marque ne puisse être lue comme un signal. Structure par filets (`.registre`), pas par cartes empilées. Un seul objet orné : le reçu de verrouillage (`.recu`).
