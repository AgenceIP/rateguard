"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import {
  calculerSeuilCritique,
  calculerStatut,
  expositionCible,
} from "@/lib/calculs";
import {
  formaterCAD,
  formaterDevise,
  formaterHorodatage,
  formaterPourcentage,
  formaterTaux,
} from "@/lib/format";
import { lireForfaits } from "@/lib/stockage";
import { recupererTaux } from "@/lib/taux";
import type { DeviseCible, Forfait, StatutForfait } from "@/lib/types";

const COULEUR_STATUT: Record<StatutForfait, string> = {
  vert: "bg-statut-vert",
  jaune: "bg-statut-jaune",
  rouge: "bg-statut-rouge",
};

const TEXTE_STATUT: Record<StatutForfait, string> = {
  vert: "text-statut-vert",
  jaune: "text-statut-jaune",
  rouge: "text-statut-rouge",
};

export default function ListeForfaitsPage() {
  const t = useT();
  const [forfaits, setForfaits] = useState<Forfait[] | null>(null);
  const [tauxActuels, setTauxActuels] = useState<
    Partial<Record<DeviseCible, number>>
  >({});

  useEffect(() => {
    const enregistres = lireForfaits();
    setForfaits(enregistres);

    // On ne rafraîchit que les devises réellement présentes dans les forfaits.
    const devises = [...new Set(enregistres.map((f) => f.deviseCible))];
    devises.forEach((devise) => {
      recupererTaux(devise)
        .then(({ taux }) =>
          setTauxActuels((actuels) => ({ ...actuels, [devise]: taux })),
        )
        .catch(() => undefined);
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-semibold">
            {t.accueil.titre}
          </h1>
          <p className="mt-3 max-w-[58ch] leading-relaxed text-muted-foreground">
            {t.accueil.sousTitre}
          </p>
        </div>
        <Button render={<Link href="/nouveau" />} nativeButton={false} size="lg">
          {t.nav.nouveau}
        </Button>
      </div>

      {forfaits === null ? (
        <p className="mt-16 text-muted-foreground">{t.commun.chargement}</p>
      ) : forfaits.length === 0 ? (
        <div className="mt-16 max-w-[58ch] border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-semibold">
            {t.accueil.vide.titre}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.accueil.vide.corps}
          </p>
          <Button render={<Link href="/nouveau" />} nativeButton={false} className="mt-8">
            {t.accueil.vide.action}
          </Button>
        </div>
      ) : (
        <ul className="registre mt-12 border-y border-border">
          {forfaits.map((forfait) => {
            const tauxActuel = tauxActuels[forfait.deviseCible];
            const statut = tauxActuel
              ? calculerStatut(forfait, tauxActuel)
              : null;
            const seuil = calculerSeuilCritique(forfait);
            const mouvementPct = tauxActuel
              ? ((tauxActuel - forfait.tauxVerrouille) /
                  forfait.tauxVerrouille) *
                100
              : null;

            return (
              <li key={forfait.id}>
                <Link
                  href={`/forfait/${forfait.id}`}
                  className="grid grid-cols-[0.75rem_1fr] gap-x-5 py-6 transition-colors hover:bg-card sm:grid-cols-[0.75rem_1fr_13rem_11rem] sm:items-baseline"
                >
                  <span
                    aria-hidden
                    className={`mt-2 size-3 rounded-full ${
                      statut ? COULEUR_STATUT[statut] : "bg-border"
                    }`}
                  />

                  <div>
                    <p className="font-heading text-xl font-semibold">
                      {forfait.nom}
                    </p>
                    <p className="chiffres mt-1 text-sm text-muted-foreground">
                      {t.detail.pelerins(forfait.nombrePelerins)},{" "}
                      {formaterCAD(forfait.montantTotalCAD)}
                    </p>
                    {statut && (
                      <p className={`mt-2 text-sm ${TEXTE_STATUT[statut]}`}>
                        {t.accueil.statut[statut]} —{" "}
                        <span className="text-muted-foreground">
                          {t.accueil.statutExplication[statut]}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="col-start-2 mt-4 sm:col-start-auto sm:mt-0">
                    <p className="text-sm text-muted-foreground">
                      {t.accueil.colonnes.verrouille}
                    </p>
                    <p className="chiffres mt-1">
                      {formaterTaux(forfait.tauxVerrouille)}{" "}
                      {forfait.deviseCible}
                    </p>
                    <p className="chiffres mt-1 whitespace-nowrap text-sm text-muted-foreground">
                      {formaterHorodatage(forfait.dateCreation)}
                    </p>
                  </div>

                  <div className="col-start-2 mt-4 sm:col-start-auto sm:mt-0 sm:text-right">
                    <p className="text-sm text-muted-foreground">
                      {t.accueil.colonnes.exposition}
                    </p>
                    <p className="chiffres mt-1">
                      {formaterDevise(
                        expositionCible(forfait),
                        forfait.deviseCible,
                      )}
                    </p>
                    {mouvementPct !== null &&
                      seuil.mouvementDefavorablePct !== null && (
                        <p className="chiffres mt-1 text-sm text-muted-foreground">
                          {t.accueil.progression(
                            formaterPourcentage(Math.max(0, -mouvementPct)),
                            formaterPourcentage(
                              seuil.mouvementDefavorablePct,
                            ),
                          )}
                        </p>
                      )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
