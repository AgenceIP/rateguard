/**
 * Formatage d'affichage — le seul endroit où l'on arrondit.
 * Les modules de calcul travaillent en pleine précision.
 *
 * L'application manipule une trentaine de devises : rien n'est codé en dur ici,
 * `Intl.NumberFormat` connaît déjà le symbole, la position et le nombre de
 * décimales de chacune (le yen n'en a pas, le dinar en a trois).
 */

export type Langue = "fr" | "en";

const LOCALES: Record<Langue, string> = { fr: "fr-CA", en: "en-CA" };

let locale = LOCALES.fr;

/**
 * L'espace insécable avant « % » appartient à la typographie française, pas à
 * la valeur : « 10,7 % » en français, « 10.7% » en anglais.
 */
function espaceAvantPourcent(): string {
  return locale.startsWith("fr") ? " " : "";
}

/**
 * Les formateurs sont mis en cache : en construire un par cellule d'un tableau
 * de trente lignes est mesurablement lent, et `Intl` est réputé coûteux.
 */
const cache = new Map<string, Intl.NumberFormat>();

function nombre(cle: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const pleine = `${locale}|${cle}`;
  const existant = cache.get(pleine);
  if (existant) return existant;
  const cree = new Intl.NumberFormat(locale, options);
  cache.set(pleine, cree);
  return cree;
}

export function definirLangueFormat(langue: Langue): void {
  locale = LOCALES[langue];
}

/** Locale active, pour les modules qui appellent `Intl.DisplayNames`. */
export function localeActive(): string {
  return locale;
}

/**
 * Montant dans sa devise. `decimales` à 0 pour les grands nombres d'un tableau,
 * à 2 quand le cent compte — un écart de frais de 4 $ ne doit pas s'afficher
 * « 0 $ » sous prétexte d'arrondi.
 */
export function formaterMontant(
  valeur: number,
  devise: string,
  decimales: 0 | 2 = 0,
): string {
  if (!Number.isFinite(valeur)) return "—";
  return nombre(`c${devise}${decimales}`, {
    style: "currency",
    currency: devise,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur);
}

/** Montant signé, pour les écarts. Le « + » est explicite. */
export function formaterMontantSigne(valeur: number, devise: string): string {
  if (!Number.isFinite(valeur)) return "—";
  const signe = valeur > 0 ? "+" : valeur < 0 ? "−" : "";
  return signe + formaterMontant(Math.abs(valeur), devise, 0);
}

/** Un taux de change s'affiche à quatre décimales, jamais arrondi plus court. */
export function formaterTaux(valeur: number): string {
  if (!Number.isFinite(valeur)) return "—";
  return nombre("taux", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(valeur);
}

export function formaterPourcentage(valeur: number, decimales = 1): string {
  if (!Number.isFinite(valeur)) return "—";
  return (
    nombre(`p${decimales}`, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valeur) +
    espaceAvantPourcent() +
    "%"
  );
}

export function formaterEntier(valeur: number): string {
  if (!Number.isFinite(valeur)) return "—";
  return nombre("entier", { maximumFractionDigits: 0 }).format(valeur);
}

/** Date ISO « 2026-09-04 » → « 4 septembre 2026 ». */
export function formaterDate(iso: string): string {
  if (!iso) return "—";
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return iso;
  // Construite en heure locale : `new Date("2026-09-04")` est interprétée en
  // UTC et recule d'un jour à l'ouest de Greenwich.
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(a, m - 1, j),
  );
}

export function formaterHorodatage(ms: number): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(ms));
}

/** Date du jour au format ISO, en heure locale. */
export function aujourdhuiISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Nombre de jours civils entre aujourd'hui et une date ISO. Négatif si passée. */
export function joursAvant(iso: string): number {
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return 0;
  const cible = new Date(a, m - 1, j);
  const maintenant = new Date();
  const minuit = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
  );
  return Math.round((cible.getTime() - minuit.getTime()) / 86_400_000);
}
