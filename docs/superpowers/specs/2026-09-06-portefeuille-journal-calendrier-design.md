# RateGuard v3 — portefeuille, journal des paiements, calendrier d'amplitude

Design validé le 6 septembre 2026. Remplace le cadrage « calculette par paiement »
par une **vue de trésorerie** : l'outil doit donner à une entreprise une vue claire
sur son portefeuille de devises, lui dire ce que les transferts lui coûtent
réellement, et l'aider à choisir entre des options — sans jamais prédire un taux.

## Problème

La v2 estime. Elle affiche des fourchettes larges construites sur des ordres de
grandeur publics, parce qu'elle ne connaît pas la banque de l'utilisateur. Trois
conséquences :

1. Les chiffres restent des hypothèses, et l'utilisateur ne peut pas les vérifier.
2. L'outil ne s'améliore pas avec le temps. Le dixième paiement est calculé comme
   le premier.
3. Rien ne permet de répondre à « est-ce que j'ai vraiment économisé ». Or c'est la
   seule question qui compte pour quelqu'un qui doit justifier l'usage de l'outil.

La v3 corrige les trois avec une seule idée : **l'utilisateur saisit ses paiements
passés, et ces données réelles remplacent progressivement les estimations.**

## Ce qui ne change pas

Les lignes rouges de `AGENTS.md` tiennent intégralement. En particulier :

- Aucune sortie directionnelle n'est représentable. Le calendrier mesure des
  **amplitudes**, jamais un sens. Voir « Calendrier » plus bas pour le détail de
  ce qui est explicitement refusé.
- Aucun chiffre inventé présenté comme actuel.
- Tous les frais restent des estimations **tant qu'ils ne sont pas mesurés**, et
  l'étiquette à l'écran change quand ils le deviennent.

## Modèle de données

### `PaiementPasse`

Ce qu'on demande est ce qui se lit sur un relevé bancaire. Rien d'autre.

| Champ | Obligatoire | Rôle |
|---|---|---|
| `date` | oui | Date d'exécution — le jour où l'argent est parti. Sert à récupérer le taux de référence. |
| `montantEnvoye` | oui | Ce qui a été débité, en devise de base. |
| `montantVoulu` | oui | Ce qu'on voulait faire parvenir, en devise cible. |
| `devise` | oui | Devise cible. |
| `canal` | oui | `spot` / `forward` / `etalement` / `multidevise` / `autre`. Permet de comparer les fournisseurs entre eux. |
| `montantRecu` | **non** | Ce qui est réellement arrivé. Débloque le coût tout compris. |
| `dateReference` | **non** | Date à laquelle le montant était connu (facture, début de période). Débloque le coût de l'attente. |
| `fraisAffiches` | non | Ligne de frais visible au relevé, si elle existe. Appoint pédagogique, pas le calcul principal. |
| `beneficiaireId` | non | Rattachement à une fiche. Nullable : le journal doit accepter un paiement à quelqu'un qui ne figure plus dans la liste. |
| `beneficiaireNom` | oui | Toujours stocké en clair pour que la ligne reste lisible après suppression de la fiche. |

Stockage : table Supabase `paiements_passes` avec la même RLS par `espace` que le
reste, et repli `localStorage` sous `rateguard.journal.v1`.

## Calcul

### Le coût réel d'un paiement

Une seule soustraction porte tout le sujet.

```
taux de référence BCE au jour de l'exécution                        r
ce qui aurait dû arriver au taux de référence      montantEnvoye × r
ce qui est arrivé                                        montantRecu
écart, ramené en devise de base    montantEnvoye − montantRecu / r
```

Cet écart capture **d'un coup** la marge cachée dans le taux, les frais fixes et
les prélèvements des banques correspondantes. L'utilisateur n'a rien à démêler.

Si `montantRecu` est absent, le calcul se fait contre `montantVoulu` et le
résultat est marqué `complet: false`. L'interface dit alors explicitement qu'il
manque la part prélevée sur le trajet, et que le coût réel est **au moins** celui
affiché. Jamais une estimation silencieuse à la place.

