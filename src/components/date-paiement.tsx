"use client";

import { useT } from "@/i18n";
import {
  amplitudeParSemaineDuMois,
  expositionEntre,
} from "@/lib/calendrier";
import { formaterDate, formaterMontant, formaterNombre } from "@/lib/format";
import type { SerieTaux, StatsVolatilite } from "@/lib/types";

/**
 * Est-ce que ma date est un bon choix ?
 *
 * La réponse ne parle jamais du sens dans lequel ira le taux. Elle parle de
 * l'incertitude que l'utilisateur achète en attendant, des jours de dérive
 * qu'il subit sans les avoir choisis, et de l'agitation habituelle de cette
 * semaine du mois. Trois faits mesurables, zéro prédiction.
 */
export function DatePaiement({
  serie3ans,
  stats,
  datePaiement,
  montantCible,
  taux,
  base,
}: {
  serie3ans: SerieTaux | null;
  stats: StatsVolatilite;
  datePaiement: string;
  montantCible: number;
  taux: number;
  base: string;
}) {
  const t = useT();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const exposition = expositionEntre(
    aujourdhui,
    datePaiement,
    montantCible,
    taux,
    stats,
  );

  // Même découpage que le classeur de amplitudeParSemaineDuMois (calendrier.ts) :
  // les deux doivent rester d'accord, sinon `find` cherche une clé qui n'existe pas.
  const semaine = Math.min(
    5,
    Math.floor((Number(datePaiement.slice(8, 10)) - 1) / 7) + 1,
  );
  const paquets = serie3ans ? amplitudeParSemaineDuMois(serie3ans) : [];
  const paquet = paquets.find((p) => p.cle === semaine);

  return (
    <section className="mt-12">
      <h2 className="font-heading text-2xl font-semibold">
        {t.paiement.date.titre}
      </h2>

      <p className="mt-3 max-w-3xl leading-relaxed">
        {exposition.suffisant
          ? t.paiement.date.exposition(
              exposition.jours,
              formaterMontant(exposition.montant, base, 0),
            )
          : t.paiement.date.expositionCourte}
      </p>

      {exposition.decalageJours > 0 && (
        <p className="mt-3 max-w-3xl border-l-2 border-statut-jaune pl-4 leading-relaxed">
          {t.paiement.date.decalage(
            formaterDate(datePaiement),
            formaterDate(exposition.dateEffective),
            exposition.decalageJours,
          )}
        </p>
      )}

      <h3 className="mt-8 font-heading text-lg font-semibold">
        {t.paiement.date.semaine.titre}
      </h3>
      <p className="mt-2 max-w-3xl leading-relaxed">
        {!serie3ans || paquets.every((p) => p.n === 0)
          ? t.paiement.date.semaine.insuffisant
          : !paquet?.distinct
            ? t.paiement.date.semaine.indistincte
            : paquet.ratio >= 1
              ? t.paiement.date.semaine.agitee(formaterNombre(paquet.ratio, 1))
              : t.paiement.date.semaine.calme(
                  formaterNombre(1 / paquet.ratio, 1),
                )}
      </p>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t.paiement.date.nonPrediction}
      </p>
    </section>
  );
}
