/**
 * Le calendrier : quand un paiement part réellement, et à quel point une
 * période est agitée.
 *
 * CE QUE CE MODULE NE FAIT PAS. Il ne dit jamais quelle semaine est
 * « meilleure ». Une carte de saisonnalité directionnelle — « le CAD est plus
 * fort en semaine 32 » — serait la ligne rouge du défi déguisée en
 * statistique, et sur des données de change ces motifs sont presque toujours
 * du bruit non reproductible. Tout ce qui sort d'ici est une AMPLITUDE, donc
 * une valeur absolue, donc muette sur le sens.
 */

const JOUR_MS = 86_400_000;

/** Parse une date ISO en UTC. Le constructeur local décalerait d'un jour. */
function utc(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00Z`);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Dimanche de Pâques par l'algorithme grégorien anonyme.
 *
 * Deux des six fériés TARGET2 en dépendent, et ils se déplacent de plus d'un
 * mois d'une année sur l'autre : une liste écrite à la main serait fausse
 * l'année prochaine.
 */
function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const jours = h + l - 7 * m + 114;
  return new Date(Date.UTC(annee, Math.floor(jours / 31) - 1, (jours % 31) + 1));
}

/**
 * Jours fériés TARGET2 — les jours où le système de règlement de l'euro est
 * fermé, donc où la BCE ne publie aucun taux de référence.
 */
export function joursFeriesTarget(annee: number): string[] {
  const dimanche = paques(annee);
  const decale = (n: number) => iso(new Date(dimanche.getTime() + n * JOUR_MS));
  return [
    `${annee}-01-01`,
    decale(-2), // Vendredi saint
    decale(1), // Lundi de Pâques
    `${annee}-05-01`,
    `${annee}-12-25`,
    `${annee}-12-26`,
  ];
}

/** true si un virement daté de ce jour peut réellement partir ce jour-là. */
export function estSeance(dateIso: string): boolean {
  const d = utc(dateIso);
  const jour = d.getUTCDay();
  if (jour === 0 || jour === 6) return false;
  return !joursFeriesTarget(d.getUTCFullYear()).includes(dateIso);
}

/**
 * La date à laquelle le paiement partira vraiment, et le nombre de jours de
 * dérive que l'utilisateur subit sans l'avoir choisi.
 */
export function prochaineSeance(dateIso: string): {
  date: string;
  decalageJours: number;
} {
  let d = utc(dateIso);
  let decalageJours = 0;
  // Bornée : une fermeture de plus de dix jours consécutifs n'existe pas.
  while (!estSeance(iso(d)) && decalageJours < 10) {
    d = new Date(d.getTime() + JOUR_MS);
    decalageJours++;
  }
  return { date: iso(d), decalageJours };
}