### Séparer les frais de l'effet du taux

Deux postes que l'utilisateur pilote différemment : les frais se choisissent
(fournisseur, instruction SWIFT), le taux ne se choisit pas — seule l'exposition
se choisit. Les mélanger rend l'outil inactionnable.

**A — contre votre propre moyenne (par défaut, aucune saisie en plus).**
Pour une devise, on calcule le taux de référence moyen pondéré par les volumes sur
la période, puis pour chaque paiement l'écart entre le taux de son jour et cette
moyenne. Le cumul répond à : *« le calendrier de vos versements vous a coûté 210 $
de plus que si tout était parti au taux moyen de l'année. »*

C'est une description du passé, pas une recommandation : on ne dit jamais quand il
aurait fallu payer, seulement que la répartition a eu un coût mesurable.

**B — contre la date de référence (si `dateReference` est renseignée).**
Écart entre le taux du jour où le montant était connu et le taux du jour de
l'exécution, multiplié par le montant. Répond à : *« attendre 11 jours vous a coûté
74 $ sur ce paiement. »*

B ferme la boucle du produit : la page détail annonce à l'avance « attendre met
167 $ en jeu », et le journal permet de vérifier après coup ce que l'attente a
réellement coûté. C'est ce qui rend l'outil vérifiable au lieu de simplement
crédible.

### `margeObservee` — l'estimation devient une mesure

Dès **3 paiements** enregistrés sur un couple (devise, canal), `margeObservee`
renvoie la marge médiane observée et le nombre d'observations. Les fonctions de
`strategies.ts` consomment alors cette valeur au lieu de `HYPOTHESES_DEFAUT`, et
l'interface change d'étiquette : « estimation » devient « mesuré sur vos N
virements CAD→USD ».

Sous 3 observations, on garde la valeur par défaut. La médiane, pas la moyenne :
un seul virement aberrant (montant minuscule, frais fixes qui dominent) ne doit
pas déplacer la calibration.

## Calendrier

### Ce que le calendrier ne fait pas

Il ne dit pas quelle semaine est « meilleure ». Une carte de saisonnalité
directionnelle — « le CAD est plus fort en semaine 32 » — est la ligne rouge du
défi déguisée en statistique, et sur des données de change ces motifs sont presque
toujours du bruit non reproductible. Le refus est écrit à l'écran, pas seulement
dans le code : c'est un argument de différenciation, pas une limitation à cacher.

### Ce qu'il fait

1. **Amplitude par semaine du mois.** Pour chaque paquet (semaines 1 à 5), le
   mouvement absolu médian, exprimé en ratio du mouvement médian global.
   « La semaine 4 a bougé 1,4× une semaine ordinaire. » Non directionnel : une
   semaine agitée est risquée dans les deux sens.
2. **Amplitude par jour de semaine.** Même principe.
3. **Décalage de séance.** Une date tombant une fin de semaine ou un jour sans
   publication BCE est reportée à la séance suivante. Le virement daté d'un samedi
   part le lundi : deux jours de dérive non choisis. C'est un fait de calendrier,
   pas une prévision.
4. **Jours d'exposition.** Entre deux dates, le nombre de jours et leur valeur en
   dollars via `risqueDAttendre`.

### Fenêtres d'observation

- **Statistiques d'amplitude en tête de page détail : 12 mois.** Le régime récent
  est ce qui décrit le mieux l'amplitude à venir.
- **Calendrier : 3 ans.** Cinq paquets de semaines sur un an ne laissent que ~50
  observations par paquet, trop peu pour affirmer quoi que ce soit ; trois ans
  donnent ~150. Un seul appel API supplémentaire.

Les deux fenêtres sont étiquetées à l'écran. On ne laisse jamais croire qu'un
chiffre porte sur une période qu'il ne couvre pas.

### Garde-fou de significativité

Si aucun paquet ne se détache — ratio compris entre 0,8 et 1,25, ou moins de 40
observations — le calendrier affiche **« aucune semaine ne se distingue
nettement »** au lieu de désigner un gagnant.

