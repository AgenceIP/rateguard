import type { Traductions } from "./index";

/**
 * Version anglaise. La forme est imposée par fr.ts via le type Traductions :
 * une clé oubliée ou renommée fait échouer la compilation, jamais l'exécution.
 */
export const en: Traductions = {
  app: {
    nom: "RateGuard",
    description:
      "See what the gap between collecting from your pilgrims and paying your suppliers actually costs your agency.",
  },

  nav: {
    forfaits: "Packages",
    conformite: "Compliance",
    nouveau: "New package",
  },

  langue: {
    choisir: "Interface language",
    fr: "Français",
    en: "English",
  },

  commun: {
    chargement: "Loading…",
    retour: "Back to packages",
    estimation: "Estimate",
    devise: "Currency",
    montant: "Amount",
    date: "Date",
    description: "Description",
    supprimer: "Delete",
    fermer: "Close",
  },

  accueil: {
    titre: "Your packages",
    sousTitre:
      "Every package keeps a record of the exchange rate at the moment you collected from your pilgrims.",
    tauxActuel: "Market rate today",
    tauxIndisponible: "Today's rate is unavailable right now.",
    vide: {
      titre: "No packages yet",
      corps:
        "Create your first package the moment you collect from a group. RateGuard captures the rate at that precise moment and shows you what changes between then and the day you pay your supplier.",
      action: "Create a package",
    },
    colonnes: {
      forfait: "Package",
      verrouille: "Locked rate",
      exposition: "Exposure",
      marge: "Estimated remaining margin",
    },
    progression: (parcouru: string, seuil: string) => `${parcouru} of ${seuil}`,
    statut: {
      vert: "Under control",
      jaune: "Worth watching",
      rouge: "Margin exceeded",
    },
    statutExplication: {
      vert: "The current rate is favourable, or still far from your threshold.",
      jaune:
        "The current rate has covered more than half the distance to your threshold.",
      rouge:
        "The current rate is past the threshold: this package is no longer profitable at the price you quoted.",
    },
  },

  nouveau: {
    titre: "New package",
    sousTitre:
      "Fill this in the moment you collect from the group. RateGuard captures the exchange rate of that precise moment and timestamps it.",
    champs: {
      nom: "Package name",
      nomIndice: "Whatever you call it in your own records.",
      nomExemple: "December 2026 Umrah group",
      pelerins: "Number of pilgrims",
      montant: "Total collected (CAD)",
      montantIndice: "What the group paid you in total.",
      deviseCible: "Your supplier's currency",
      devises: {
        SAR: "Saudi riyal (SAR)",
        USD: "US dollar (USD)",
      },
      deviseIndice:
        "The Saudi riyal has been pegged to the US dollar at 3.75 since 1986.",
      marge: "Your margin on this package (%)",
      margeIndice:
        "Your profit before any rate movement. Used to calculate your critical threshold.",
    },
    echeancier: {
      titre: "Payments to your supplier",
      indice:
        "One row per payment. The date matters as much as the amount: it is what determines how long you are exposed.",
      ajouter: "Add a payment",
      retirer: "Remove",
      ligne: "Payment",
      pourcentage: "Share of package (%)",
      dateEstimee: "Expected payment date",
      descriptionExemple: "Wire to Saudi supplier",
      totalOk: "The payments cover 100% of the package.",
      totalEcart: (total: string) =>
        `The payments cover ${total} of the package. Adjust the shares to reach 100%.`,
    },
    action: "Lock the rate and create the package",
    actionEnCours: "Capturing the rate…",
    erreurs: {
      nom: "Give this package a name.",
      pelerins: "Enter at least one pilgrim.",
      montant: "Enter the amount you collected.",
      marge: "Enter a margin between 0 and 100%.",
      echeancierVide: "Add at least one payment to your supplier.",
      echeancierTotal: "The payment shares must add up to 100%.",
      echeancierDate: "Every payment needs a date.",
      taux: "The rate could not be captured. Check your connection and try again.",
    },
  },

  detail: {
    pelerins: (n: number) => `${n} pilgrim${n !== 1 ? "s" : ""}`,
    sousTitre: (pelerins: string, montant: string, devise: string) =>
      `${pelerins}, ${montant} collected, payable in ${devise}`,
    introuvable: {
      titre: "This package cannot be found",
      corps:
        "Packages are stored in this browser only. If you switched devices or cleared your browsing data, it no longer exists here.",
    },

    recu: {
      titre: "Rate lock receipt",
      intro:
        "The market rate at the moment you collected from this group, captured and timestamped.",
      capteLe: "Captured on",
      taux: "Market rate",
      source: "Source",
      sourceValeur: (fournisseur: string, date: string) =>
        `${fournisseur} — ECB reference rates, ${date}`,
      peg: "The European Central Bank, the source of this rate, does not publish the Saudi riyal. The rate shown is CAD/USD converted at the fixed Saudi peg of 3.75 SAR to 1 USD. Your real exposure is therefore to the US dollar.",
      usage:
        "Keep this receipt: it substantiates any price adjustment you may have to explain to your clients later on.",
    },

    cout: {
      titre: "Estimated real cost of the transfer",
      intro:
        "The rate you see is not the price you pay. Here is what gets added between your account and your supplier's.",
      envoye: "You send",
      auMid: "At the market rate, no fees",
      recu: "What actually reaches your supplier",
      totalFrais: "Total cost of fees",
      tauxEffectif: "Your real rate after fees",
      colonneFrais: "Item",
      colonneMontant: "Estimated cost",
      postes: {
        transfert: "International wire fee",
        intermediaire: "Intermediary bank fee",
        reception: "Beneficiary receiving fee",
        spread: "Exchange margin built into the rate",
      },
    },

    scenarios: {
      titre: "Hypothetical scenarios",
      avertissement:
        "This illustrates hypothetical scenarios, not a prediction of how the exchange rate will actually move. Both directions are always shown together.",
      duree: (jours: number, palier: string) =>
        `Your supplier is paid in ${jours} day${jours !== 1 ? "s" : ""}. Over that window (${palier}), RateGuard illustrates small-amplitude movements.`,
      palier: {
        court: "under two weeks",
        moyen: "two weeks to two months",
        long: "over two months",
      },
      axeX: "Rate movement",
      axeY: "Effect on your margin (CAD)",
      legendeFavorable: "The CAD strengthens: you pay less",
      legendeDefavorable: "The CAD weakens: you pay more",
      colonneMouvement: "Movement",
      colonneCout: "Cost of the payment",
      colonneEcart: "Effect on margin",
      colonneMargeFinale: "Remaining margin",
      note: "The amplitudes shown adjust to how long you are actually exposed. This is a simplified approximation, not a financial volatility model.",
    },

    seuil: {
      titre: "Critical threshold",
      corps: (pct: string) =>
        `An adverse movement of ${pct} wipes out your entire margin on this package.`,
      detail: (marge: string, exposition: string) =>
        `Your margin of ${marge} covers an exposure of ${exposition}.`,
      inatteignable:
        "This package has no threshold: your margin is zero or negative before any rate movement at all.",
      aucuneExposition:
        "This package carries no currency exposure: no foreign-currency payment is attached to it.",
    },

    comparaison: {
      titre: "Transfer provider comparison",
      intro:
        "When payment goes out by bank wire, the bank generally applies its own rate at the time of transfer, with a margin built in — a cost you can reduce by comparing transfer channels, independently of how the market moves.",
      midMarket: "Market rate",
      midMarketNote: "The real rate, no margin. This is the reference.",
      banque: "Typical bank rate, estimated",
      banqueNote: (pct: string) =>
        `The market rate less a margin of ${pct}, a figure publicly observed for a Canadian retail bank.`,
      ecart: (montant: string) =>
        `On this package, the gap between the two rates comes to roughly ${montant}.`,
      estimation:
        "This figure is an estimate built from public benchmarks. It is not a quote: ask your bank for its rate and compare.",
    },

    resume: {
      action: "Copy the summary",
      copie: "Summary copied",
      titre: "Summary for your client",
      intro:
        "This text is ready to paste into an email. It contains nothing your client could not be shown.",
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
          `Subject: ${v.nom} — exchange rate locked`,
          "",
          "Hello,",
          "",
          `Here is the exchange rate information attached to your package (${v.pelerins}, ${v.montant}).`,
          "",
          `${v.paire} rate captured on ${v.horodatage}: ${v.taux}`,
          `Source: ${v.source}`,
          "",
          `This is the market rate at the time of your payment. We settle with our Saudi suppliers later, at a rate that may differ. An adverse movement of ${v.seuil} would absorb our entire margin on this package.`,
          "",
          "We are sharing this in the interest of transparency: should an adjustment become necessary, it would rest on this timestamped record and not on an estimate made after the fact.",
          "",
          "Kind regards,",
        ].join("\n"),
    },

    avertissementGeneral:
      "RateGuard does not move, transfer or hold any funds. It is a visibility and calculation tool. The fees shown are estimates based on public industry benchmarks, never quotes from your bank.",
  },

  conformite: {
    titre: "Currency risk and Sharia compliance",
    intro:
      "This page explains in plain language what currency risk means for a religious travel agency, and presents one mechanism Muslim jurists have discussed for managing it. It does not replace the opinion of your own religious advisor.",

    risque: {
      titre: "What currency risk actually is",
      corps: [
        "Your pilgrim pays you in Canadian dollars today. Your hotelier in Makkah wants riyals, and you will pay them in a week, a month, sometimes several months if you are blocking rooms ahead of Hajj.",
        "Between those two moments, the rate moves. Nobody decided it, least of all you: your bank will simply apply its rate of the day when the wire goes out. If the Canadian dollar has lost ground, you need more dollars to buy the same riyals, and the difference comes straight out of your margin.",
        "This is not speculation. It is a timing gap between when you collect and when you pay.",
      ],
    },

    wad: {
      titre: "The wa'd, a unilateral promise",
      corps: [
        "The instruments conventional finance uses to fix a rate in advance — currency forwards — raise objections in Islamic law: the exchange of currencies is deferred on both sides, which conflicts with the requirement of simultaneity in sarf, the exchange of monies.",
        "The wa'd is a different avenue. It is a unilateral promise: one party alone undertakes to conclude an exchange at an agreed rate on a given date. Because only one party is bound, the arrangement is not a reciprocal forward contract, and the exchange itself settles on the spot when the day comes.",
        "AAOIFI, the international body that publishes Islamic finance standards, addresses the promise and its binding character in its Shariah Standard No. 65 (Wa'd). That is the reference to raise with your advisor if you explore this route with an institution.",
      ],
      norme: "AAOIFI Shariah Standard No. 65 — Promise (Wa'd)",
    },

    desaccord: {
      titre: "Scholars are not unanimous",
      corps: [
        "Whether a promise binds is not settled. Some jurists hold that a promise binds morally but not legally, and that making it enforceable amounts to rebuilding the very forward contract one was trying to avoid.",
        "Others hold that a promise may be made binding where a genuine need exists and the other party has incurred costs in reliance on it — which is precisely the position of an agency that has already collected from its pilgrims.",
        "There is also a substantive critique, advanced by jurists who judge that these structures economically reproduce the conventional instrument in a different form, and that compliance in form is not enough.",
        "None of these positions is “the” Islamic position. They coexist, and choosing a mechanism calls for an opinion you must seek from your own religious advisor, describing your specific situation to them.",
      ],
    },

    limites: {
      titre: "What RateGuard does and does not do",
      fait: [
        "Captures and timestamps the market rate at the moment you collect from a group.",
        "Estimates what the transfer actually costs you, fees included.",
        "Illustrates the effect of hypothetical rate movements on your margin, in both directions.",
        "Calculates the adverse movement at which a package stops being profitable.",
      ],
      neFaitPas: [
        "Does not predict any future exchange rate and recommends no moment to convert.",
        "Does not move, transfer or hold any funds.",
        "Obtains no quote from your bank: the fees shown are estimates from public benchmarks.",
        "Gives no religious ruling and no financial advice.",
      ],
    },

    disclaimer:
      "This page is informational content. It is not a religious ruling, financial advice or legal advice. The standards cited are given as references so that you can carry the discussion forward with the qualified people of your choosing.",
  },
};
