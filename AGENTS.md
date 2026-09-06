<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RateGuard

Outil de visibilité sur le coût et le risque des paiements internationaux, pour
quelqu'un qui gère la paie d'employés ou de contractants dans plusieurs pays sans
formation en finance. MVP hackathon (MuslimHacks 2026, défi *International Trades*).
Interface bilingue français / anglais, le français est la forme de référence.

## Les lignes rouges — ne jamais franchir

1. **Aucune prédiction de direction.** L'outil mesure des **amplitudes** observées sur
   l'historique réel, jamais un sens. Interdit de produire une phrase de la forme
   « envoyez votre argent le [date], le taux sera meilleur ». `calculerVolatilite`
   (`src/lib/volatilite.ts`) ne renvoie que des grandeurs absolues — médiane, p80, pire
   mouvement défavorable, volatilité annualisée — et il n'existe nulle part de champ
   « sens » ou « tendance ». Ne pas en ajouter.
   Utiliser l'historique pour **calibrer une amplitude** est explicitement permis : c'est
   la clarification donnée par l'auteur du défi. Ce qui est interdit, c'est d'extrapoler
   une valeur future.
2. **Aucun mouvement de fonds.** Pas de paiement, pas de transfert, pas de détention.
3. **Tous les frais sont des estimations** tant que l'utilisateur n'a pas saisi les siens.
   Les valeurs par défaut vivent dans `src/lib/hypotheses.ts`, chaque coût est affiché en
   fourchette (`INCERTITUDE_FRAIS`), et l'écran le dit en clair — pas en petits caractères.
   Dès qu'une hypothèse est modifiée, `hypotheses.personnalise` passe à `true` et la
   mention change.
4. **Jamais de chiffre inventé présenté comme actuel.** Si la BCE ne publie pas la devise,
   l'outil refuse d'afficher un taux et le dit (`motif: "devise_non_publiee"`). Si
   l'historique est trop court, `StatsVolatilite.suffisant` passe à `false` et les
   statistiques disparaissent au lieu d'être extrapolées.
5. **Conformité Sharia : citer AAOIFI Shariah Standard No. 65** (*wa'd*) et mentionner
   explicitement le désaccord savant. Jamais une position unique présentée comme « la »
   position islamique. La page `/conformite` présente d'abord les voies **sans instrument**.
6. **Crypto : jamais d'avis juridique.** Chaque fiche pays porte ses sources datées et se
   termine par le renvoi vers un comptable ou un avocat local. Un pays absent du corpus
   reçoit `statut: "non_verifie"`, pas une valeur optimiste par défaut.

Hors périmètre : authentification, intégration bancaire réelle, exécution d'un transfert,
recommandation d'un moment pour convertir.

## Architecture

Fonctions pures, testables sans mock (n'importent ni React, ni réseau, ni `localStorage`) :

- `src/lib/volatilite.ts` — statistiques sur la série de taux réelle. Rendements
  logarithmiques, écart-type d'échantillon (n−1), annualisation ×√252, jours civils →
  séances ×5/7, fenêtres glissantes chevauchantes, percentile par interpolation linéaire.
  `risqueDAttendre` chiffre en dollars ce que coûte l'attente ; `coutAuMouvement` traduit
  une amplitude en montant.
- `src/lib/strategies.ts` — les quatre chemins comparés (`spot`, `forward`, `etalement`,
  `multidevise`), chacun avec sa ventilation de frais ligne à ligne, puis
  `comparerStrategies` et `resumerPaiement` (la phrase en une ligne, sans jargon).
  L'étalement applique une réduction en 1/√k, énoncée comme une **borne optimiste**.
- `src/lib/hypotheses.ts` — les seules constantes de frais, `INCERTITUDE_FRAIS`,
  `TRANSFERTS_ETALEMENT` et les instructions SWIFT `SHA` / `OUR` / `BEN` (champ 71A) : c'est
  ce qui transforme « les frais de correspondant sont inconnaissables » en un choix.
- `src/lib/types.ts` — le vocabulaire commun ; `JOURS_PAR_FREQUENCE` fait le lien entre le
  rythme de paie de l'utilisateur et la fenêtre sur laquelle les statistiques sont mesurées.
- `src/lib/format.ts` — le seul endroit où l'on arrondit, et le seul qui connaît la locale.

Le reste :

- `src/lib/marche.ts` — couche de données client. `obtenirMarche` mémoïse une paire par
  session et charge taux + série d'un an en parallèle ; un taux sans historique reste
  utilisable. `useMarches` sert la page d'accueil.
- `src/lib/stockage.ts` — Supabase si `NEXT_PUBLIC_SUPABASE_URL` et `…_ANON_KEY` existent,
  sinon `localStorage` (`rateguard.profil.v2`, `rateguard.decisions.v2`). Aucun compte :
  l'identifiant d'espace opaque `rateguard.espace.v1` part en en-tête `x-espace` et c'est
  sur lui que porte la RLS (`supabase/schema.sql`).
- `src/data/crypto-paie.ts` — 13 fiches pays bilingues, chacune avec ses sources et
  `VERIFIE_LE`. Du contenu sourcé, pas de la mémoire de modèle.
- `src/data/pays.ts` — correspondance pays → devise et `DEVISES_NON_PUBLIEES`. Les noms
  affichés viennent d'`Intl.DisplayNames`, jamais d'une table écrite à la main.
- `src/app/api/taux/route.ts` et `src/app/api/serie/route.ts` — proxys Frankfurter
  (`api.frankfurter.dev/v1`), revalidation 1 h. Une devise non publiée renvoie 404 : c'est
  attendu, on le remonte tel quel.
- `src/i18n/fr.ts` et `en.ts` — toute la copie, aucune chaîne visible en dur dans le JSX.
  `Traductions = typeof fr`, donc une clé oubliée dans `en.ts` casse la compilation.
  Trois règles de rédaction, énoncées en tête de `fr.ts` : tout terme financier est glosé
  sur place, les montants passent avant les pourcentages, aucun chiffre n'est donné comme
  une certitude. `commun.deuxPoints` porte l'espace insécable avant le deux-points en
  français et son absence en anglais.
- `src/components/lexique.tsx` — les définitions sont **affichées**, pas cachées derrière
  un survol : une infobulle n'existe ni au clavier ni au doigt.

## Vérification

`npm test` (Vitest, 45 tests sur `volatilite.ts` et `strategies.ts`) puis `npm run build`.
Toute fonction ajoutée à `volatilite.ts` ou `strategies.ts` a au moins un cas normal et un
cas limite — le jury demande explicitement la couverture de tests.

Ce que le build ne voit pas se vérifie en pilotant l'application : les quatre derniers bugs
de copie française (préposition en double, deux-points anglais, fourchette mal composée)
n'ont été trouvés qu'à l'écran.

## Design

La page est un papier avoine, les documents sont des surfaces plus claires posées dessus.
L'accent lapis est délibérément hors de la plage vert/jaune/rouge des statuts, pour qu'aucune
couleur de marque ne puisse être lue comme un signal. Structure par filets (`.registre`),
pas par cartes empilées. Un seul objet orné : le résumé en une phrase (`.recu`).
