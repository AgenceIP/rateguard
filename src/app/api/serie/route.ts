import { NextResponse } from "next/server";

const FRANKFURTER = "https://api.frankfurter.dev/v1";

/**
 * Historique de taux, base de toutes les statistiques de l'application.
 *
 * C'est la route qui remplace les constantes inventées : les amplitudes de
 * mouvement affichées à l'utilisateur ne sortent plus d'un choix arbitraire
 * mais de ce que cette paire a réellement fait sur la période demandée.
 *
 * Frankfurter ne renvoie que les jours ouvrables — il n'y a ni fin de semaine
 * ni jour férié TARGET dans la série. C'est pour ça que `volatilite.ts`
 * convertit les jours civils en séances avant de mesurer quoi que ce soit.
 */
export const revalidate = 21600; // six heures : l'historique bouge une fois par jour

const JOURS_MAX = 1826; // cinq ans

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const de = (p.get("de") ?? "CAD").toUpperCase();
  const vers = (p.get("vers") ?? "USD").toUpperCase();
  const jours = Math.min(
    JOURS_MAX,
    Math.max(30, Number(p.get("jours")) || 365),
  );

  if (de === vers) {
    return NextResponse.json({
      disponible: false,
      de,
      vers,
      motif: "meme_devise",
    });
  }

  const fin = new Date();
  const debut = new Date(fin.getTime() - jours * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const reponse = await fetch(
      `${FRANKFURTER}/${iso(debut)}..${iso(fin)}?base=${de}&symbols=${vers}`,
      { next: { revalidate } },
    );

    if (!reponse.ok) {
      return NextResponse.json({
        disponible: false,
        de,
        vers,
        motif:
          reponse.status === 404 ? "devise_non_publiee" : "source_indisponible",
      });
    }

    const donnees = (await reponse.json()) as {
      rates: Record<string, Record<string, number>>;
    };

    // L'objet JSON ne garantit pas l'ordre des clés : on trie par date, sinon
    // les variations quotidiennes seraient calculées sur une série mélangée.
    const dates = Object.keys(donnees.rates ?? {}).sort();
    const valeurs: number[] = [];
    const datesRetenues: string[] = [];

    for (const date of dates) {
      const valeur = donnees.rates[date]?.[vers];
      if (typeof valeur === "number" && Number.isFinite(valeur) && valeur > 0) {
        datesRetenues.push(date);
        valeurs.push(valeur);
      }
    }

    if (valeurs.length === 0) {
      return NextResponse.json({
        disponible: false,
        de,
        vers,
        motif: "devise_non_publiee",
      });
    }

    return NextResponse.json({
      disponible: true,
      de,
      vers,
      dates: datesRetenues,
      valeurs,
      joursDemandes: jours,
      fournisseur: "Frankfurter",
    });
  } catch {
    return NextResponse.json({
      disponible: false,
      de,
      vers,
      motif: "source_indisponible",
    });
  }
}
