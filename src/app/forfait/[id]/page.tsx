"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { GraphiqueScenarios } from "@/components/forfait/graphique-scenarios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/i18n";
import { BENCHMARK_FRAIS } from "@/lib/benchmarks";
import {
  calculerCoutReel,
  calculerSeuilCritique,
  comparerCanaux,
  expositionCible,
  simulerScenarios,
} from "@/lib/calculs";
import {
  formaterCAD,
  formaterCADSigne,
  formaterDevise,
  formaterHorodatage,
  formaterPourcentage,
  formaterPourcentageSigne,
  formaterTaux,
} from "@/lib/format";
import { lireForfait } from "@/lib/stockage";
import type { Forfait } from "@/lib/types";

function Section({
  titre,
  intro,
  children,
}: {
  titre: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-10">
      <h2 className="font-heading text-2xl font-semibold">{titre}</h2>
      {intro && (
        <p className="mt-2 max-w-[68ch] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
      {children}
    </section>
  );
}

export default function DetailForfaitPage({
  params,
}: PageProps<"/forfait/[id]">) {
  const { id } = use(params);
  const [forfait, setForfait] = useState<Forfait | null | undefined>(undefined);
  const [copie, setCopie] = useState(false);

  // Les forfaits vivent dans le localStorage : la lecture attend le montage.
  useEffect(() => setForfait(lireForfait(id) ?? null), [id]);

  const calculs = useMemo(() => {
    if (!forfait) return null;
    const exposition = expositionCible(forfait);
    return {
      exposition,
      cout: calculerCoutReel(
        forfait.montantTotalCAD,
        forfait.tauxVerrouille,
        BENCHMARK_FRAIS,
      ),
      simulation: simulerScenarios(forfait),
      seuil: calculerSeuilCritique(forfait),
      comparaison: comparerCanaux(
        exposition,
        forfait.tauxVerrouille,
        BENCHMARK_FRAIS.spreadBancairePct,
      ),
    };
  }, [forfait]);

  if (forfait === undefined) {
    return (
      <p className="mx-auto w-full max-w-5xl px-6 py-16 text-muted-foreground">
        {t.commun.chargement}
      </p>
    );
  }

  if (forfait === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-20">
        <h1 className="font-heading text-3xl font-semibold">
          {t.detail.introuvable.titre}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t.detail.introuvable.corps}
        </p>
        <Button render={<Link href="/" />} className="mt-8">
          {t.commun.retour}
        </Button>
      </div>
    );
  }

  const { exposition, cout, simulation, seuil, comparaison } = calculs!;

  const resume = t.detail.resume.modele({
    nom: forfait.nom,
    pelerins: t.detail.pelerins(forfait.nombrePelerins),
    montant: formaterCAD(forfait.montantTotalCAD),
    horodatage: formaterHorodatage(forfait.dateCreation),
    taux: `1 CAD = ${formaterTaux(forfait.tauxVerrouille)} ${forfait.deviseCible}`,
    paire: forfait.sourceTaux.paire,
    source: forfait.sourceTaux.fournisseur,
    seuil:
      seuil.mouvementDefavorablePct === null
        ? "—"
        : formaterPourcentage(seuil.mouvementDefavorablePct),
  });

  async function copierResume() {
    await navigator.clipboard.writeText(resume);
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t.commun.retour}
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-semibold">{forfait.nom}</h1>
          <p className="chiffres mt-2 text-muted-foreground">
            {t.detail.pelerins(forfait.nombrePelerins)},{" "}
            {formaterCAD(forfait.montantTotalCAD)} encaissés, payables en{" "}
            {forfait.deviseCible}
          </p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            {t.detail.resume.action}
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {t.detail.resume.titre}
              </DialogTitle>
              <DialogDescription>{t.detail.resume.intro}</DialogDescription>
            </DialogHeader>
            <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap border border-border bg-muted p-4 text-sm leading-relaxed">
              {resume}
            </pre>
            <Button onClick={copierResume}>
              {copie ? t.detail.resume.copie : t.detail.resume.action}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Le reçu : seul objet orné de la page, posé sur le papier. */}
      <div className="recu mt-12 max-w-2xl rounded-sm bg-card p-8">
        <div className="flex items-center gap-3">
          <Clock
            aria-hidden
            className="size-5 shrink-0 text-primary"
            strokeWidth={1.75}
          />
          <h2 className="font-heading text-xl font-semibold">
            {t.detail.recu.titre}
          </h2>
        </div>
        <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
          {t.detail.recu.intro}
        </p>

        <dl className="registre mt-6 border-t border-border">
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-sm text-muted-foreground">
              {t.detail.recu.capteLe}
            </dt>
            <dd className="chiffres text-right">
              {formaterHorodatage(forfait.dateCreation)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-sm text-muted-foreground">
              {t.detail.recu.taux}
            </dt>
            <dd className="chiffres text-right text-lg font-semibold">
              1 CAD = {formaterTaux(forfait.tauxVerrouille)}{" "}
              {forfait.deviseCible}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-sm text-muted-foreground">
              {t.detail.recu.source}
            </dt>
            <dd className="text-right text-sm">
              {forfait.sourceTaux.fournisseur}, {forfait.sourceTaux.dateTaux}
            </dd>
          </div>
        </dl>

        {forfait.sourceTaux.viaPegUsd && (
          <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-relaxed">
            {t.detail.recu.peg}
          </p>
        )}
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {t.detail.recu.usage}
        </p>
      </div>

      <div className="mt-16 space-y-14">
        <Section titre={t.detail.cout.titre} intro={t.detail.cout.intro}>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_18rem] lg:items-start">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.detail.cout.colonneFrais}</TableHead>
                  <TableHead className="text-right">
                    {t.detail.cout.colonneMontant}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cout.frais.map((ligne) => (
                  <TableRow key={ligne.cle}>
                    <TableCell>
                      {ligne.libelle}
                      {ligne.mode === "pourcentage" && (
                        <span className="chiffres text-muted-foreground">
                          {" "}
                          ({formaterPourcentage(ligne.valeur)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="chiffres text-right">
                      {formaterCAD(ligne.montantCAD, true)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-foreground">
                  <TableCell className="font-semibold">
                    {t.detail.cout.totalFrais}
                  </TableCell>
                  <TableCell className="chiffres text-right font-semibold">
                    {formaterCAD(cout.totalFraisCAD, true)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <dl className="registre border-y border-border">
              <div className="py-4">
                <dt className="text-sm text-muted-foreground">
                  {t.detail.cout.envoye}
                </dt>
                <dd className="chiffres mt-1 text-lg">
                  {formaterCAD(cout.montantCAD)}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-muted-foreground">
                  {t.detail.cout.auMid}
                </dt>
                <dd className="chiffres mt-1 text-lg">
                  {formaterDevise(cout.montantCibleAuMid, forfait.deviseCible)}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-muted-foreground">
                  {t.detail.cout.recu}
                </dt>
                <dd className="chiffres mt-1 text-lg font-semibold">
                  {formaterDevise(cout.montantCibleRecu, forfait.deviseCible)}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-muted-foreground">
                  {t.detail.cout.tauxEffectif}
                </dt>
                <dd className="chiffres mt-1 text-lg">
                  {formaterTaux(cout.tauxEffectif)} {forfait.deviseCible}
                </dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section titre={t.detail.scenarios.titre}>
          <p className="mt-4 max-w-[68ch] border-l-2 border-primary pl-4 leading-relaxed">
            {t.detail.scenarios.avertissement}
          </p>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-muted-foreground">
            {t.detail.scenarios.duree(
              simulation.joursAvantPremierPaiement,
              t.detail.scenarios.palier[simulation.palier],
            )}
          </p>

          <GraphiqueScenarios scenarios={simulation.scenarios} />

          <Table className="mt-8">
            <TableHeader>
              <TableRow>
                <TableHead>{t.detail.scenarios.colonneMouvement}</TableHead>
                <TableHead className="text-right">
                  {t.detail.scenarios.colonneCout}
                </TableHead>
                <TableHead className="text-right">
                  {t.detail.scenarios.colonneEcart}
                </TableHead>
                <TableHead className="text-right">
                  {t.detail.scenarios.colonneMargeFinale}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulation.scenarios.map((scenario) => (
                <TableRow key={scenario.mouvementPct}>
                  <TableCell className="chiffres">
                    {formaterPourcentageSigne(
                      scenario.mouvementPct,
                      scenario.mouvementPct % 1 === 0 ? 0 : 1,
                    )}
                  </TableCell>
                  <TableCell className="chiffres text-right">
                    {formaterCAD(scenario.coutCADRequis)}
                  </TableCell>
                  <TableCell
                    className={`chiffres text-right ${
                      scenario.favorable
                        ? "text-statut-vert"
                        : "text-statut-rouge"
                    }`}
                  >
                    {formaterCADSigne(scenario.ecartCAD)}
                  </TableCell>
                  <TableCell className="chiffres text-right">
                    {formaterPourcentage(scenario.margeResultantePct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
            {t.detail.scenarios.note}
          </p>
        </Section>

        <Section titre={t.detail.seuil.titre}>
          {exposition <= 0 ? (
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t.detail.seuil.aucuneExposition}
            </p>
          ) : seuil.atteignable && seuil.mouvementDefavorablePct !== null ? (
            <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <p className="chiffres font-heading text-6xl font-semibold text-statut-rouge">
                −{formaterPourcentage(seuil.mouvementDefavorablePct)}
              </p>
              <div className="max-w-[46ch]">
                <p className="leading-relaxed">
                  {t.detail.seuil.corps(
                    formaterPourcentage(seuil.mouvementDefavorablePct),
                  )}
                </p>
                <p className="chiffres mt-2 text-sm text-muted-foreground">
                  {t.detail.seuil.detail(
                    formaterCAD(seuil.margeCAD),
                    formaterCAD(seuil.expositionCAD),
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t.detail.seuil.inatteignable}
            </p>
          )}
        </Section>

        <Section
          titre={t.detail.comparaison.titre}
          intro={t.detail.comparaison.intro}
        >
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
            <div className="bg-card p-6">
              <p className="text-sm text-muted-foreground">
                {t.detail.comparaison.midMarket}
              </p>
              <p className="chiffres mt-2 text-3xl font-semibold">
                {formaterTaux(comparaison.tauxMidMarket)}
              </p>
              <p className="chiffres mt-3">
                {formaterCAD(comparaison.coutMidMarketCAD)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t.detail.comparaison.midMarketNote}
              </p>
            </div>
            <div className="bg-card p-6">
              <p className="text-sm text-muted-foreground">
                {t.detail.comparaison.banque}
              </p>
              <p className="chiffres mt-2 text-3xl font-semibold">
                {formaterTaux(comparaison.tauxBancaireEstime)}
              </p>
              <p className="chiffres mt-3">
                {formaterCAD(comparaison.coutBancaireEstimeCAD)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t.detail.comparaison.banqueNote(
                  formaterPourcentage(comparaison.margeBancaireBenchmarkPct),
                )}
              </p>
            </div>
          </div>

          <p className="chiffres mt-6 max-w-[68ch] text-lg leading-relaxed">
            {t.detail.comparaison.ecart(formaterCAD(comparaison.ecartCAD))}
          </p>
          <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
            {t.detail.comparaison.estimation}
          </p>
        </Section>
      </div>
    </div>
  );
}
