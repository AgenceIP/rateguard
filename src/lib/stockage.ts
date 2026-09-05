import type { Forfait } from "./types";

/**
 * Persistance locale des forfaits.
 *
 * Pas de base de données : RateGuard ne détient aucune donnée de l'agence sur
 * un serveur. Tout reste dans le navigateur de l'utilisateur, ce qui est aussi
 * la réponse honnête à « où vont mes chiffres ». La clé porte une version pour
 * pouvoir invalider un ancien format sans faire planter l'écran d'accueil.
 */
const CLE = "rateguard.forfaits.v1";

export function lireForfaits(): Forfait[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return [];
    const donnees = JSON.parse(brut);
    return Array.isArray(donnees) ? (donnees as Forfait[]) : [];
  } catch {
    // Un localStorage corrompu ne doit jamais empêcher l'app de démarrer.
    return [];
  }
}

export function lireForfait(id: string): Forfait | undefined {
  return lireForfaits().find((forfait) => forfait.id === id);
}

export function enregistrerForfait(forfait: Forfait): void {
  const forfaits = lireForfaits();
  window.localStorage.setItem(CLE, JSON.stringify([forfait, ...forfaits]));
}

export function supprimerForfait(id: string): void {
  const restants = lireForfaits().filter((forfait) => forfait.id !== id);
  window.localStorage.setItem(CLE, JSON.stringify(restants));
}
