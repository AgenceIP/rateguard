import type { Devise } from "./types";

/**
 * Formatage d'affichage — c'est le seul endroit où l'on arrondit.
 * Les fonctions de calcul travaillent en pleine précision (voir calculs.ts).
 */

export type Langue = "fr" | "en";

const LOCALES: Record<Langue, string> = { fr: "fr-CA", en: "en-CA" };

function construire(locale: string) {
  return {
    locale,
    // « 10,7 % » en français, « 10.7% » en anglais : l'espace fait partie de
    // la typographie française, pas de la valeur.
    espaceAvantPourcent: locale.startsWith("fr") ? "\u00a0" : "",
    cad: new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }),
    cadPrecis: new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    entier: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    taux: new Intl.NumberFormat(locale, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }),
    dateLongue: new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    dateHeure: new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
    }),
  };
}

let f = construire(LOCALES.fr);

/**
 * Appelée pendant le rendu par le fournisseur de langue, avant que les enfants
 * ne formatent quoi que ce soit. Un seul état de langue existe à la fois côté
 * navigateur ; le serveur, lui, ne rend aucun nombre localisé (les pages qui en
 * affichent lisent le localStorage et n'ont donc pas de contenu au SSR).
 */
export function definirLangueFormat(langue: Langue): void {
  if (f.locale === LOCALES[langue]) return;
  f = construire(LOCALES[langue]);
}

export function formaterCAD(valeur: number, precis = false): string {
  return (precis ? f.cadPrecis : f.cad).format(valeur);
}

export function formaterDevise(valeur: number, devise: Devise): string {
  if (devise === "CAD") return formaterCAD(valeur);
  return `${f.entier.format(valeur)} ${devise}`;
}

/** Un taux de change se lit à 4 décimales, pas 2. */
export function formaterTaux(valeur: number): string {
  return f.taux.format(valeur);
}

export function formaterPourcentage(valeur: number, decimales = 1): string {
  const nombre = new Intl.NumberFormat(f.locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur);
  return `${nombre}${f.espaceAvantPourcent}%`;
}

/** Pourcentage signé — le signe porte du sens dans les scénarios. */
export function formaterPourcentageSigne(valeur: number, decimales = 1): string {
  const signe = valeur > 0 ? "+" : valeur < 0 ? "−" : "";
  return `${signe}${formaterPourcentage(Math.abs(valeur), decimales)}`;
}

export function formaterCADSigne(valeur: number): string {
  const signe = valeur > 0 ? "+" : valeur < 0 ? "−" : "";
  return `${signe}${formaterCAD(Math.abs(valeur))}`;
}

export function formaterDate(iso: string): string {
  return f.dateLongue.format(new Date(`${iso}T12:00:00`));
}

export function formaterHorodatage(ms: number): string {
  return f.dateHeure.format(new Date(ms));
}

/** Date du jour au format yyyy-mm-dd, pour les valeurs par défaut du formulaire. */
export function aujourdhuiISO(decalageJours = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + decalageJours);
  return date.toISOString().slice(0, 10);
}
