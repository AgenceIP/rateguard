import { NextResponse } from "next/server";

const FRANKFURTER = "https://api.frankfurter.dev/v1/latest";

/**
 * Taux de clôture du jour, via Frankfurter (taux de référence de la BCE).
 *
 * Deux raisons de passer par une route serveur plutôt que d'appeler l'API
 * depuis le navigateur : ne pas dépendre du CORS de Frankfurter pendant une
 * démo, et mutualiser le cache entre tous les visiteurs.
 *
 * IMPORTANT, et remonté jusqu'à l'écran : la BCE publie UN taux par jour
 * ouvrable, vers 16 h CET. Ce n'est pas un taux négociable en direct, et il
 * n'y en a pas la fin de semaine. `dateTaux` dit de quel jour il s'agit ;
 * l'interface affiche cette date plutôt que « maintenant ».
 */
export const revalidate = 3600;

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const de = (p.get("de") ?? "CAD").toUpperCase();
  const vers = (p.get("vers") ?? "USD").toUpperCase();

  if (de === vers) {
    return NextResponse.json({
      disponible: true,
      taux: 1,
      de,
      vers,
      dateTaux: new Date().toISOString().slice(0, 10),
      fournisseur: "identité",
    });
  }

  try {
    const reponse = await fetch(`${FRANKFURTER}?base=${de}&symbols=${vers}`, {
      next: { revalidate },
    });

    if (!reponse.ok) {
      // 404 de Frankfurter = devise non publiée par la BCE. Ce n'est pas une
      // panne, c'est une absence de donnée, et l'appelant doit la distinguer.
      return NextResponse.json(
        {
          disponible: false,
          de,
          vers,
          motif: reponse.status === 404 ? "devise_non_publiee" : "source_indisponible",
        },
        { status: 200 },
      );
    }

    const donnees = (await reponse.json()) as {
      date: string;
      rates: Record<string, number>;
    };
    const taux = donnees.rates?.[vers];

    if (typeof taux !== "number" || !Number.isFinite(taux) || taux <= 0) {
      return NextResponse.json(
        { disponible: false, de, vers, motif: "devise_non_publiee" },
        { status: 200 },
      );
    }

    return NextResponse.json({
      disponible: true,
      taux,
      de,
      vers,
      dateTaux: donnees.date,
      fournisseur: "Frankfurter",
    });
  } catch {
    return NextResponse.json(
      { disponible: false, de, vers, motif: "source_indisponible" },
      { status: 200 },
    );
  }
}
