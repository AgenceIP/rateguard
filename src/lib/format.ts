import type { Devise } from "./types";

/**
 * Formatage d'affichage — c'est le seul endroit où l'on arrondit.
 * Les fonctions de calcul travaillent en pleine précision (voir calculs.ts).
 */

const LOCALE = "fr-CA";

const montantCAD = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const montantCADPrecis = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateLongue = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "long",
});

const dateHeure = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "long",
  timeStyle: "short",
});

export function formaterCAD(valeur: number, precis = false): string {
  return (precis ? montantCADPrecis : montantCAD).format(valeur);
}

export function formaterDevise(valeur: number, devise: Devise): string {
  if (devise === "CAD") return formaterCAD(valeur);
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(valeur)} ${devise}`;
}

/** Un taux de change se lit à 4 décimales, pas 2. */
export function formaterTaux(valeur: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(valeur);
}

export function formaterPourcentage(valeur: number, decimales = 1): string {
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur)} %`;
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
  return dateLongue.format(new Date(`${iso}T12:00:00`));
}

export function formaterHorodatage(ms: number): string {
  return dateHeure.format(new Date(ms));
}

/** Date du jour au format yyyy-mm-dd, pour les valeurs par défaut du formulaire. */
export function aujourdhuiISO(decalageJours = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + decalageJours);
  return date.toISOString().slice(0, 10);
}
