import type { DeviseCible, SourceTaux } from "./types";

export interface TauxCapture {
  taux: number;
  sourceTaux: SourceTaux;
}

/**
 * Récupère le taux mid-market courant via la route /api/taux.
 * Lève une erreur en français, directement affichable à l'utilisateur : à ce
 * stade la seule chose utile à dire, c'est que le taux n'a pas pu être capturé.
 */
export async function recupererTaux(cible: DeviseCible): Promise<TauxCapture> {
  const reponse = await fetch(`/api/taux?cible=${cible}`, { cache: "no-store" });
  if (!reponse.ok) {
    const corps = (await reponse.json().catch(() => null)) as {
      erreur?: string;
    } | null;
    throw new Error(corps?.erreur ?? "Le taux n'a pas pu être récupéré.");
  }
  return (await reponse.json()) as TauxCapture;
}
