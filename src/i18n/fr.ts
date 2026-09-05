/**
 * Tout le texte de l'interface vit ici, jamais dans le JSX.
 * Ajouter l'anglais plus tard = créer en.ts avec la même forme et changer la
 * langue active dans index.ts. Aucun composant n'a besoin d'être touché.
 */
export const fr = {
  app: {
    nom: "RateGuard",
    description:
      "Voyez ce que le délai entre l'encaissement de vos pèlerins et le paiement de vos fournisseurs coûte réellement à votre agence.",
  },

  nav: {
    forfaits: "Forfaits",
    conformite: "Conformité",
    nouveau: "Nouveau forfait",
  },

  commun: {
    chargement: "Chargement…",
    retour: "Retour aux forfaits",
    estimation: "Estimation",
    devise: "Devise",
    montant: "Montant",
    date: "Date",
    description: "Description",
    supprimer: "Supprimer",
    fermer: "Fermer",
  },

  accueil: {
    titre: "Vos forfaits",
    sousTitre:
      "Chaque forfait garde la trace du taux au moment où vous avez encaissé vos pèlerins.",
    tauxActuel: "Taux du marché aujourd'hui",
    tauxIndisponible: "Taux du jour indisponible pour l'instant.",
    vide: {
      titre: "Aucun forfait pour l'instant",
      corps:
        "Créez votre premier forfait au moment où vous encaissez un groupe. RateGuard capte le taux de ce moment précis et vous montre ce qui change d'ici le paiement de votre fournisseur.",
      action: "Créer un forfait",
    },
    colonnes: {
      forfait: "Forfait",
      verrouille: "Taux verrouillé",
      exposition: "Exposition",
      marge: "Marge restante estimée",
    },
    statut: {
      vert: "Sous contrôle",
      jaune: "À surveiller",
      rouge: "Marge dépassée",
    },
    statutExplication: {
      vert: "Le taux actuel est favorable ou reste loin de votre seuil.",
      jaune: "Le taux actuel a parcouru plus de la moitié du chemin vers votre seuil.",
      rouge: "Le taux actuel dépasse le seuil : ce forfait n'est plus rentable au prix affiché.",
    },
  },

  nouveau: {
    titre: "Nouveau forfait",
    sousTitre:
      "Remplissez ceci au moment où vous encaissez le groupe. RateGuard capte le taux de change de cet instant précis et l'horodate.",
    champs: {
      nom: "Nom du forfait",
      nomIndice: "Comme vous l'appelez dans vos dossiers.",
      nomExemple: "Groupe Omra Décembre 2026",
      pelerins: "Nombre de pèlerins",
      montant: "Montant total encaissé (CAD)",
      montantIndice: "Ce que le groupe vous a versé au total.",
      deviseCible: "Devise de votre fournisseur",
      devises: {
        SAR: "Riyal saoudien (SAR)",
        USD: "Dollar américain (USD)",
      },
      deviseIndice:
        "Le riyal saoudien est arrimé au dollar américain à 3,75 depuis 1986.",
      marge: "Votre marge sur ce forfait (%)",
      margeIndice:
        "Votre profit avant tout mouvement de taux. Sert à calculer votre seuil critique.",
    },
    echeancier: {
      titre: "Paiements à votre fournisseur",
      indice:
        "Une ligne par versement. La date compte autant que le montant : c'est elle qui détermine la durée de votre exposition.",
      ajouter: "Ajouter un paiement",
      retirer: "Retirer",
      ligne: "Versement",
      pourcentage: "Part du forfait (%)",
      dateEstimee: "Date de paiement prévue",
      descriptionExemple: "Virement au fournisseur saoudien",
      totalOk: "Les versements couvrent 100 % du forfait.",
      totalEcart: (total: string) =>
        `Les versements couvrent ${total} du forfait. Ajustez les parts pour atteindre 100 %.`,
    },
    action: "Verrouiller le taux et créer le forfait",
    actionEnCours: "Capture du taux en cours…",
    erreurs: {
      nom: "Donnez un nom à ce forfait.",
      pelerins: "Indiquez au moins un pèlerin.",
      montant: "Indiquez le montant encaissé.",
      marge: "Indiquez une marge entre 0 et 100 %.",
      echeancierVide: "Ajoutez au moins un paiement à votre fournisseur.",
      echeancierTotal: "Les parts des versements doivent totaliser 100 %.",
      echeancierDate: "Chaque versement a besoin d'une date de paiement.",
      taux: "Le taux n'a pas pu être capté. Vérifiez votre connexion et réessayez.",
    },
  },

  detail: {
    pelerins: (n: number) => `${n} pèlerin${n > 1 ? "s" : ""}`,
    introuvable: {
      titre: "Ce forfait est introuvable",
      corps:
        "Les forfaits sont enregistrés dans ce navigateur seulement. Si vous avez changé d'appareil ou vidé vos données de navigation, il n'existe plus ici.",
    },

    recu: {
      titre: "Reçu de verrouillage de taux",
      intro:
        "Le taux du marché au moment où vous avez encaissé ce groupe, capté et horodaté.",
      capteLe: "Capté le",
      taux: "Taux du marché",
      source: "Source",
      peg:
        "La Banque centrale européenne, source de ce taux, ne publie pas le riyal saoudien. Le taux affiché est le CAD/USD converti au peg saoudien fixe de 3,75 SAR pour 1 USD. Votre exposition réelle est donc au dollar américain.",
      usage:
        "Conservez ce reçu : il justifie tout ajustement de prix que vous auriez à expliquer à vos clients plus tard.",
    },

    cout: {
      titre: "Coût réel estimé du transfert",
      intro:
        "Le taux affiché n'est pas le prix payé. Voici ce qui s'ajoute entre votre compte et celui de votre fournisseur.",
      envoye: "Vous envoyez",
      auMid: "Au taux du marché, sans frais",
      recu: "Ce qui arrive réellement chez votre fournisseur",
      totalFrais: "Coût total des frais",
      tauxEffectif: "Votre taux réel après frais",
      colonneFrais: "Poste",
      colonneMontant: "Coût estimé",
    },

    scenarios: {
      titre: "Scénarios hypothétiques",
      avertissement:
        "Ceci illustre des scénarios hypothétiques, pas une prédiction du mouvement réel du taux de change. Les deux directions sont toujours présentées ensemble.",
      duree: (jours: number, palier: string) =>
        `Votre fournisseur est payé dans ${jours} jour${jours > 1 ? "s" : ""}. Sur cette durée (${palier}), RateGuard illustre des mouvements de faible amplitude.`,
      palier: {
        court: "moins de deux semaines",
        moyen: "de deux semaines à deux mois",
        long: "plus de deux mois",
      },
      axeX: "Mouvement du taux",
      axeY: "Effet sur votre marge (CAD)",
      legendeFavorable: "Le CAD s'apprécie : vous payez moins",
      legendeDefavorable: "Le CAD se déprécie : vous payez plus",
      colonneMouvement: "Mouvement",
      colonneCout: "Coût du versement",
      colonneEcart: "Effet sur la marge",
      colonneMargeFinale: "Marge restante",
      note:
        "Les amplitudes illustrées s'ajustent à la durée réelle de votre exposition. C'est une approximation simplifiée, pas un modèle de volatilité financière.",
    },

    seuil: {
      titre: "Seuil critique",
      corps: (pct: string) =>
        `Un mouvement défavorable de ${pct} annule entièrement votre marge sur ce forfait.`,
      detail: (marge: string, exposition: string) =>
        `Votre marge de ${marge} couvre une exposition de ${exposition}.`,
      inatteignable:
        "Ce forfait n'a pas de seuil : votre marge est nulle ou négative avant même tout mouvement du taux.",
      aucuneExposition:
        "Ce forfait n'a pas d'exposition au change : aucun versement en devise étrangère n'y est rattaché.",
    },

    comparaison: {
      titre: "Comparaison de fournisseur de transfert",
      intro:
        "Lorsque le paiement se fait par virement bancaire, la banque applique généralement son propre taux au moment du transfert, avec une marge intégrée — c'est un coût que vous pouvez réduire en comparant les canaux de transfert, indépendamment du mouvement du marché.",
      midMarket: "Taux du marché",
      midMarketNote: "Le taux réel, sans marge. C'est la référence.",
      banque: "Taux bancaire typique, estimé",
      banqueNote: (pct: string) =>
        `Le taux du marché moins une marge de ${pct}, valeur observée publiquement pour une banque de détail canadienne.`,
      ecart: (montant: string) =>
        `Sur ce forfait, l'écart entre les deux taux représente environ ${montant}.`,
      estimation:
        "Ce chiffre est une estimation construite à partir de benchmarks publics. Ce n'est pas un devis : demandez son taux à votre banque et comparez.",
    },

    resume: {
      action: "Copier le résumé",
      copie: "Résumé copié",
      titre: "Résumé pour votre client",
      intro:
        "Ce texte est prêt à coller dans un courriel. Il ne contient aucune donnée que votre client ne pourrait pas voir.",
      modele: (v: {
        nom: string;
        pelerins: string;
        montant: string;
        horodatage: string;
        taux: string;
        paire: string;
        source: string;
        seuil: string;
      }) =>
        [
          `Objet : ${v.nom} — taux de change verrouillé`,
          "",
          "Bonjour,",
          "",
          `Voici les informations de change rattachées à votre forfait (${v.pelerins}, ${v.montant}).`,
          "",
          `Taux ${v.paire} capté le ${v.horodatage} : ${v.taux}`,
          `Source : ${v.source}`,
          "",
          `Ce taux est celui du marché au moment de votre paiement. Le règlement de nos fournisseurs saoudiens se fait plus tard, à un taux qui peut différer. Un mouvement défavorable de ${v.seuil} absorberait entièrement notre marge sur ce forfait.`,
          "",
          "Nous vous transmettons cette information par transparence : si un ajustement devenait nécessaire, il serait fondé sur ce relevé horodaté et non sur une estimation faite après coup.",
          "",
          "Cordialement,",
        ].join("\n"),
    },

    avertissementGeneral:
      "RateGuard ne déplace, ne transfère et ne détient aucun fonds. C'est un outil de visibilité et de calcul. Les frais affichés sont des estimations fondées sur des benchmarks publics de l'industrie, jamais des devis de votre banque.",
  },

  conformite: {
    titre: "Le risque de change et la conformité à la Sharia",
    intro:
      "Cette page explique en langage simple ce qu'est le risque de change pour une agence de voyage religieux, et présente un mécanisme discuté par les juristes musulmans pour l'encadrer. Elle ne remplace pas l'avis de votre propre conseiller religieux.",

    risque: {
      titre: "Ce qu'est le risque de change, concrètement",
      corps: [
        "Votre pèlerin vous paie en dollars canadiens aujourd'hui. Votre hôtelier à Makkah, lui, veut des riyals, et vous le paierez dans une semaine, un mois, parfois plusieurs mois si vous bloquez des chambres à l'avance pour le Hajj.",
        "Entre ces deux moments, le taux bouge. Personne ne l'a décidé, et surtout pas vous : votre banque appliquera simplement son taux du jour au moment du virement. Si le dollar canadien a perdu du terrain, il vous faut plus de dollars pour acheter les mêmes riyals, et la différence sort directement de votre marge.",
        "Ce n'est pas de la spéculation. C'est un décalage de calendrier entre le moment où vous encaissez et le moment où vous payez.",
      ],
    },

    wad: {
      titre: "Le wa'd, une promesse unilatérale",
      corps: [
        "Les instruments classiques utilisés en finance conventionnelle pour figer un taux à l'avance — les contrats à terme de change — soulèvent des objections en droit musulman : l'échange de devises y est différé des deux côtés, ce qui heurte l'exigence de simultanéité dans le sarf, l'échange de monnaies.",
        "Le wa'd est une avenue différente. Il s'agit d'une promesse unilatérale : une seule partie s'engage à conclure un échange à un taux convenu, à une date donnée. Comme une seule partie est liée, l'opération n'est pas un contrat d'échange à terme réciproque, et l'échange lui-même se dénoue au comptant le jour venu.",
        "L'AAOIFI, l'organisme international qui publie les normes de finance islamique, traite de la promesse et de son caractère contraignant dans sa Shariah Standard No. 65 (Wa'd). C'est la référence à demander à votre conseiller si vous explorez cette piste avec une institution.",
      ],
      norme: "AAOIFI Shariah Standard No. 65 — Promise (Wa'd)",
    },

    desaccord: {
      titre: "Les savants ne sont pas unanimes",
      corps: [
        "Le caractère contraignant de la promesse ne fait pas l'unanimité. Une partie des juristes considère qu'une promesse engage moralement mais pas juridiquement, et qu'en rendre l'exécution obligatoire revient à reconstituer le contrat à terme que l'on cherchait à éviter.",
        "D'autres estiment au contraire qu'une promesse peut être rendue contraignante lorsqu'un besoin réel existe et que l'autre partie a engagé des frais en s'y fiant — ce qui est précisément la situation d'une agence qui a déjà encaissé ses pèlerins.",
        "Il existe aussi une critique de fond, portée par des juristes qui jugent que ces montages reproduisent économiquement l'instrument conventionnel sous une forme différente, et que la conformité de forme ne suffit pas.",
        "Aucune de ces positions n'est « la » position islamique. Elles coexistent, et le choix d'un mécanisme relève d'un avis que vous devez chercher auprès de votre propre conseiller religieux, en lui décrivant votre situation précise.",
      ],
    },

    limites: {
      titre: "Ce que RateGuard fait et ne fait pas",
      fait: [
        "Capte et horodate le taux du marché au moment où vous encaissez un groupe.",
        "Estime ce que le transfert vous coûte réellement, frais compris.",
        "Illustre l'effet de mouvements hypothétiques du taux sur votre marge, dans les deux directions.",
        "Calcule à partir de quel mouvement défavorable un forfait cesse d'être rentable.",
      ],
      neFaitPas: [
        "Ne prédit aucun taux de change futur et ne recommande aucun moment pour convertir.",
        "Ne déplace, ne transfère et ne détient aucun fonds.",
        "N'obtient aucun devis de votre banque : les frais affichés sont des estimations de benchmarks publics.",
        "Ne donne aucun avis religieux ni aucun conseil financier.",
      ],
    },

    disclaimer:
      "Cette page est un contenu informatif. Elle n'est ni un avis religieux, ni un conseil financier, ni un avis juridique. Les normes citées le sont à titre de référence pour vous permettre de poursuivre la discussion avec les personnes qualifiées de votre choix.",
  },
} as const;
