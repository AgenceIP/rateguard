# RateGuard

Ce qu'un paiement international **coûte vraiment**, et ce qu'il **risque de coûter**, pour
quelqu'un qui paie des employés ou des contractants dans plusieurs pays sans avoir de
formation en finance.

Vous entrez qui vous payez, où, en quelle devise et à quel rythme. RateGuard mesure sur
l'historique réel de combien cette devise a l'habitude de bouger **sur la durée qui sépare
deux de vos paiements**, chiffre en dollars ce que l'attente met en jeu, et compare vos
options côte à côte — frais compris.

> Pour votre paiement de 6 200 $ US dans 21 jours : si vous attendez, le paiement pourrait
> vous coûter environ 167 $ de plus. Si cela vous inquiète, figer le taux aujourd'hui coûte
> environ 71 $ de plus mais supprime complètement ce risque.

**Essayer : https://rateguard-eight.vercel.app** — interface bilingue français / anglais,
bascule dans l'en-tête.

Projet réalisé pour **MuslimHacks 2026**, défi *International Trades*.

## Ce que l'outil ne fait pas

Ces limites sont volontaires et vérifiables dans le code :

- **Il ne prédit aucune direction.** Il ne dira jamais « envoyez votre argent le [date], le
  taux sera meilleur ». Sur quelques semaines, la direction d'un taux de change n'est pas
  prévisible — c'est justement pourquoi l'outil chiffre le risque au lieu de le deviner.
  `calculerVolatilite` (`src/lib/volatilite.ts`) ne renvoie que des **amplitudes** : médiane,
  8ᵉ décile, pire mouvement défavorable observé, volatilité annualisée. Il n'y a nulle part
  de champ « sens » ou « tendance » : la structure de sortie rend la prédiction impossible.
- **Il ne déplace aucun fonds.** Pas de paiement, pas de transfert, pas de détention.
- **Il n'invente aucun chiffre.** Si la Banque centrale européenne ne publie pas la devise,
  l'outil refuse d'afficher un taux et le dit à l'écran. Si l'historique est trop court, les
  statistiques disparaissent au lieu d'être extrapolées.
- **Tous les frais sont des estimations** tant que vous n'avez pas saisi les vôtres. Chaque
  coût est donné en fourchette, et l'écran le dit en clair. Entrez ce que votre banque vous
  facture vraiment et les fourchettes se resserrent.
- **La partie crypto n'est pas un avis juridique.** Chaque fiche pays porte ses sources
  datées et renvoie vers un comptable ou un avocat local. Un pays hors du corpus est marqué
  « non vérifié », pas supposé permissif.

## Ce qu'il fait

**Mesurer.** Pour chaque devise, sur un an d'historique réel : de combien elle bouge
d'habitude sur votre fenêtre de paie, de combien elle bouge dans les mauvaises semaines, et
quel est le pire mouvement défavorable déjà observé. En dollars d'abord, en pourcentage
ensuite.

**Comparer.** Le même paiement par quatre chemins, frais compris et exprimés dans votre
devise : virement bancaire aujourd'hui, contrat à terme (*= taux figé à l'avance*), étalement
en plusieurs versements, compte multi-devises. Chacun avec sa ventilation ligne à ligne, son
avantage et son inconvénient.

**Un levier que votre banque ne vous propose pas.** Chaque virement porte une instruction de
frais SWIFT (champ 71A). Par défaut c'est `SHA` : les banques du trajet se servent au passage
et votre bénéficiaire reçoit un montant que personne ne connaît d'avance. En demandant `OUR`,
vous payez tout et il reçoit le montant exact. La part des frais qu'on dit « impossible à
connaître » ne l'est pas si vous choisissez de la porter.

**Garder une trace.** Chaque décision retenue fige le taux et sa date. Des semaines plus
tard, vous pouvez expliquer votre choix avec ce que vous saviez ce jour-là.

**Mesurer ce qui s'est vraiment passé.** Le journal (`/journal`) compare, paiement par
paiement, ce que vous avez envoyé à ce que votre bénéficiaire a reçu, au taux de référence
du jour — l'écart réel, pas une estimation. Dès trois paiements enregistrés sur le même
trajet, RateGuard remplace la marge estimée par celle que vous payez vraiment, et l'affiche
comme telle (« Mesuré sur vos 3 derniers paiements ») plutôt qu'en silence. Les huit autres
frais restent des estimations affichées en fourchette, et vos propres chiffres, si vous les
saisissez, priment toujours sur la mesure.

## Données

- **Taux** : références de la Banque centrale européenne via
  [Frankfurter](https://frankfurter.dev), proxifiées par `/api/taux` et `/api/serie`
  (revalidation 1 h). Un seul cours par jour ouvrable, vers 16 h HEC — ni fin de semaine ni
  jour férié. La date du cours est toujours affichée, jamais « maintenant ».
- **Devises non publiées** (NGN, PKR, BDT, VND…) : l'outil ne fabrique pas de taux par un
  détour. Il vous demande celui de votre banque et vos frais réels.
- **Statistiques** : calculées à l'exécution sur la série récupérée, jamais mises en cache
  sous forme de constante.
- **Crypto** : 13 fiches pays sourcées et datées (`src/data/crypto-paie.ts`), avec la date de
  dernière vérification affichée.
- **Stockage** : Supabase si les variables d'environnement sont présentes, sinon le
  `localStorage` du navigateur. L'application fonctionne entièrement sans configuration.

La page [D'où viennent les données](https://rateguard-eight.vercel.app/donnees) reprend tout
ça à l'écran, avec le lexique.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 98 tests sur les fonctions pures
npm run build
```

Aucune variable d'environnement n'est nécessaire : sans Supabase, les données restent dans le
navigateur. Pour activer Supabase, exécutez `supabase/schema.sql` dans l'éditeur SQL du projet
puis renseignez :

```bash
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

`src/lib/volatilite.ts`, `src/lib/strategies.ts`, `src/lib/journal.ts` et `src/lib/calendrier.ts`
ne dépendent ni de React, ni du réseau, ni du navigateur : toute la logique financière est
testable sans aucun mock. Le texte visible vit
dans `src/i18n/` — `fr.ts` est la forme de référence et `en.ts` doit la satisfaire, donc une
traduction oubliée ne compile pas.

## Pile

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Vitest