C'est un seuil heuristique, pas un test statistique formel, et le code le dit en
commentaire avec son plafond. Sans ce garde-fou, le calendrier finit
mécaniquement par pointer du bruit, ce qui est exactement le reproche qu'un juge
qui creuse adresserait au produit.

## Modules

Deux nouveaux fichiers purs, sans React, sans réseau, sans `localStorage` —
testables sans mock comme `volatilite.ts` et `strategies.ts`.

### `src/lib/journal.ts`

- `coutReel(paiement, tauxReference)` → `{ ecart, ecartPct, complet }`
- `resumerPortefeuille(paiements, taux)` → cumuls globaux et par devise
- `impactDuTaux(paiements, taux)` → mesure A
- `coutDeLAttente(paiement, serie)` → mesure B, `null` sans `dateReference`
- `margeObservee(paiements, devise, canal)` → `{ pct, n } | null`

### `src/lib/calendrier.ts`

- `amplitudeParSemaineDuMois(serie, fenetreJours)` → paquets avec `ratio`, `n`, `distinct`
- `amplitudeParJourDeSemaine(serie)`
- `prochaineSeance(date, serie)` → date effective d'exécution
- `expositionEntre(dateA, dateB, stats, montant)` → jours et valeur

## Écrans

### `/` — portefeuille

Trois chiffres en tête, sur 12 mois glissants : volume payé à l'étranger, frais et
marges (en dollars puis en % du volume), effet du calendrier contre le taux moyen.
Puis la ventilation par devise, puis la liste « à payer bientôt » (l'actuelle).

État vide : les trois chiffres sont remplacés par une invitation à saisir un
premier paiement passé. On n'affiche pas de zéros qui ressembleraient à des
mesures.

### `/journal` — les paiements passés

Tableau avec, sur chaque ligne, l'écart calculé contre la référence du jour et le
canal utilisé. C'est là que se lit la réponse à « ai-je vraiment économisé » : les
virements de janvier à 3,1 % en face de ceux d'août à 2,2 %. Formulaire de saisie
avec les deux champs optionnels clairement présentés comme ce qu'ils sont — ce qui
débloque un calcul plus complet, pas des cases à cocher de plus.

### `/paiement/[id]` — restructurée

Deux colonnes sur grand écran. La colonne de droite, aujourd'hui vide sur toute la
hauteur, devient un panneau fixe : taux et sa date, marge observée, jours
d'exposition, option la moins chère.

Ordre de la colonne principale :

1. En-tête (personne, montant, échéance)
2. **Vos chiffres** — marge et frais réels, mesurés ou par défaut, ajustables sur
   place. Remontés en haut : ils déterminent tous les nombres affichés en dessous,
   les enterrer sous la décision était une erreur de la v2.
3. Le résumé en une phrase (`.recu`)
4. **Votre date** — exposition, décalage de séance, amplitude de la semaine
5. **Vos options** — tableau comparatif
6. Statistiques, corridor crypto, journal des décisions (secondaire)

Le comparateur passe de quatre blocs empilés à un **tableau** : une ligne par
option, les coûts alignés dans une colonne, la moins chère marquée. La prose
actuelle (ventilation, pour, contre) n'est pas supprimée, elle passe sous le pli
de chaque ligne. On voit la réponse d'abord, la profondeur reste accessible.

## Vérification

- Tests unitaires sur `journal.ts` et `calendrier.ts` : cas normal et cas limite
  pour chaque fonction exportée, comme l'exige `AGENTS.md`. En particulier :
  paiement sans `montantRecu`, corridor sous 3 observations, paquet de semaines
  sous le seuil de significativité, date tombant une fin de semaine.
- `npm test` puis `npm run build`.
- Pilotage de l'application en français et en anglais : c'est ce qui a trouvé tous
  les bugs de copie de la v2, le build ne les voit pas.

## Hors périmètre

Import automatique de relevés bancaires (OFX, CSV, API bancaire), multi-utilisateur,
authentification, et toute forme de saisonnalité directionnelle.
