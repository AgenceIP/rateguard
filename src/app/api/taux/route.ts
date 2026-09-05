import { NextResponse } from "next/server";

import { PEG_SAR_PAR_USD } from "@/lib/benchmarks";
import type { DeviseCible, SourceTaux } from "@/lib/types";

const FRANKFURTER = "https://api.frankfurter.app/latest";

/**
 * Proxy vers Frankfurter (taux de référence de la BCE).
 *
 * Deux raisons de passer par une route serveur plutôt que d'appeler l'API
 * depuis le navigateur : éviter de dépendre du CORS de Frankfurter pendant une
 * démo live, et mutualiser le cache entre tous les visiteurs.
 *
 * La BCE ne publie pas le riyal saoudien. On demande quand même la paire
 * CAD/SAR — si elle apparaît un jour, on l'utilise directement — et on retombe
 * sinon sur CAD/USD converti par le peg saoudien. Le drapeau `viaPegUsd` remonte
 * jusqu'à l'interface : le chemin emprunté est affiché, jamais masqué.
 */
export const revalidate = 3600;

export async function GET(request: Request) {
  const parametres = new URL(request.url).searchParams;
  const cible: DeviseCible = parametres.get("cible") === "USD" ? "USD" : "SAR";

  try {
    const reponse = await fetch(
      `${FRANKFURTER}?from=CAD&to=${cible === "SAR" ? "SAR,USD" : "USD"}`,
      { next: { revalidate } },
    );
    if (!reponse.ok) {
      return NextResponse.json(
        { erreur: "Taux indisponible auprès de la source." },
        { status: 502 },
      );
    }

    const donnees = (await reponse.json()) as {
      date: string;
      rates: Record<string, number>;
    };

    const tauxDirect = donnees.rates[cible];
    const tauxUsd = donnees.rates.USD;

    if (typeof tauxDirect !== "number" && typeof tauxUsd !== "number") {
      return NextResponse.json(
        { erreur: "La source n'a retourné aucun taux exploitable." },
        { status: 502 },
      );
    }

    const viaPegUsd = typeof tauxDirect !== "number";
    const taux = viaPegUsd ? tauxUsd * PEG_SAR_PAR_USD : tauxDirect;

    const sourceTaux: SourceTaux = {
      fournisseur: "Frankfurter",
      paire: `CAD/${cible}`,
      dateTaux: donnees.date,
      horodatageRecuperation: Date.now(),
      viaPegUsd,
    };

    return NextResponse.json({ taux, sourceTaux });
  } catch {
    return NextResponse.json(
      { erreur: "Impossible de joindre la source de taux." },
      { status: 502 },
    );
  }
}
