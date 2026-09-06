/**
 * Pays proposés à la saisie, avec leur devise de paiement usuelle.
 *
 * Aucun nom de pays ni de devise n'est écrit ici : `Intl.DisplayNames` et
 * `Intl.NumberFormat` les rendent dans la langue active du navigateur. Une
 * table de traduction manuelle serait à la fois plus longue et périmée.
 *
 * La liste couvre les corridors de paie internationale les plus courants
 * depuis le Canada. Elle n'a pas vocation à être exhaustive : ce qui compte
 * est que chaque pays retenu ait une devise juste, et que la fiche crypto
 * correspondante dise honnêtement si elle a été vérifiée ou non.
 */
export const PAYS_DEVISE: Record<string, string> = {
  AE: "AED",
  AR: "ARS",
  AU: "AUD",
  BD: "BDT",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  CO: "COP",
  DE: "EUR",
  EG: "EGP",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  ID: "IDR",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  KE: "KES",
  MA: "MAD",
  MX: "MXN",
  NG: "NGN",
  NL: "EUR",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PT: "EUR",
  RO: "RON",
  SA: "SAR",
  SG: "SGD",
  SV: "USD",
  TR: "TRY",
  UA: "UAH",
  US: "USD",
  VN: "VND",
  ZA: "ZAR",
};

/** Devises proposées comme devise de base de l'entreprise. */
export const DEVISES_BASE = ["CAD", "USD", "EUR", "GBP", "AUD", "CHF"];

export const CODES_PAYS = Object.keys(PAYS_DEVISE);

/**
 * Devises que la BCE ne publie pas via Frankfurter. Un paiement dans l'une
 * d'elles ne peut pas être chiffré et l'interface doit le dire au lieu
 * d'inventer un taux.
 */
export const DEVISES_NON_PUBLIEES = [
  "AED",
  "ARS",
  "BDT",
  "COP",
  "EGP",
  "KES",
  "MAD",
  "NGN",
  "PKR",
  "SAR",
  "UAH",
  "VND",
];

/** Nom lisible d'un pays dans la langue demandée, via l'API du navigateur. */
export function nomPays(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

/** Nom lisible d'une devise. « dollar américain » plutôt que « USD ». */
export function nomDevise(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}
