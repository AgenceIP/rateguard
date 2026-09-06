import type { Langue } from "@/lib/format";
import type { FicheCrypto, StatutCrypto } from "@/lib/types";

/**
 * Statut réglementaire du versement d'un salaire en cryptomonnaie, par pays.
 *
 * TENUE À JOUR À LA MAIN, ET C'EST VOULU. Aucune de ces fiches ne vient de la
 * mémoire d'un modèle de langage : chacune porte ses sources et la date à
 * laquelle un humain les a lues. L'interface affiche cette date, parce qu'une
 * information réglementaire sans date n'a aucune valeur.
 *
 * Un pays absent de cette table ne reçoit PAS de valeur par défaut optimiste :
 * `ficheCrypto` retourne « non vérifié » et l'interface le dit. Le défi le
 * demande explicitement — mieux vaut un trou déclaré qu'une extrapolation.
 *
 * Le texte est bilingue et vit ici plutôt que dans `src/i18n` : une fiche
 * réglementaire ne se sépare pas de ses sources ni de sa date. Les sources,
 * elles, ne sont pas traduites — un titre de publication se cite tel quel.
 *
 * Ce n'est pas un avis juridique. Toutes les fiches se terminent, à l'écran,
 * par un renvoi vers un comptable ou un avocat du pays concerné.
 */

const VERIFIE_LE = "2026-09-05";

interface Texte {
  resume: string;
  risques: string[];
}

interface Fiche {
  statut: StatutCrypto;
  fr: Texte;
  en: Texte;
  sources: { titre: string; url: string }[];
}

