import type { Traductions } from "./index";

/**
 * English copy.
 *
 * `Traductions = typeof fr` — a key missing here is a compile error, not a
 * blank on screen. Same three rules as the French: every financial term is
 * glossed where it appears, amounts come before percentages, and no figure is
 * ever stated as a certainty.
 */
export const en: Traductions = {
  meta: {
    titre: "RateGuard — what your international payments really cost",
    description:
      "Estimate the real cost of an international payment, measure currency risk on your own payroll rhythm, and compare your options. No rate forecasts.",
  },

  marque: {
    nom: "RateGuard",
    baseline: "The real cost of paying people abroad",
  },

  langue: { choisir: "Interface language", fr: "Français", en: "English" },

  nav: {
    accueil: "Payments",
    journal: "Ledger",
    donnees: "Where the data comes from",
    conformite: "Compliance",
  },

  commun: {
    chargement: "Loading…",
    enregistrer: "Save",
    annuler: "Cancel",
    ajouter: "Add",
    supprimer: "Remove",
    modifier: "Edit",
    retour: "Back to payments",
    voirDetail: "See the detail",
    entre: "between",
    et: "and",
    environ: "about",
    aucuneDonnee: "Not enough data",
    deuxPoints: ": ",
    estimation: "Estimate",
    vosChiffres: "Your figures",
    source: "Source",
    verifieLe: "Verified",
    fraisEstimes:
      "The fees shown are estimates based on public orders of magnitude, not quotes from your provider.",
  },

  lexique: {
    taux: {
      terme: "Exchange rate",
      definition:
        "How many units of the foreign currency you get for one Canadian dollar.",
    },
    marge: {
      terme: "Rate margin",
      definition:
        "The cut your bank keeps by giving you a worse rate than the market one. It appears on no statement.",
    },
    volatilite: {
      terme: "Volatility",
      definition:
        "How much a currency usually moves. It tells you the size of the move, never its direction.",
    },
    forward: {
      terme: "Forward contract",
      definition:
        "A rate locked in advance: you agree today on the rate that will apply to a future payment.",
    },
    etalement: {
      terme: "Spreading",
      definition:
        "Splitting one large payment into several smaller ones on different dates, so you don't depend on a single day's rate.",
    },
    multidevise: {
      terme: "Multi-currency account",
      definition:
        "An account that holds several currencies. You convert once, then pay locally.",
    },
    correspondant: {
      terme: "Correspondent bank",
      definition:
        "An intermediary bank your transfer passes through. It takes its fee on the way, without appearing on your statement.",
    },
    stablecoin: {
      terme: "Stablecoin",
      definition:
        "A cryptocurrency whose value tracks an official currency, most often the US dollar.",
    },
  },

  accueil: {
    titre: "Your international payments",
    intro:
      "Add the people you pay abroad. For each one, RateGuard estimates what the payment really costs, measures how much the currency usually moves over your payroll rhythm, and compares your options.",
    deviseBase: "Your company's currency",
    deviseBaseAide: "The currency you keep your books in.",

    vide: {
      titre: "No one added yet",
      corps:
        "Add a first employee or contractor to see what their payments really cost.",
      exemple: "Fill in an example",
    },

    equipe: {
      titre: "Who you pay",
      ajouter: "Add a person",
      nom: "Name",
      nomExemple: "e.g. Amina Diallo",
      pays: "Country",
      devise: "Payment currency",
      deviseAuto: "The country's usual currency — you can change it.",
      montant: "Amount per payment",
      montantAide: "In their currency, not yours.",
      frequence: "Rhythm",
      type: "Status",
      employe: "Employee",
      contractant: "Contractor",
      prochainPaiement: "Next payment",
      confirmerSuppression: (nom: string) => `Remove ${nom} from the list?`,
    },

    frequences: {
      hebdomadaire: "Every week",
      bihebdomadaire: "Every two weeks",
      mensuelle: "Every month",
      trimestrielle: "Every quarter",
      ponctuelle: "One-off payment",
    },

    colonnes: {
      personne: "Person",
      montant: "Amount owed",
      coute: "Costs you about",
      risque: "Risk if you wait",
      quand: "Paid on",
    },

    joursRestants: (jours: number) =>
      jours < 0
        ? `${Math.abs(jours)} day${Math.abs(jours) > 1 ? "s" : ""} overdue`
        : jours === 0
          ? "today"
          : `in ${jours} day${jours > 1 ? "s" : ""}`,

    totalMensuel: (montant: string) =>
      `About ${montant} a month in international payments, fees included.`,
  },

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
      "What you actually paid, against the reference rate of that same day. This is where you read the answer to \"did I save anything\": your January transfers next to your August ones.",
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
      voulu: "Intended",
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
      devise: "Recipient currency",
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
        `at least ${montant} more than the reference rate (at least ${pct})`,
      gain: (montant: string) => `${montant} less than the reference rate`,
      gainPartiel: (montant: string) =>
        `at most ${montant} less than the reference rate`,
      sansTaux: "No reference rate available for that date",
    },
    attente: {
      titre: "What waiting cost",
      coute: (jours: number, montant: string) =>
        `${jours} day${jours > 1 ? "s" : ""} between knowing and paying: ${montant} more.`,
      rapporte: (jours: number, montant: string) =>
        `${jours} day${jours > 1 ? "s" : ""} between knowing and paying: ${montant} less.`,
      note: "The rate could just as easily have gone the other way. That is called exposure, not a mistake.",
    },
  },

  paiement: {
    retour: "Back to payments",
    sousTitre: (montant: string, pays: string, quand: string) =>
      `${montant} due — ${pays}, ${quand}.`,

    resume: {
      titre: "In one sentence",
      avecRisque: (montant: string, quand: string, risque: string, prime: string) =>
        `For your ${montant} payment ${quand}: if you wait, the payment could cost you about ${risque} more. If that worries you, locking the rate today costs about ${prime} more but removes that risk entirely.`,
      certitudeMoinsChere: (
        montant: string,
        quand: string,
        risque: string,
        ecart: string,
      ) =>
        `For your ${montant} payment ${quand}: if you wait, the payment could cost you about ${risque} more. Here, locking the rate today actually costs ${ecart} less than a bank wire, and removes that risk as well.`,
      sansRisque: (montant: string, quand: string) =>
        `For your ${montant} payment ${quand}: we don't have enough history on this currency to put a number on the risk. The costs below still hold; the currency risk figure doesn't.`,
      ancree: (montant: string, devise: string) =>
        `For your ${montant} payment: ${devise} hasn't moved against your currency over the whole observed period. There is no currency risk here — only fees.`,
      economie: (montant: string, option: string) =>
        `Cheapest option today: ${option}, about ${montant} less than a bank wire.`,
    },

    taux: {
      titre: "The rate used",
      valeur: (de: string, taux: string, vers: string) => `1 ${de} = ${taux} ${vers}`,
      source: "European Central Bank reference rate, via Frankfurter",
      dateTaux: "Closing rate of",
      avertissement:
        "The ECB publishes one rate per business day, around 4 p.m. Central European Time. It is not a live quote and there is none on weekends: your bank will apply its own rate when the transfer goes through.",
      indisponible: {
        titre: "No rate available for this currency",
        devise_non_publiee: (devise: string) =>
          `The European Central Bank does not publish a rate for ${devise}. Rather than manufacturing one through a detour, RateGuard shows nothing: ask your bank for its rate and enter your real fees below.`,
        source_indisponible:
          "The rate source did not answer. Try again in a moment — nothing was estimated in its place.",
        meme_devise:
          "This person is paid in your own currency: there is no conversion, so no currency risk.",
      },
    },

    stats: {
      titre: "How this currency behaves",
      intro: (jours: number, devise: string) =>
        `Measured on the real history of the ${devise} pair, over ${jours}-day windows — the gap between two of your payments.`,
      periode: (debut: string, fin: string, n: number) =>
        `${n} daily rates observed, from ${debut} to ${fin}.`,
      amplitudeTypique: "Usual move over that span",
      amplitudeTypiqueAide:
        "Half the observed periods moved less than this, half moved more.",
      amplitudeLarge: "Wider move",
      amplitudeLargeAide: "Four periods out of five stayed below this move.",
      pire: "Worst adverse move observed",
      pireAide:
        "The largest move against you over the whole observed period. It is not a ceiling: nothing prevents it from being exceeded.",
      annualisee: "Annualised volatility",
      annualiseeAide:
        "The figure finance people quote to compare two currencies against each other.",
      insuffisant:
        "The available history is too short to measure anything reliable on this currency. RateGuard therefore shows no risk figure rather than a manufactured one.",
      ancree:
        "This currency has not moved a fraction against yours over the whole observed period — it is most likely officially pegged. Currency risk is nil, but the fees remain in full.",
      nonPrediction:
        "These figures describe the past. They tell you how much this currency usually moves, never which way it will go. Over a few weeks the direction of an exchange rate is not predictable — which is exactly why this tool measures risk instead of guessing it.",
    },

    strategies: {
      titre: "Your options, costed",
      intro:
        "The same payment, along four different paths. Amounts are in your currency, fees included, and are given as ranges because none can be known to the dollar in advance.",
      colonneOption: "Option",
      colonneCout: "Estimated total cost",
      colonneCertitude: "What you know in advance",
      certain: "The exact amount",
      plage: (bas: string, haut: string) => `between ${bas} and ${haut}`,
      central: (montant: string) => `about ${montant}`,
      transferts: (n: number) => `${n} transfers`,
      moinsChere: "Cheapest today",
      incertainCourt: "A range",
      deplier: "See the detail",
      replier: "Hide the detail",

      spot: {
        nom: "Bank wire today",
        court: "What you're probably already doing",
        explication:
          "You send the payment by international wire at today's rate. It's simple and immediate, but if the payment is due later, the rate that applies won't be today's.",
        pour: "Nothing to set up.",
        contre:
          "High bank margin, invisible correspondent fees, and the rate on the day of the transfer stays unknown.",
      },
      forward: {
        nom: "Rate locked in advance",
        court: "Forward contract",
        explication:
          "You agree today with a broker on the rate that will apply on a future date. You may pay a bit more, but you know exactly how much, with no surprises.",
        pour: "The only choice whose cost is known in advance, to the dollar.",
        contre:
          "Costs a premium, often requires a margin deposit this calculation does not include, and binds you even if the rate moves in your favour.",
      },
      etalement: {
        nom: "Spread over several transfers",
        court: "Several smaller transfers",
        explication:
          "Instead of one large transfer, you make several on different dates. You get an average of several rates instead of depending on a single day.",
        pour: "Softens the effect of a bad day with nothing to sign.",
        contre:
          "You pay the fixed fees on every transfer. On a small amount that often costs more than the risk it avoids.",
      },
      multidevise: {
        nom: "Multi-currency account",
        court: "Wise, Airwallex and equivalents",
        explication:
          "You convert once into an account that holds the currency, then pay locally. Correspondent and receiving fees disappear because the final payment is domestic.",
        pour: "Clearly cheaper as soon as you pay regularly in the same currency.",
        contre:
          "Does not remove currency risk unless the account is funded in advance — and funding it ties up your cash.",
      },

      postes: {
        virement: "International wire fee",
        intermediaire: "Correspondent bank fee",
        reception: "Receiving fee, borne by the recipient",
        marge: "Margin built into the rate",
        prime: "Locked-rate premium",
        abonnement: "Subscription, spread over the month's payments",
      },

      swift: {
        titre: "A choice your bank won't offer you unprompted",
        corps:
          "Every international wire carries a charge instruction. The default is SHA: your recipient receives an amount nobody knows in advance, because the banks along the route take their cut. Ask for OUR and you pay all the fees, so your recipient receives exactly the amount you quoted.",
        sha: "SHA — the default. Route fees are deducted from the amount. Your recipient gets less than expected, by an amount unknown in advance.",
        our: "OUR — you pay everything. Your recipient receives the exact amount. Your bank charges a flat supplement for this.",
        ben: "BEN — the recipient bears all the fees.",
        conclusion:
          "This is the most direct lever on the part of the fees said to be impossible to know in advance: it isn't, if you choose to carry it.",
      },
    },

    crypto: {
      titre: "Can this person be paid in cryptocurrency?",
      statut: {
        fiat_obligatoire: "No, not the salary",
        permis_sous_conditions: "Yes, with conditions",
        cours_legal: "Yes, legal tender",
        interdit: "No, prohibited",
        non_verifie: "We haven't checked",
      },
      nonVerifie:
        "We haven't read this country's rules yet. Rather than guessing from neighbouring countries, RateGuard says so: this box is empty, and an empty box beats a manufactured answer.",
      risquesTitre: "What you need to know",
      universels: {
        volatilite:
          "If the token isn't a stablecoin, its value can move between the moment you send it and the moment the person converts it. The worker carries that swing, not you.",
        conversion:
          "Converting into local currency depends on the country's banks. In several corridors the money takes 24 to 72 hours to become spendable, which cancels the speed advantage.",
        protection:
          "Someone paid in crypto can be refused a loan, a lease or an immigration file: those processes ask for payslips in official currency.",
        verification:
          "Tax and social obligations never go away: withholdings, contributions and slips are still calculated and filed in official currency.",
      },
      sourcesTitre: "Sources consulted",
      avertissement:
        "This is not legal advice. Check with an accountant or a lawyer in the country concerned before paying a salary in cryptocurrency.",
    },

    vosChiffres: {
      titre: "Your numbers",
      mesure: (n: number, paire: string) =>
        `Measured on your last ${n} ${paire} payments.`,
      defaut:
        "Estimates, until you enter past payments along this route.",
      indecomposable:
        "Your payments on this route are recorded, but at amounts this size the estimated fixed fees already exceed the total gap observed, so the margin hidden in the rate cannot be separated out. Enter your real fees below to reveal it.",
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
        `${jours} day${jours > 1 ? "s" : ""} of waiting, or about ${montant} of uncertainty on this payment.`,
      expositionCourte: "The payment is due today: there is no wait to price.",
      decalage: (prevue: string, reelle: string, jours: number) =>
        `${prevue} is not a transfer day. The payment will leave on ${reelle}, ${jours} day${jours > 1 ? "s" : ""} later than you chose.`,
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

    hypotheses: {
      titre: "Your real fees",
      intro:
        "Until you enter your own figures, RateGuard shows wide ranges, because fees depend entirely on your bank and your volume. Enter what you actually pay and the ranges tighten.",
      parDefaut:
        "Default figures. Amounts are shown as ranges because they don't come from your bank.",
      personnalise:
        "Your figures. The ranges now reflect only the movement of the rate.",
      virementFixe: "International wire fee",
      virementIntermediaire: "Correspondent bank fee",
      virementReception: "Receiving fee",
      virementMargePct: "Your bank's margin in the rate (%)",
      specialisteMargePct: "A transfer specialist's margin (%)",
      specialisteFixe: "Specialist's fixed fee",
      forwardPrimePct: "Premium to lock the rate (%)",
      multiDeviseMargePct: "Multi-currency account margin (%)",
      multiDeviseMensuel: "Monthly account subscription",
      reinitialiser: "Back to default estimates",
      appliquer: "Use my figures",
    },

    decision: {
      titre: "Keep a record",
      corps:
        "Note the option you chose. RateGuard freezes the rate and its date: in six weeks you'll be able to explain this choice with what you knew that day, not with what you know by then.",
      bouton: "Record this decision",
      enregistree: "Decision recorded",
      journal: "Decisions already recorded",
      colonneDate: "Recorded on",
      colonneOption: "Option chosen",
      colonneTaux: "Rate that day",
      colonneCout: "Estimated cost",
      vide: "No decision recorded for this person.",
    },
  },

  donnees: {
    titre: "Where the data comes from",
    intro:
      "A tool that shows numbers owes you their source, their date, and what it doesn't know. This page answers all three.",

    taux: {
      titre: "Exchange rates",
      corps: [
        "Rates come from the Frankfurter API, which redistributes the reference rates published by the European Central Bank. It is a public, free and verifiable source — you can query the same address we do.",
        "The ECB publishes one rate per business day, around 4 p.m. Central European Time. There are no weekends or holidays in the series. A rate looked up on a Saturday is Friday's, so RateGuard always shows the rate's date rather than saying 'now'.",
        "This is not a tradeable rate: it is a reference. Your bank will apply its own, worse rate when the transfer goes through. Live rates are sold by commercial providers; we preferred a free, transparent source over a paid, opaque one.",
      ],
      devisesAbsentes:
        "The ECB publishes only about thirty currencies. For all the others — Saudi riyal, naira, dirham, Argentine peso and many more — RateGuard shows no rate and says so on screen, rather than rebuilding one through a detour that would look like a measurement.",
    },

    statistiques: {
      titre: "The movement statistics",
      corps: [
        "Volatility is the standard deviation of the rate's daily changes, computed on the pair's real history, then annualised by multiplying by the square root of 252 — the number of trading sessions in a year.",
        "The amplitudes shown are measured over rolling windows exactly as long as your pay cycle. If you pay every two weeks, we look at every two-week period in the history and report their distribution.",
        "Those windows overlap, which correlates the observations and slightly narrows the extremes. It's a deliberate trade-off: one year of history contains only twenty-six non-overlapping fortnights, far too few for a percentile.",
        "Below twenty daily changes or ten windows, no statistic is published. The screen says 'not enough data'.",
      ],
    },

    frais: {
      titre: "The fees",
      corps: [
        "The default fees are publicly observed orders of magnitude for a Canadian small business. They come from no bank in particular and constitute no price offer.",
        "That's why they appear as ranges, plus or minus 35%. The challenge brief says it itself: correspondent bank fees may only be known after the transfer. Showing an amount to the cent on a figure that cannot be known would be false precision.",
        "As soon as you enter your own figures, the fee range disappears and only rate uncertainty remains. The interface changes its label so you always know which one you're looking at.",
      ],
    },

    crypto: {
      titre: "The crypto regulatory information",
      corps: [
        "Each country card was built by reading identified public sources, never from a language model's memory. The sources are listed under each card and the last verification date is shown.",
        "Countries we haven't checked appear as unverified. We do not infer a country's status from its neighbours'.",
        "Regulation moves fast. A card several months old should be re-checked before any decision.",
      ],
      derniere: "Country cards last verified",
      paysVerifies: "Countries verified",
    },

    stockage: {
      titre: "Where your data goes",
      supabase:
        "Your people and your decisions are stored in a Supabase database, attached to a workspace identifier generated by your browser. There is no account, no password, and no email address requested.",
      local:
        "No database is configured: everything stays in your browser's local storage and never leaves your machine. Clearing the site data erases it all.",
    },

    lexiqueTitre: "The words used on screen",

    limites: {
      titre: "What RateGuard does not do",
      liste: [
        "Does not predict any exchange rate and never tells you when to send your money. Over a few weeks, a rate's direction cannot be predicted from its past.",
        "Does not move, transfer or hold any funds. It is a calculation tool.",
        "Gets no quote from your bank or from any provider.",
        "Gives no financial advice, no legal advice and no tax opinion.",
      ],
    },
  },

  conformite: {
    titre: "Managing currency risk without a forward contract",
    intro:
      "The forward contract is the classic instrument for locking a rate. It raises objections in Islamic law, and it isn't the only path anyway. This page lays out the others, and presents the debate rather than settling it.",

    sansInstrument: {
      titre: "The paths that need no arrangement at all",
      corps: [
        "Pay early. Converting as soon as you have the funds removes the risk, because there is no longer a delay between receiving and paying. A spot exchange raises no objection in any school.",
        "Invoice or contract in your own currency. If your contractor agrees to be paid in Canadian dollars, the risk changes hands. That's a negotiation, not a financial instrument.",
        "Match your flows. If part of your revenue already arrives in US dollars, it naturally cancels part of what you owe in US dollars.",
        "Hold the currency in advance in a multi-currency account. You convert when you have the money and pay later: the risk disappears, but your cash is tied up.",
      ],
      note: "None of these four paths requires a particular financial institution or a contested scholarly opinion. They are rarely explained to small businesses, because nobody has anything to sell them on top.",
    },

    wad: {
      titre: "Wa'd, a unilateral promise",
      corps: [
        "Currency forwards raise an objection in Islamic law: the exchange of the two currencies is deferred on both sides, which conflicts with the requirement of simultaneity in sarf, the exchange of monies.",
        "Wa'd is another avenue. It is a unilateral promise: only one party undertakes to conclude an exchange at an agreed rate on a given date. Since only one party is bound, the arrangement is not a reciprocal forward exchange contract, and the exchange itself settles on the spot when the day comes.",
        "AAOIFI, the international body that issues Islamic finance standards, addresses the promise and its binding character in its Shariah Standard No. 65 (Wa'd). That is the reference to cite if you explore this path with an institution.",
      ],
      norme: "AAOIFI Shariah Standard No. 65 — Promise (Wa'd)",
    },

    desaccord: {
      titre: "Scholars do not agree",
      corps: [
        "Whether a promise is binding is not settled. Some jurists hold that a promise binds morally but not legally, and that making it enforceable amounts to rebuilding the very forward contract one was trying to avoid.",
        "Others hold that a promise may be made binding where a genuine need exists and the other party has incurred costs relying on it — the situation of a business that has already signed with its contractors.",
        "A third critique, of substance, holds that these arrangements economically reproduce the conventional instrument in another form, and that formal compliance is not enough.",
        "None of these positions is 'the' Islamic position. They coexist, and the choice rests on an opinion you should seek from your own advisor, describing your precise situation.",
      ],
    },

    cryptoFiqh: {
      titre: "And crypto?",
      corps: [
        "The status of cryptocurrencies is likewise an open scholarly debate: some jurists treat them as tradeable property, others refuse them the quality of money, others still distinguish according to what backs the token.",
        "RateGuard settles this no more than anything else. Each person's regulatory section says what the country's law allows; the question of religious permissibility is separate and is yours.",
      ],
    },

    disclaimer:
      "This page is informational content. It is not a religious ruling, financial advice or legal advice. The standards are cited so you can continue the discussion with qualified people of your choosing.",
  },

  piedDePage:
    "RateGuard does not move, transfer or hold any funds, and predicts no exchange rate. The fees shown are estimates based on public orders of magnitude, never quotes from your bank.",
};
