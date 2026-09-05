# RateGuard

Outil de visibilité sur le **risque de change** pour les petites agences de voyage Omra/Hajj.

Une agence encaisse des CAD auprès de ses pèlerins aujourd'hui, et paie ses fournisseurs
saoudiens en SAR des semaines ou des mois plus tard. Entre les deux, le taux bouge — et
personne ne le documente. RateGuard fabrique une **preuve horodatée** du taux au moment de
l'encaissement, chiffre le coût réel du transfert et montre ce que deviendrait la marge sous
différents scénarios.

**Essayer : https://rateguard-eight.vercel.app**

Projet réalisé pour **MuslimHacks 2026**, défi *International Trades*.

## Ce que l'outil ne fait pas

Ces limites sont volontaires et vérifiables dans le code :

- **Aucune prédiction de taux.** Chaque scénario est étiqueté « scénario hypothétique » et les
  directions favorable et défavorable sont générées par paires, dans la même boucle
  (`simulerScenarios`, `src/lib/calculs.ts`). Il est structurellement impossible de produire une
  sortie directionnelle.
- **Aucun mouvement de fonds.** Pas de paiement, pas de transfert, pas de détention. Calcul et
  visibilité uniquement.
- **Tous les frais sont des estimations** issues de repères publics du secteur
  (`src/lib/benchmarks.ts`) — jamais des devis bancaires réels. L'interface le dit en clair.
- **Conformité Sharia** : la page dédiée cite la norme AAOIFI n° 65 (*Wa'd*) et indique
  explicitement que les savants ne sont pas unanimes. Aucune position n'est présentée comme
  « la » position islamique.

## Données

- Taux de référence de la Banque centrale européenne via [Frankfurter](https://frankfurter.dev),
  proxifiés par `/api/taux` (revalidation 1 h).
- La BCE ne publie pas le riyal saoudien : CAD→SAR est dérivé de CAD→USD × 3,75 (peg saoudien
  depuis 1986). Le chemin emprunté est affiché à l'écran, pas masqué.
- Pas de base de données. Les forfaits restent dans le `localStorage` du navigateur.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 18 tests sur les fonctions pures
npm run build
```

`src/lib/calculs.ts` ne dépend ni de React, ni du réseau, ni du navigateur : toute la logique
financière est testable sans aucun mock.

## Pile

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui sur Base UI ·
Recharts · Vitest