const FICHES: Record<string, Fiche> = {
  US: {
    statut: "fiat_obligatoire",
    fr: {
      resume:
        "Le salaire de base doit être versé en dollars américains. La crypto n'est admise que pour la part qui dépasse les minimums légaux, avec le consentement écrit du salarié.",
      risques: [
        "Le règlement fédéral 29 C.F.R. §531.27 exige un paiement « en espèces ou en instrument négociable au pair » ; la crypto n'entre pas dans cette définition.",
        "Plusieurs États — Californie, Illinois, Texas, New Jersey, Pennsylvanie et d'autres — imposent en plus le paiement en monnaie américaine.",
        "L'IRS traite la crypto comme un bien : retenues à la source, FICA, FUTA et déclaration W-2 ou 1099-NEC restent dus, évalués en dollars au jour du versement.",
        "Un contractant indépendant peut en général accepter la crypto directement : la contrainte vise surtout le salariat.",
      ],
    },
    en: {
      resume:
        "Base wages must be paid in US dollars. Crypto is only allowed for the portion above the legal minimums, with the employee's written consent.",
      risques: [
        "Federal regulation 29 C.F.R. §531.27 requires payment 'in cash or negotiable instrument payable at par'; crypto does not meet that definition.",
        "Several states — California, Illinois, Texas, New Jersey, Pennsylvania and others — additionally require payment in US currency.",
        "The IRS treats crypto as property: withholding, FICA, FUTA and W-2 or 1099-NEC reporting still apply, valued in dollars on the day of payment.",
        "An independent contractor can generally accept crypto directly: the constraint mainly targets employment.",
      ],
    },
    sources: [
      {
        titre: "U.S. DOL / 29 C.F.R. §531.27 — analyse Thomson Reuters",
        url: "https://tax.thomsonreuters.com/blog/can-employers-pay-wages-in-cryptocurrency/",
      },
      {
        titre: "Morrison Foerster — Paying Employees in Cryptocurrency",
        url: "https://www.mofo.com/resources/insights/220407-paying-employees-cryptocurrency-lawful",
      },
    ],
  },
  CA: {
    statut: "fiat_obligatoire",
    fr: {
      resume:
        "Le salaire doit être payé en dollars canadiens, par un mode prévu par la loi. La crypto ne peut servir que de prime supplémentaire, volontaire et documentée.",
      risques: [
        "La Loi de 2000 sur les normes d'emploi de l'Ontario limite le paiement à l'espèce, au chèque ou au dépôt direct ; le ministère du Travail a indiqué qu'un paiement en bitcoin n'est pas conforme.",
        "Dans Hou c. Kinglory Inc. (2023), la Commission des relations de travail de l'Ontario a jugé nulle une clause payant la moitié du salaire dans le jeton de l'employeur.",
        "L'ARC traite l'opération comme un troc : retenues, versements et feuillets restent calculés et déclarés en dollars canadiens.",
      ],
    },
    en: {
      resume:
        "Wages must be paid in Canadian dollars, through a method the law provides for. Crypto can only serve as an additional bonus, voluntary and documented.",
      risques: [
        "Ontario's Employment Standards Act, 2000 limits payment to cash, cheque or direct deposit; the Ministry of Labour has indicated that payment in bitcoin is not compliant.",
        "In Hou v. Kinglory Inc. (2023), the Ontario Labour Relations Board voided a clause paying half the salary in the employer's own token.",
        "The CRA treats the transaction as barter: withholdings, remittances and slips are still calculated and filed in Canadian dollars.",
      ],
    },
    sources: [
      {
        titre: "Stikeman Elliott — Paying Employees in Crypto May Be Possible",
        url: "https://stikeman.com/en-CA/kh/canadian-employment-labour-pension-law/can-i-help-my-employees-go-to-the-moon-paying-employees-in-crypto-may-be-possible",
      },
      {
        titre: "George Waggott Law — Paying Canadian Employees in Crypto",
        url: "https://www.georgewaggott.com/publications/paying-canadian-employees-in-crypto-beware-of-compliance-issues",
      },
    ],
  },
  GB: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "Verser une partie du salaire en crypto est possible, mais cette part ne compte pas dans le salaire minimum national : le minimum doit être payé en livres.",
      risques: [
        "Les cryptoactifs sont des avantages en nature au sens du règlement 10 des National Minimum Wage Regulations 2015 et n'entrent pas dans la rémunération retenue pour le NMW.",
        "Le HMRC impose la crypto reçue en salaire comme un revenu d'emploi, prélevé via PAYE.",
        "L'encadrement des sociétés crypto par la FCA entre en vigueur à partir de 2027 et peut modifier les circuits de paiement disponibles.",
      ],
    },
    en: {
      resume:
        "Paying part of a salary in crypto is possible, but that portion does not count towards the national minimum wage: the minimum must be paid in pounds.",
      risques: [
        "Cryptoassets are payments in kind under regulation 10 of the National Minimum Wage Regulations 2015 and do not count towards NMW pay.",
        "HMRC taxes crypto received as salary as employment income, collected through PAYE.",
        "FCA regulation of crypto firms takes effect from 2027 and may change which payment routes are available.",
      ],
    },
    sources: [
      {
        titre:
          "ICAS — Are your clients thinking of paying employees in cryptocurrency?",
        url: "https://www.icas.com/news-insights-events/news/tax/are-your-clients-thinking-of-paying-employees-in-cryptocurrency",
      },
      {
        titre: "PKF Littlejohn — Salary as cryptocurrency",
        url: "https://www.pkf-l.com/insights/salary-as-cryptocurrency-what-it-means-for-employers-and-employees/",
      },
    ],
  },
  DE: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "Le versement d'un salaire en crypto est admis avec le consentement du salarié, dans un cadre encore fragmenté au niveau européen.",
      risques: [
        "Le consentement doit être écrit et préciser le montant, le mode de paiement et le mécanisme de conversion retenu.",
        "MiCA encadre l'activité sur cryptoactifs mais ne règle pas les questions propres à la paie, qui restent nationales.",
      ],
    },
    en: {
      resume:
        "Paying a salary in crypto is allowed with the employee's consent, within a framework still fragmented across Europe.",
      risques: [
        "Consent must be in writing and specify the amount, the payment method and the conversion mechanism used.",
        "MiCA regulates cryptoasset activity but does not settle payroll-specific questions, which remain national.",
      ],
    },
    sources: [
      {
        titre:
          "Ogletree — Crypto Payrolls: Compliance Considerations for Global Employers",
        url: "https://ogletree.com/insights-resources/blog-posts/crypto-payrolls-opportunities-and-compliance-considerations-for-global-employers/",
      },
    ],
  },
  FR: {
    statut: "fiat_obligatoire",
    fr: {
      resume:
        "Le salaire doit être versé en monnaie ayant cours légal, donc en euros.",
      risques: [
        "Un versement en crypto ne libère pas l'employeur de son obligation salariale.",
        "MiCA encadre les prestataires mais ne crée aucune dérogation en droit du travail.",
      ],
    },
    en: {
      resume: "Wages must be paid in legal tender, which means in euros.",
      risques: [
        "A payment in crypto does not discharge the employer's wage obligation.",
        "MiCA regulates service providers but creates no exemption in employment law.",
      ],
    },
    sources: [
      {
        titre:
          "Ogletree — Crypto Payrolls: Compliance Considerations for Global Employers",
        url: "https://ogletree.com/insights-resources/blog-posts/crypto-payrolls-opportunities-and-compliance-considerations-for-global-employers/",
      },
    ],
  },
  CH: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "La crypto est admise en complément, mais une partie du salaire doit rester versée en monnaie traditionnelle.",
      risques: [
        "La part en monnaie légale doit couvrir les obligations minimales.",
        "Les obligations sociales et fiscales restent calculées en francs.",
      ],
    },
    en: {
      resume:
        "Crypto is allowed as a supplement, but part of the salary must still be paid in traditional currency.",
      risques: [
        "The legal-tender portion must cover the minimum obligations.",
        "Social and tax obligations are still calculated in francs.",
      ],
    },
    sources: [
      {
        titre: "Toku — Crypto Salaries: Legal Status and Tax Rules by Country",
        url: "https://www.toku.com/resources/crypto-salaries-explained",
      },
    ],
  },
  SG: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "Le versement en crypto est possible dans le cadre du Payment Services Act, à condition de tenir une déclaration rigoureuse et de respecter les obligations anti-blanchiment.",
      risques: [
        "Obligations de reporting et de conformité AML renforcées, en particulier sur les flux transfrontaliers.",
        "La valorisation au jour du versement doit être documentée.",
      ],
    },
    en: {
      resume:
        "Paying in crypto is possible under the Payment Services Act, provided reporting is rigorous and anti-money-laundering obligations are met.",
      risques: [
        "Heightened reporting and AML compliance obligations, particularly on cross-border flows.",
        "Valuation on the day of payment must be documented.",
      ],
    },
    sources: [
      {
        titre: "Toku — Crypto Salaries: Legal Status and Tax Rules by Country",
        url: "https://www.toku.com/resources/crypto-salaries-explained",
      },
    ],
  },
  JP: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "Le paiement direct en bitcoin ou en ether n'est pas autorisé. Le salaire numérique n'est admis que s'il est convertible en yens, avec un retrait en monnaie possible au moins une fois par mois sans frais.",
      risques: [
        "Les primes peuvent être versées en crypto avec le consentement du salarié, mais restent valorisées en yens et soumises à retenue.",
        "Le prestataire de paiement doit être agréé pour le salaire numérique.",
      ],
    },
    en: {
      resume:
        "Direct payment in bitcoin or ether is not permitted. Digital salary is only allowed if it is convertible into yen, with a fee-free cash withdrawal available at least once a month.",
      risques: [
        "Bonuses may be paid in crypto with the employee's consent, but are still valued in yen and subject to withholding.",
        "The payment provider must be licensed for digital salary.",
      ],
    },
    sources: [
      {
        titre: "Toku — Crypto Salaries: Legal Status and Tax Rules by Country",
        url: "https://www.toku.com/resources/crypto-salaries-explained",
      },
    ],
  },
  CN: {
    statut: "interdit",
    fr: {
      resume:
        "La quasi-totalité des activités liées aux cryptomonnaies est interdite, y compris le versement de salaires en actifs numériques.",
      risques: [
        "L'interdiction couvre aussi les circuits de conversion, ce qui rend le versement inexécutable en pratique.",
      ],
    },
    en: {
      resume:
        "Almost all cryptocurrency activity is prohibited, including paying wages in digital assets.",
      risques: [
        "The ban also covers conversion routes, which makes the payment unworkable in practice.",
      ],
    },
    sources: [
      {
        titre:
          "Ogletree — Crypto Payrolls: Compliance Considerations for Global Employers",
        url: "https://ogletree.com/insights-resources/blog-posts/crypto-payrolls-opportunities-and-compliance-considerations-for-global-employers/",
      },
    ],
  },
  AE: {
    statut: "permis_sous_conditions",
    fr: {
      resume:
        "Le cadre réglementaire est parmi les plus clairs et permet le versement de salaires en stablecoins, sous conditions.",
      risques: [
        "Les règles varient selon la zone franche et l'autorité de tutelle applicable.",
        "Les obligations de vigilance sur l'origine des fonds restent entières.",
      ],
    },
    en: {
      resume:
        "The regulatory framework is among the clearest and allows salaries to be paid in stablecoins, subject to conditions.",
      risques: [
        "Rules vary by free zone and by the supervising authority that applies.",
        "Due-diligence obligations on the source of funds remain in full.",
      ],
    },
    sources: [
      {
        titre: "Toku — What is Stablecoin Payroll? A 2026 Guide for Global Teams",
        url: "https://www.toku.com/resources/what-is-stablecoin-payroll",
      },
    ],
  },
  NG: {
    statut: "fiat_obligatoire",
    fr: {
      resume:
        "Le salaire doit être versé en nairas par les circuits autorisés. Une part en stablecoin doit être montée comme un avantage distinct, valorisé en monnaie locale.",
      risques: [
        "La crypto ne peut pas se substituer à l'obligation salariale.",
        "Les restrictions bancaires locales compliquent la conversion en monnaie locale à l'arrivée.",
      ],
    },
    en: {
      resume:
        "Wages must be paid in naira through authorised channels. A stablecoin portion has to be structured as a separate benefit, valued in local currency.",
      risques: [
        "Crypto cannot substitute for the wage obligation.",
        "Local banking restrictions make conversion into local currency harder on arrival.",
      ],
    },
    sources: [
      {
        titre: "Lisk — Stablecoin payroll works. Scale is where it breaks.",
        url: "https://lisk.com/blog/posts/blog-posts-cross-border-payroll-crypto/",
      },
    ],
  },
  BR: {
    statut: "fiat_obligatoire",
    fr: {
      resume:
        "Le salaire reste dû en réaux. Un projet de loi (PL 957/2025) prévoit d'autoriser explicitement une part du salaire en crypto, mais il n'est pas adopté.",
      risques: [
        "Tant que le projet n'est pas voté, un versement en crypto ne libère pas l'employeur.",
        "Les circuits de conversion vers la monnaie locale peuvent prendre 24 à 72 heures.",
      ],
    },
    en: {
      resume:
        "Wages are still owed in reais. A bill (PL 957/2025) would explicitly allow part of a salary in crypto, but it has not been passed.",
      risques: [
        "Until the bill passes, a payment in crypto does not discharge the employer.",
        "Conversion routes into local currency can take 24 to 72 hours.",
      ],
    },
    sources: [
      {
        titre:
          "Ogletree — Crypto Payrolls: Compliance Considerations for Global Employers",
        url: "https://ogletree.com/insights-resources/blog-posts/crypto-payrolls-opportunities-and-compliance-considerations-for-global-employers/",
      },
    ],
  },
  SV: {
    statut: "cours_legal",
    fr: {
      resume:
        "Le bitcoin a cours légal en vertu de la Bitcoin Law : le salaire peut être versé intégralement en cryptomonnaie.",
      risques: [
        "La volatilité du bitcoin reste entièrement supportée par le salarié entre le versement et la conversion.",
        "Les obligations fiscales et sociales locales continuent de s'appliquer.",
      ],
    },
    en: {
      resume:
        "Bitcoin is legal tender under the Bitcoin Law: a salary can be paid entirely in cryptocurrency.",
      risques: [
        "Bitcoin's volatility is borne entirely by the worker between payment and conversion.",
        "Local tax and social obligations continue to apply.",
      ],
    },
    sources: [
      {
        titre:
          "Ogletree — Crypto Payrolls: Compliance Considerations for Global Employers",
        url: "https://ogletree.com/insights-resources/blog-posts/crypto-payrolls-opportunities-and-compliance-considerations-for-global-employers/",
      },
    ],
  },
};

