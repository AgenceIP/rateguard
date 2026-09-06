/**
 * Toute la copie d'interface, en français.
 *
 * Le français est la FORME DE RÉFÉRENCE : `Traductions = typeof fr`, donc une
 * clé oubliée dans `en.ts` casse la compilation au lieu d'afficher un trou.
 *
 * Trois règles de rédaction, imposées par le cahier des charges et à respecter
 * pour toute clé ajoutée ici :
 *   1. aucun terme financier sans son explication immédiate — « taux figé à
 *      l'avance » suit toujours « forward » ;
 *   2. les montants avant les pourcentages, toujours ;
 *   3. aucun chiffre présenté comme une certitude : « entre X et Y »,
 *      « environ », « en moyenne » — jamais « sera ».
 */
export const fr = {
  meta: {
    titre: "RateGuard — ce que vos paiements internationaux coûtent vraiment",
    description:
      "Estimez le coût réel d'un paiement international, mesurez le risque de change sur votre propre rythme de paie et comparez vos options. Aucune prévision de taux.",
  },

  marque: {
    nom: "RateGuard",
    baseline: "Le coût réel de vos paiements à l'étranger",
  },

  langue: { choisir: "Langue de l'interface", fr: "Français", en: "English" },

  nav: {
    accueil: "Paiements",
    journal: "Journal",
    donnees: "D'où viennent les données",
    conformite: "Conformité",
  },

  commun: {
    chargement: "Chargement…",
    enregistrer: "Enregistrer",
    annuler: "Annuler",
    ajouter: "Ajouter",
    supprimer: "Retirer",
    modifier: "Modifier",
    retour: "Retour aux paiements",
    voirDetail: "Voir le détail",
    entre: "entre",
    et: "et",
    environ: "environ",
    aucuneDonnee: "Données insuffisantes",
    /** Deux-points d'énumération : le français prend une espace avant, pas l'anglais. */
    deuxPoints: " : ",
    estimation: "Estimation",
    vosChiffres: "Vos chiffres",
    source: "Source",
    verifieLe: "Vérifié le",
    // Rappelé partout où un chiffre de frais apparaît.
    fraisEstimes:
      "Les frais affichés sont des estimations tirées d'ordres de grandeur publics, pas des devis de votre fournisseur.",
  },

  // Chaque terme financier employé à l'écran est défini ici, et l'interface
  // affiche la définition à côté du terme — jamais dans un glossaire séparé
  // que personne n'ouvre.
  lexique: {
    taux: {
      terme: "Taux de change",
      definition:
        "Combien d'unités de la devise étrangère vous obtenez pour un dollar canadien.",
    },
    marge: {
      terme: "Marge dans le taux",
      definition:
        "La part que votre banque garde en vous donnant un taux moins bon que celui du marché. Elle n'apparaît sur aucun relevé.",
    },
    volatilite: {
      terme: "Volatilité",
      definition:
        "L'ampleur habituelle des mouvements d'une devise. Elle dit de combien ça bouge, jamais dans quel sens.",
    },
    forward: {
      terme: "Contrat à terme",
      definition:
        "Un taux figé à l'avance : vous convenez aujourd'hui du taux qui s'appliquera au paiement futur.",
    },
    etalement: {
      terme: "Étalement",
      definition:
        "Découper un gros paiement en plusieurs petits, à des dates différentes, pour ne pas dépendre du taux d'une seule journée.",
    },
    multidevise: {
      terme: "Compte multi-devises",
      definition:
        "Un compte qui détient plusieurs monnaies. Vous convertissez une fois, puis vous payez localement.",
    },
    correspondant: {
      terme: "Banque correspondante",
      definition:
        "Une banque intermédiaire par laquelle transite votre virement. Elle prélève ses frais au passage, sans figurer sur votre relevé.",
    },
    stablecoin: {
      terme: "Stablecoin",
      definition:
        "Une cryptomonnaie dont la valeur suit une monnaie officielle, le plus souvent le dollar américain.",
    },
  },

  accueil: {
    titre: "Vos paiements internationaux",
    intro:
      "Ajoutez les personnes que vous payez à l'étranger. Pour chacune, RateGuard estime ce que le paiement coûte réellement, mesure de combien la devise a l'habitude de bouger sur votre rythme de paie, et compare vos options.",
    deviseBase: "Devise de votre entreprise",
    deviseBaseAide: "La monnaie dans laquelle vous tenez vos comptes.",

    vide: {
      titre: "Aucune personne enregistrée",
      corps:
        "Ajoutez un premier employé ou contractant pour voir ce que ses paiements coûtent vraiment.",
      exemple: "Remplir avec un exemple",
    },

    equipe: {
      titre: "Qui vous payez",
      ajouter: "Ajouter une personne",
      nom: "Nom",
      nomExemple: "Ex. : Amina Diallo",
      pays: "Pays",
      devise: "Devise de paiement",
      deviseAuto: "Devise usuelle du pays, modifiable.",
      montant: "Montant par paiement",
      montantAide: "Dans la devise de la personne, pas dans la vôtre.",
      frequence: "Rythme",
      type: "Statut",
      employe: "Employé",
      contractant: "Contractant",
      prochainPaiement: "Prochain paiement",
      confirmerSuppression: (nom: string) => `Retirer ${nom} de la liste ?`,
    },

    frequences: {
      hebdomadaire: "Chaque semaine",
      bihebdomadaire: "Aux deux semaines",
      mensuelle: "Chaque mois",
      trimestrielle: "Chaque trimestre",
      ponctuelle: "Paiement unique",
    },

    colonnes: {
      personne: "Personne",
      montant: "Montant dû",
      coute: "Vous coûte environ",
      risque: "Risque si vous attendez",
      quand: "Payé le",
    },

    joursRestants: (jours: number) =>
      jours < 0
        ? `en retard de ${Math.abs(jours)} jour${Math.abs(jours) > 1 ? "s" : ""}`
        : jours === 0
          ? "aujourd'hui"
          : `dans ${jours} jour${jours > 1 ? "s" : ""}`,

    totalMensuel: (montant: string) =>
      `Environ ${montant} par mois en paiements internationaux, frais compris.`,
  },

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
      voulu: "Voulu",
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
      devise: "Devise du bénéficiaire",
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
        `au moins ${montant} de plus que le taux de référence (au moins ${pct})`,
      gain: (montant: string) => `${montant} de moins que le taux de référence`,
      gainPartiel: (montant: string) =>
        `au plus ${montant} de moins que le taux de référence`,
      sansTaux: "Taux de référence indisponible à cette date",
    },
    attente: {
      titre: "Ce que l'attente a coûté",
      coute: (jours: number, montant: string) =>
        `${jours} jour${jours > 1 ? "s" : ""} entre le moment où vous saviez et le versement : ${montant} de plus.`,
      rapporte: (jours: number, montant: string) =>
        `${jours} jour${jours > 1 ? "s" : ""} entre le moment où vous saviez et le versement : ${montant} de moins.`,
      note: "Le taux aurait tout aussi bien pu partir dans l'autre sens. C'est ce qu'on appelle une exposition, pas une erreur.",
    },
  },

  paiement: {
    retour: "Retour aux paiements",
    sousTitre: (montant: string, pays: string, quand: string) =>
      `${montant} à verser — ${pays}, ${quand}.`,

    // La phrase demandée par le cahier des charges : une seule phrase, sans
    // jargon, qui chiffre le risque puis le prix de la certitude.
    resume: {
      titre: "En une phrase",
      avecRisque: (montant: string, quand: string, risque: string, prime: string) =>
        `Pour votre paiement de ${montant} ${quand} : si vous attendez, le paiement pourrait vous coûter environ ${risque} de plus. Si cela vous inquiète, figer le taux aujourd'hui coûte environ ${prime} de plus mais supprime complètement ce risque.`,
      certitudeMoinsChere: (
        montant: string,
        quand: string,
        risque: string,
        ecart: string,
      ) =>
        `Pour votre paiement de ${montant} ${quand} : si vous attendez, le paiement pourrait vous coûter environ ${risque} de plus. Ici, figer le taux aujourd'hui coûte même ${ecart} de moins que le virement bancaire, tout en supprimant ce risque.`,
      sansRisque: (montant: string, quand: string) =>
        `Pour votre paiement de ${montant} ${quand} : nous n'avons pas assez d'historique sur cette devise pour chiffrer le risque. Les coûts ci-dessous restent valables, le risque de change ne l'est pas.`,
      ancree: (montant: string, devise: string) =>
        `Pour votre paiement de ${montant} : ${devise} n'a pas bougé face à votre devise sur toute la période observée. Le risque de change est nul ici, seuls les frais comptent.`,
      economie: (montant: string, option: string) =>
        `Option la moins chère aujourd'hui : ${option}, environ ${montant} de moins que le virement bancaire.`,
    },

    taux: {
      titre: "Le taux utilisé",
      valeur: (de: string, taux: string, vers: string) => `1 ${de} = ${taux} ${vers}`,
      source: "Taux de référence de la Banque centrale européenne, via Frankfurter",
      dateTaux: "Cours de clôture du",
      avertissement:
        "La BCE publie un seul taux par jour ouvrable, vers 16 h heure d'Europe centrale. Ce n'est pas un cours en direct et il n'y en a pas les fins de semaine : votre banque appliquera son propre taux au moment du virement.",
      indisponible: {
        titre: "Aucun taux disponible pour cette devise",
        devise_non_publiee: (devise: string) =>
          `La Banque centrale européenne ne publie pas de taux pour ${devise}. Plutôt que d'en fabriquer un par un détour, RateGuard préfère ne rien afficher : demandez son taux à votre banque et saisissez vos frais réels ci-dessous.`,
        source_indisponible:
          "La source de taux n'a pas répondu. Réessayez dans un instant — rien n'a été estimé à sa place.",
        meme_devise:
          "Cette personne est payée dans votre propre devise : il n'y a aucune conversion, donc aucun risque de change.",
      },
    },

    stats: {
      titre: "Comment cette devise se comporte",
      intro: (jours: number, devise: string) =>
        `Mesuré sur l'historique réel de la paire ${devise}, sur des fenêtres de ${jours} jours — la durée qui sépare deux de vos paiements.`,
      periode: (debut: string, fin: string, n: number) =>
        `${n} cours quotidiens observés, du ${debut} au ${fin}.`,
      amplitudeTypique: "Mouvement habituel sur cette durée",
      amplitudeTypiqueAide:
        "La moitié des périodes observées ont bougé moins que ça, l'autre moitié davantage.",
      amplitudeLarge: "Mouvement plus large",
      amplitudeLargeAide:
        "Quatre périodes sur cinq sont restées en dessous de ce mouvement.",
      pire: "Pire mouvement défavorable observé",
      pireAide:
        "Le plus fort mouvement contre vous sur toute la période observée. Ce n'est pas un plafond : rien n'empêche qu'il soit dépassé.",
      annualisee: "Volatilité annualisée",
      annualiseeAide:
        "Le chiffre que citent les financiers pour comparer deux devises entre elles.",
      insuffisant:
        "L'historique disponible est trop court pour mesurer quoi que ce soit de fiable sur cette devise. RateGuard n'affiche donc aucun chiffre de risque plutôt qu'un chiffre fabriqué.",
      ancree:
        "Cette devise n'a pas bougé d'un centième face à la vôtre sur toute la période observée — elle est probablement arrimée officiellement. Le risque de change est nul, mais les frais, eux, restent entiers.",
      nonPrediction:
        "Ces chiffres décrivent le passé. Ils indiquent de combien cette devise a l'habitude de bouger, jamais dans quel sens elle ira. Sur quelques semaines, la direction d'un taux de change n'est pas prévisible — c'est justement pourquoi cet outil chiffre le risque au lieu de le deviner.",
    },

    strategies: {
      titre: "Vos options, chiffrées",
      intro:
        "Le même paiement, par quatre chemins différents. Les montants sont exprimés dans votre devise, frais compris, et sont donnés en fourchette parce qu'aucun ne peut être connu au dollar près à l'avance.",
      colonneOption: "Option",
      colonneCout: "Coût total estimé",
      colonneCertitude: "Ce que vous savez d'avance",
      certain: "Le montant exact",
      plage: (bas: string, haut: string) => `entre ${bas} et ${haut}`,
      central: (montant: string) => `environ ${montant}`,
      transferts: (n: number) => `${n} transferts`,
      moinsChere: "La moins chère aujourd'hui",
      incertainCourt: "Une fourchette",
      deplier: "Voir le détail",
      replier: "Masquer le détail",

      spot: {
        nom: "Virement bancaire aujourd'hui",
        court: "Ce que vous faites probablement déjà",
        explication:
          "Vous envoyez le paiement par virement international au taux du jour. C'est simple et immédiat, mais si le paiement est prévu plus tard, le taux qui s'appliquera n'est pas celui d'aujourd'hui.",
        pour: "Rien à mettre en place.",
        contre:
          "Marge de la banque élevée, frais de correspondant invisibles, et le taux du jour du virement reste inconnu.",
      },
      forward: {
        nom: "Taux figé à l'avance",
        court: "Contrat à terme",
        explication:
          "Vous convenez aujourd'hui avec un courtier du taux qui s'appliquera à une date future. Vous payez peut-être un peu plus cher, mais vous savez exactement combien, sans surprise.",
        pour: "Le seul choix dont le coût est connu d'avance, au dollar près.",
        contre:
          "Coûte une prime, exige souvent un dépôt de garantie que ce calcul ne chiffre pas, et vous engage même si le taux évolue en votre faveur.",
      },
      etalement: {
        nom: "Étaler en plusieurs versements",
        court: "Plusieurs petits transferts",
        explication:
          "Au lieu d'un seul gros transfert, vous en faites plusieurs à des dates différentes. Vous obtenez une moyenne de plusieurs taux au lieu de dépendre d'un seul jour.",
        pour: "Réduit l'effet d'une mauvaise journée sans rien avoir à signer.",
        contre:
          "Vous payez les frais fixes à chaque transfert. Sur un petit montant, cela coûte souvent plus cher que le risque évité.",
      },
      multidevise: {
        nom: "Compte multi-devises",
        court: "Wise, Airwallex et équivalents",
        explication:
          "Vous convertissez une fois vers un compte qui détient la devise, puis vous payez localement. Les frais de correspondant et de réception disparaissent parce que le versement final est domestique.",
        pour:
          "Nettement moins cher dès que vous payez régulièrement dans la même devise.",
        contre:
          "Ne supprime pas le risque de change tant que le compte n'est pas approvisionné à l'avance — et le provisionner immobilise votre trésorerie.",
      },

      postes: {
        virement: "Frais de virement international",
        intermediaire: "Frais de banque correspondante",
        reception: "Frais de réception, subis par le bénéficiaire",
        marge: "Marge intégrée au taux",
        prime: "Prime du taux figé",
        abonnement: "Abonnement, réparti sur les paiements du mois",
      },

      swift: {
        titre: "Un choix que votre banque ne vous propose pas spontanément",
        corps:
          "Chaque virement international porte une instruction de frais. Par défaut c'est SHA : votre bénéficiaire reçoit un montant que personne ne connaît d'avance, parce que les banques du trajet se servent au passage. En demandant OUR, vous payez tous les frais et votre bénéficiaire reçoit exactement le montant annoncé.",
        sha: "SHA — par défaut. Les frais du trajet sont prélevés sur le montant. Votre bénéficiaire reçoit moins que prévu, d'un montant inconnu d'avance.",
        our: "OUR — vous payez tout. Votre bénéficiaire reçoit le montant exact. Votre banque facture un supplément forfaitaire pour ce service.",
        ben: "BEN — le bénéficiaire assume l'ensemble des frais.",
        conclusion:
          "C'est le levier le plus direct sur la partie des frais que l'on dit « impossible à connaître d'avance » : elle ne l'est pas si vous choisissez de la porter.",
      },
    },

    crypto: {
      titre: "Peut-on payer cette personne en cryptomonnaie ?",
      statut: {
        fiat_obligatoire: "Non, pas le salaire",
        permis_sous_conditions: "Oui, sous conditions",
        cours_legal: "Oui, cours légal",
        interdit: "Non, interdit",
        non_verifie: "Nous n'avons pas vérifié",
      },
      nonVerifie:
        "Nous n'avons pas encore lu les règles de ce pays. Plutôt que de deviner à partir de pays voisins, RateGuard préfère le dire : cette case est vide, et une case vide vaut mieux qu'une réponse fabriquée.",
      risquesTitre: "Ce qu'il faut savoir",
      universels: {
        volatilite:
          "Si le jeton n'est pas un stablecoin, sa valeur peut varier entre l'envoi et le moment où la personne le convertit. Le salarié supporte cette variation, pas vous.",
        conversion:
          "Convertir en monnaie locale dépend des banques du pays. Dans plusieurs corridors, l'argent met de 24 à 72 heures à devenir dépensable, ce qui annule l'avantage de rapidité.",
        protection:
          "Une personne payée en crypto peut se voir refuser un prêt, un bail ou un dossier d'immigration : ces démarches réclament des relevés de salaire en monnaie officielle.",
        verification:
          "Les obligations fiscales et sociales ne disparaissent jamais : retenues, cotisations et feuillets restent calculés et déclarés en monnaie officielle.",
      },
      sourcesTitre: "Sources consultées",
      avertissement:
        "Ceci n'est pas un avis juridique. Vérifiez avec un comptable ou un avocat du pays concerné avant de verser un salaire en cryptomonnaie.",
    },

    vosChiffres: {
      titre: "Vos chiffres",
      mesure: (n: number, paire: string) =>
        `Mesuré sur vos ${n} derniers paiements ${paire}.`,
      defaut:
        "Estimations, tant que vous n'avez pas saisi de paiements passés sur ce trajet.",
      indecomposable:
        "Vos paiements sur ce trajet sont bien enregistrés, mais sur des montants de cette taille les frais fixes estimés dépassent déjà l'écart total observé, et la marge cachée dans le taux ne peut pas en être séparée. Entrez vos frais réels ci-dessous pour la faire apparaître.",
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
        `${jours} jour${jours > 1 ? "s" : ""} d'attente, soit environ ${montant} d'incertitude sur ce paiement.`,
      expositionCourte: "Le paiement est dû aujourd'hui : aucune attente à chiffrer.",
      decalage: (prevue: string, reelle: string, jours: number) =>
        `Le ${prevue} n'est pas un jour de virement. Le paiement partira le ${reelle}, soit ${jours} jour${jours > 1 ? "s" : ""} de plus que vous n'avez pas choisis.`,
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

    hypotheses: {
      titre: "Vos frais réels",
      intro:
        "Tant que vous n'avez pas saisi vos propres chiffres, RateGuard affiche des fourchettes larges, parce que les frais dépendent entièrement de votre banque et de votre volume. Entrez ce que vous payez vraiment et les fourchettes se resserrent.",
      parDefaut:
        "Chiffres par défaut. Les montants sont donnés en fourchette parce qu'ils ne viennent pas de votre banque.",
      personnalise:
        "Vos chiffres. Les fourchettes ne reflètent plus que le mouvement du taux.",
      virementFixe: "Frais de virement international",
      virementIntermediaire: "Frais de banque correspondante",
      virementReception: "Frais de réception",
      virementMargePct: "Marge de votre banque dans le taux (%)",
      specialisteMargePct: "Marge d'un spécialiste du transfert (%)",
      specialisteFixe: "Frais fixes du spécialiste",
      forwardPrimePct: "Prime pour figer le taux (%)",
      multiDeviseMargePct: "Marge du compte multi-devises (%)",
      multiDeviseMensuel: "Abonnement mensuel du compte",
      reinitialiser: "Revenir aux estimations par défaut",
      appliquer: "Utiliser mes chiffres",
    },

    decision: {
      titre: "Garder une trace",
      corps:
        "Notez l'option retenue. RateGuard fige le taux et sa date : dans six semaines, vous pourrez expliquer ce choix avec ce que vous saviez ce jour-là, pas avec ce que vous saurez alors.",
      bouton: "Noter cette décision",
      enregistree: "Décision enregistrée",
      journal: "Décisions déjà notées",
      colonneDate: "Notée le",
      colonneOption: "Option retenue",
      colonneTaux: "Taux du jour",
      colonneCout: "Coût estimé",
      vide: "Aucune décision notée pour cette personne.",
    },
  },

  donnees: {
    titre: "D'où viennent les données",
    intro:
      "Un outil qui affiche des chiffres doit dire d'où ils sortent, à quand ils remontent et ce qu'il ne sait pas. Cette page répond aux trois.",

    taux: {
      titre: "Les taux de change",
      corps: [
        "Les taux viennent de l'API Frankfurter, qui redistribue les taux de référence publiés par la Banque centrale européenne. C'est une source publique, gratuite et vérifiable — vous pouvez interroger la même adresse que nous.",
        "La BCE publie un seul cours par jour ouvrable, vers 16 h heure d'Europe centrale. Il n'y a ni fin de semaine ni jour férié dans la série. Un taux consulté un samedi est donc celui du vendredi, et RateGuard affiche toujours la date du cours plutôt que « maintenant ».",
        "Ce n'est pas un taux négociable : c'est une référence. Votre banque appliquera son propre taux, moins bon, au moment du virement. Les taux en direct sont vendus par des fournisseurs commerciaux ; nous avons préféré une source gratuite et transparente à une source payante et opaque.",
      ],
      devisesAbsentes:
        "La BCE ne publie qu'une trentaine de devises. Pour toutes les autres — riyal saoudien, naira, dirham, peso argentin et bien d'autres — RateGuard n'affiche aucun taux et le dit à l'écran, plutôt que de le reconstruire par un détour qui aurait l'air d'une mesure.",
    },

    statistiques: {
      titre: "Les statistiques de mouvement",
      corps: [
        "La volatilité est l'écart-type des variations quotidiennes du taux, calculé sur l'historique réel de la paire, puis annualisé en le multipliant par la racine de 252 — le nombre de séances dans une année.",
        "Les amplitudes affichées sont mesurées sur des fenêtres glissantes de la longueur exacte de votre cycle de paie. Si vous payez aux deux semaines, nous regardons toutes les périodes de deux semaines de l'historique et nous rapportons leur distribution.",
        "Ces fenêtres se chevauchent, ce qui corrèle les observations et resserre un peu les extrêmes. C'est un compromis assumé : sur un an d'historique, il n'y a que vingt-six quinzaines qui ne se chevauchent pas, ce qui est trop peu pour un percentile.",
        "En dessous de vingt variations quotidiennes ou de dix fenêtres, aucune statistique n'est publiée. L'écran affiche « données insuffisantes ».",
      ],
    },

    frais: {
      titre: "Les frais",
      corps: [
        "Les frais par défaut sont des ordres de grandeur publiquement observés pour une PME canadienne. Ils ne proviennent d'aucune banque en particulier et ne constituent aucune offre de prix.",
        "C'est pour ça qu'ils s'affichent en fourchette, à plus ou moins 35 %. Le cahier des charges du défi le dit lui-même : les frais de banque correspondante peuvent n'être connus qu'après le transfert. Afficher un montant au cent près sur une donnée non connaissable serait une fausse précision.",
        "Dès que vous saisissez vos propres chiffres, la fourchette de frais disparaît et il ne reste que l'incertitude du taux. L'interface change d'étiquette pour que vous sachiez toujours ce que vous regardez.",
      ],
    },

    crypto: {
      titre: "Les informations réglementaires sur la crypto",
      corps: [
        "Chaque fiche pays a été construite en lisant des sources publiques identifiées, jamais à partir de la mémoire d'un modèle de langage. Les sources sont listées sous chaque fiche et la date de dernière vérification est affichée.",
        "Les pays que nous n'avons pas vérifiés apparaissent comme non vérifiés. Nous ne déduisons pas le statut d'un pays de celui de ses voisins.",
        "La réglementation bouge vite. Une fiche datée de plusieurs mois doit être revérifiée avant toute décision.",
      ],
      derniere: "Dernière vérification des fiches pays",
      paysVerifies: "Pays vérifiés",
    },

    stockage: {
      titre: "Où vont vos données",
      supabase:
        "Vos personnes et vos décisions sont enregistrées dans une base Supabase, rattachées à un identifiant d'espace généré par votre navigateur. Il n'y a ni compte, ni mot de passe, ni adresse courriel demandée.",
      local:
        "Aucune base n'est configurée : tout reste dans le stockage local de votre navigateur et ne quitte jamais votre machine. Vider les données du site efface tout.",
    },

    lexiqueTitre: "Les mots employés à l'écran",

    limites: {
      titre: "Ce que RateGuard ne fait pas",
      liste: [
        "Ne prédit aucun taux de change et ne dit jamais quand envoyer votre argent. Sur quelques semaines, la direction d'un taux n'est pas prévisible à partir de son passé.",
        "Ne déplace, ne transfère et ne détient aucun fonds. C'est un outil de calcul.",
        "N'obtient aucun devis de votre banque ni d'aucun fournisseur.",
        "Ne donne ni conseil financier, ni conseil juridique, ni avis fiscal.",
      ],
    },
  },

  conformite: {
    titre: "Gérer le risque de change sans contrat à terme",
    intro:
      "Le contrat à terme est l'instrument classique pour figer un taux. Il soulève des objections en droit musulman, et il n'est de toute façon pas le seul chemin. Cette page présente les autres, et expose le débat plutôt que de le trancher.",

    sansInstrument: {
      titre: "Les voies qui ne demandent aucun montage",
      corps: [
        "Payer tôt. Convertir dès que vous avez les fonds supprime le risque, parce qu'il n'y a plus de délai entre l'encaissement et le paiement. L'échange au comptant ne soulève aucune objection chez aucune école.",
        "Facturer ou contracter dans votre propre devise. Si votre contractant accepte d'être payé en dollars canadiens, le risque change de côté. C'est une négociation, pas un instrument financier.",
        "Apparier vos flux. Si une partie de vos revenus arrive déjà en dollars américains, elle annule naturellement une partie de ce que vous devez payer en dollars américains.",
        "Détenir la devise à l'avance sur un compte multi-devises. Vous convertissez quand vous avez l'argent et vous payez plus tard : le risque disparaît, mais votre trésorerie est immobilisée.",
      ],
      note: "Aucune de ces quatre voies n'exige une institution financière particulière ni un avis savant contesté. Elles sont rarement expliquées aux petites entreprises, parce que personne n'a rien à leur vendre dessus.",
    },

    wad: {
      titre: "Le wa'd, une promesse unilatérale",
      corps: [
        "Les contrats à terme de change soulèvent une objection en droit musulman : l'échange des deux devises y est différé de part et d'autre, ce qui heurte l'exigence de simultanéité dans le sarf, l'échange de monnaies.",
        "Le wa'd est une autre avenue. C'est une promesse unilatérale : une seule partie s'engage à conclure un échange à un taux convenu, à une date donnée. Comme une seule partie est liée, l'opération n'est pas un contrat d'échange à terme réciproque, et l'échange lui-même se dénoue au comptant le jour venu.",
        "L'AAOIFI, l'organisme international qui publie les normes de finance islamique, traite de la promesse et de son caractère contraignant dans sa Shariah Standard No. 65 (Wa'd). C'est la référence à citer si vous explorez cette piste avec une institution.",
      ],
      norme: "AAOIFI Shariah Standard No. 65 — Promise (Wa'd)",
    },

    desaccord: {
      titre: "Les savants ne sont pas unanimes",
      corps: [
        "Le caractère contraignant de la promesse ne fait pas consensus. Une partie des juristes considère qu'une promesse engage moralement mais pas juridiquement, et qu'en rendre l'exécution obligatoire revient à reconstituer le contrat à terme que l'on cherchait à éviter.",
        "D'autres estiment qu'une promesse peut être rendue contraignante lorsqu'un besoin réel existe et que l'autre partie a engagé des frais en s'y fiant — la situation d'une entreprise qui a déjà signé avec ses contractants.",
        "Une troisième critique, de fond, tient que ces montages reproduisent économiquement l'instrument conventionnel sous une autre forme, et que la conformité de forme ne suffit pas.",
        "Aucune de ces positions n'est « la » position islamique. Elles coexistent, et le choix relève d'un avis que vous devez chercher auprès de votre propre conseiller, en lui décrivant votre situation précise.",
      ],
    },

    cryptoFiqh: {
      titre: "Et la crypto ?",
      corps: [
        "Le statut des cryptomonnaies fait lui aussi l'objet d'un débat savant ouvert : certains juristes y voient un bien échangeable, d'autres refusent de leur reconnaître la qualité de monnaie, d'autres encore distinguent selon l'adossement du jeton.",
        "RateGuard ne tranche pas plus ici qu'ailleurs. La section réglementaire de chaque personne dit ce que la loi du pays permet ; la question de la licéité religieuse est distincte et vous appartient.",
      ],
    },

    disclaimer:
      "Cette page est un contenu informatif. Elle n'est ni un avis religieux, ni un conseil financier, ni un avis juridique. Les normes citées le sont pour vous permettre de poursuivre la discussion avec les personnes qualifiées de votre choix.",
  },

  piedDePage:
    "RateGuard ne déplace, ne transfère et ne détient aucun fonds, et ne prédit aucun taux de change. Les frais affichés sont des estimations tirées d'ordres de grandeur publics, jamais des devis de votre banque.",
};