/**
 * Risques qui ne dépendent d'aucun pays. Ils s'ajoutent toujours aux risques
 * de la fiche : ce sont ceux que le défi demande de nommer explicitement.
 */
export const RISQUES_UNIVERSELS_CLES = [
  "volatilite",
  "conversion",
  "protection",
  "verification",
] as const;

/**
 * Fiche d'un pays, ou fiche « non vérifié » si nous ne l'avons pas lue.
 * Jamais de valeur par défaut permissive.
 */
export function ficheCrypto(pays: string, langue: Langue = "fr"): FicheCrypto {
  const code = pays.toUpperCase();
  const trouvee = FICHES[code];
  if (!trouvee) {
    return {
      pays: code,
      statut: "non_verifie",
      resume: "",
      risques: [],
      sources: [],
      verifieLe: VERIFIE_LE,
    };
  }
  const texte = trouvee[langue];
  return {
    pays: code,
    statut: trouvee.statut,
    resume: texte.resume,
    risques: texte.risques,
    sources: trouvee.sources,
    verifieLe: VERIFIE_LE,
  };
}

/** Codes des pays dont la fiche a réellement été vérifiée. */
export const PAYS_VERIFIES = Object.keys(FICHES);

/** Date de la dernière revue humaine de l'ensemble des fiches. */
export const DERNIERE_VERIFICATION = VERIFIE_LE;

/** Ordre de gravité, du plus contraignant au plus permissif. Sert au tri. */
export const GRAVITE: Record<StatutCrypto, number> = {
  interdit: 0,
  fiat_obligatoire: 1,
  non_verifie: 2,
  permis_sous_conditions: 3,
  cours_legal: 4,
};
