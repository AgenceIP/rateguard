"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CODES_PAYS, DEVISES_BASE, PAYS_DEVISE, nomPays } from "@/data/pays";
import { useT } from "@/i18n";
import {
  aujourdhuiISO,
  formaterMontant,
  formaterMontantSigne,
  formaterPourcentage,
  joursAvant,
  localeActive,
} from "@/lib/format";
import { resumerPortefeuille, type EcartsPortefeuille } from "@/lib/journal";
import {
  debutFenetre,
  derniersJours,
  JOURS_STATISTIQUES,
  useMarches,
} from "@/lib/marche";
import { resumerPaiement } from "@/lib/strategies";
import {
  enregistrerProfil,
  lireJournal,
  lireProfil,
  PROFIL_VIDE,
} from "@/lib/stockage";
import {
  JOURS_PAR_FREQUENCE,
  type Beneficiaire,
  type Frequence,
  type PaiementPasse,
  type Profil,
} from "@/lib/types";
import { calculerVolatilite } from "@/lib/volatilite";

const FREQUENCES: Frequence[] = [
  "hebdomadaire",
  "bihebdomadaire",
  "mensuelle",
  "trimestrielle",
  "ponctuelle",
];

const CLASSE_CHAMP =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Trois personnes de démonstration, choisies pour montrer les trois cas que
 * l'outil doit savoir traiter : une devise publiée et liquide, une devise
 * publiée plus agitée, et une devise que la BCE ne publie pas du tout.
 */
function exemple(): Beneficiaire[] {
  const dans = (jours: number) => {
    const d = new Date();
    d.setDate(d.getDate() + jours);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: crypto.randomUUID(),
      nom: "Amina Diallo",
      pays: "US",
      devise: "USD",
      montant: 6200,
      frequence: "mensuelle",
      type: "contractant",
      prochainPaiement: dans(21),
    },
    {
      id: crypto.randomUUID(),
      nom: "Tomás Ferreira",
      pays: "BR",
      devise: "BRL",
      montant: 14000,
      frequence: "bihebdomadaire",
      type: "employe",
      prochainPaiement: dans(9),
    },
    {
      id: crypto.randomUUID(),
      nom: "Chidi Okonkwo",
      pays: "NG",
      devise: "NGN",
      montant: 2400000,
      frequence: "mensuelle",
      type: "contractant",
      prochainPaiement: dans(14),
    },
  ];
}

export default function Accueil() {
  const t = useT();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [journal, setJournal] = useState<PaiementPasse[] | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    void lireProfil().then(setProfil);
  }, []);
  useEffect(() => {
    lireJournal().then(setJournal);
  }, []);

  function maj(suivant: Profil) {
    setProfil(suivant);
    void enregistrerProfil(suivant);
  }

  const beneficiaires = profil?.beneficiaires ?? [];
  const devises = [
    ...new Set([
      ...beneficiaires.map((b) => b.devise),
      ...(journal ?? []).map((p) => p.devise),
    ]),
  ];
  const { marches, chargement } = useMarches(
    profil?.deviseBase ?? PROFIL_VIDE.deviseBase,
    devises,
  );

  if (!profil) {
    return (
      <p className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">
        {t.commun.chargement}
      </p>
    );
  }

  const locale = localeActive();
  const base = profil.deviseBase;

  // La fenêtre de reporting, des deux côtés à la fois. `resumerPortefeuille`
  // laisse ce découpage à l'appelant (voir son contrat dans journal.ts) : la
  // série brute couvre trois ans, et comparer douze mois de paiements à une
  // moyenne triennale mesure la dérive de la devise, pas l'effet du calendrier.
  // Sur une devise qui s'est dépréciée, le signe s'inverse.
  const debutPeriode = debutFenetre(JOURS_STATISTIQUES);
  const journalPeriode = (journal ?? []).filter((p) => p.date >= debutPeriode);
  const series = Object.fromEntries(
    Object.entries(marches)
      .filter(([, m]) => m.serie)
      .map(([d, m]) => [d, derniersJours(m.serie!, JOURS_STATISTIQUES)]),
  );
  const portefeuille = resumerPortefeuille(journalPeriode, series, base);

  // Le total mensuel n'a de sens que si toutes les devises ont un taux : on
  // n'additionne pas des montants dont une partie manque.
  const lignes = beneficiaires.map((b) => {
    const marche = marches[b.devise];
    const fenetre = JOURS_PAR_FREQUENCE[b.frequence];
    const stats =
      marche?.serie && marche.taux
        ? calculerVolatilite(marche.serie, fenetre)
        : null;
    const resume =
      marche?.taux && stats
        ? resumerPaiement(
            b.montant,
            marche.taux,
            stats,
            profil.hypotheses,
            30 / fenetre,
          )
        : null;
    return { b, marche, stats, resume };
  });

  const complet =
    lignes.length > 0 && lignes.every((l) => l.resume !== null);
  const totalMensuel = lignes.reduce(
    (somme, l) =>
      somme +
      (l.resume ? (l.resume.coutAujourdhui * 30) / JOURS_PAR_FREQUENCE[l.b.frequence] : 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {t.accueil.titre}
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.accueil.intro}
          </p>
        </div>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.deviseBase}
          </span>
          <select
            value={base}
            onChange={(e) => maj({ ...profil, deviseBase: e.target.value })}
            className={`${CLASSE_CHAMP} mt-1 w-40`}
          >
            {DEVISES_BASE.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {journal !== null && !chargement && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold">
              {t.portefeuille.titre}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t.portefeuille.periode}
            </span>
          </div>

          {(journal ?? []).length === 0 ? (
            <div className="mt-4 max-w-2xl">
              <p className="font-medium">{t.portefeuille.vide.titre}</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {t.portefeuille.vide.corps}
              </p>
              <Link
                href="/journal"
                className="mt-3 inline-block text-sm underline underline-offset-4"
              >
                {t.portefeuille.vide.action}
              </Link>
            </div>
          ) : journalPeriode.length === 0 ? (
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {t.portefeuille.horsPeriode}
            </p>
          ) : portefeuille.n === 0 ? (
            <Ecartes
              ecartes={portefeuille.ecartes}
              base={base}
              classe="mt-4 max-w-3xl leading-relaxed text-muted-foreground"
            />
          ) : (
            <>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                {t.portefeuille.intro}
              </p>

              <dl className="registre mt-6 border-y border-border">
                <ChiffreCle
                  terme={t.portefeuille.volume}
                  valeur={formaterMontant(portefeuille.volume, base, 0)}
                  detail={t.portefeuille.volumeDetail(portefeuille.n)}
                />
                <ChiffreCle
                  terme={t.portefeuille.frais}
                  valeur={formaterMontant(portefeuille.frais, base, 0)}
                  detail={t.portefeuille.fraisDetail(
                    formaterPourcentage(portefeuille.fraisPct),
                  )}
                  aide={t.portefeuille.fraisAide}
                />
                <ChiffreCle
                  terme={t.portefeuille.impact}
                  valeur={formaterMontantSigne(portefeuille.impactTaux, base)}
                  detail={t.portefeuille.impactDetail}
                  aide={t.portefeuille.impactAide}
                />
              </dl>

              {portefeuille.devises.some((d) => !d.complet) && (
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                  {t.portefeuille.incomplet}
                </p>
              )}
              <Ecartes
                ecartes={portefeuille.ecartes}
                base={base}
                classe="mt-2 max-w-3xl text-sm text-muted-foreground"
              />

              <h3 className="mt-8 font-heading text-lg font-semibold">
                {t.portefeuille.parDevise}
              </h3>
              <ul className="registre mt-3 border-y border-border text-sm">
                {portefeuille.devises.map((d) => (
                  <li
                    key={d.devise}
                    className="flex flex-wrap justify-between gap-x-8 gap-y-1 py-3"
                  >
                    <span className="chiffres">
                      {d.devise} · {t.portefeuille.volumeDetail(d.n)} ·{" "}
                      {formaterMontant(d.volume, base, 0)}
                    </span>
                    <span className="chiffres text-muted-foreground">
                      {formaterMontant(d.frais, base, 0)} (
                      {formaterPourcentage(d.fraisPct)})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <h2 className="mt-14 font-heading text-2xl font-semibold">
        {t.portefeuille.aPayer}
      </h2>

      {beneficiaires.length === 0 ? (
        <div className="mt-12 border-y border-border py-12">
          <h2 className="font-heading text-xl font-semibold">
            {t.accueil.vide.titre}
          </h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            {t.accueil.vide.corps}
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setOuvert(true)}>
              {t.accueil.equipe.ajouter}
            </Button>
            <Button
              variant="outline"
              onClick={() => maj({ ...profil, beneficiaires: exemple() })}
            >
              {t.accueil.vide.exemple}
            </Button>
          </div>
        </div>
      ) : (
        <ul className="registre mt-12 border-y border-border">
          {lignes.map(({ b, marche, resume }) => {
            const jours = joursAvant(b.prochainPaiement);
            const quand = t.accueil.joursRestants(jours);
            const montant = formaterMontant(b.montant, b.devise, 0);

            return (
              <li key={b.id} className="py-7">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-heading text-lg font-semibold">
                    {b.nom}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {nomPays(b.pays, locale)} · {t.accueil.equipe[b.type]} ·{" "}
                    {t.accueil.frequences[b.frequence].toLowerCase()}
                  </p>
                </div>

                <p className="mt-3 max-w-3xl text-lg leading-relaxed">
                  {resume
                    ? !resume.suffisant
                      ? t.paiement.resume.sansRisque(montant, quand)
                      : resume.risque === 0
                        ? t.paiement.resume.ancree(montant, b.devise)
                        : resume.prixDeLaCertitude > 0
                          ? t.paiement.resume.avecRisque(
                              montant,
                              quand,
                              formaterMontant(resume.risque, base, 0),
                              formaterMontant(resume.prixDeLaCertitude, base, 0),
                            )
                          : t.paiement.resume.certitudeMoinsChere(
                              montant,
                              quand,
                              formaterMontant(resume.risque, base, 0),
                              formaterMontant(-resume.prixDeLaCertitude, base, 0),
                            )
                    : marche?.motif === "devise_non_publiee"
                      ? t.paiement.taux.indisponible.devise_non_publiee(
                          b.devise,
                        )
                      : marche?.motif === "meme_devise"
                        ? t.paiement.taux.indisponible.meme_devise
                        : t.commun.chargement}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm">
                  <span className="chiffres">
                    <span className="text-muted-foreground">
                      {t.accueil.colonnes.montant}
                      {t.commun.deuxPoints}
                    </span>
                    {montant}
                  </span>
                  {resume && (
                    <span className="chiffres">
                      <span className="text-muted-foreground">
                        {t.accueil.colonnes.coute}
                        {t.commun.deuxPoints}
                      </span>
                      {formaterMontant(resume.coutAujourdhui, base, 0)}
                    </span>
                  )}
                  <Link
                    href={`/paiement/${b.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t.commun.voirDetail}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(t.accueil.equipe.confirmerSuppression(b.nom)))
                        return;
                      maj({
                        ...profil,
                        beneficiaires: beneficiaires.filter(
                          (x) => x.id !== b.id,
                        ),
                      });
                    }}
                    className="text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
                  >
                    {t.commun.supprimer}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {beneficiaires.length > 0 && (
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
          {complet && (
            <p className="chiffres text-sm text-muted-foreground">
              {t.accueil.totalMensuel(formaterMontant(totalMensuel, base, 0))}
            </p>
          )}
          <Button variant="outline" onClick={() => setOuvert(true)}>
            {t.accueil.equipe.ajouter}
          </Button>
        </div>
      )}

      {ouvert && (
        <FormulaireBeneficiaire
          onAnnuler={() => setOuvert(false)}
          onAjouter={(b) => {
            maj({ ...profil, beneficiaires: [...beneficiaires, b] });
            setOuvert(false);
          }}
        />
      )}

      <p className="mt-12 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t.commun.fraisEstimes}
      </p>
    </div>
  );
}

/**
 * Les paiements retirés du bilan, une ligne par cause.
 *
 * Trois motifs sans rapport entre eux : la BCE ne publie pas la devise, la date
 * précède l'historique disponible, ou le paiement porte une autre devise de
 * base. Les annoncer sous un motif unique en accuserait deux à tort.
 */
function Ecartes({
  ecartes,
  base,
  classe,
}: {
  ecartes: EcartsPortefeuille;
  base: string;
  classe: string;
}) {
  const t = useT();
  const lignes = [
    ecartes.deviseNonPubliee > 0 &&
      t.portefeuille.ecartes.deviseNonPubliee(ecartes.deviseNonPubliee),
    ecartes.sansCours > 0 &&
      t.portefeuille.ecartes.sansCours(ecartes.sansCours),
    ecartes.autreBase > 0 &&
      t.portefeuille.ecartes.autreBase(ecartes.autreBase, base),
  ].filter((l): l is string => typeof l === "string");

  if (lignes.length === 0) return null;
  return (
    <div className={classe}>
      {lignes.map((l) => (
        <p key={l} className="mt-2 first:mt-0">
          {l}
        </p>
      ))}
    </div>
  );
}

function FormulaireBeneficiaire({
  onAjouter,
  onAnnuler,
}: {
  onAjouter: (b: Beneficiaire) => void;
  onAnnuler: () => void;
}) {
  const t = useT();
  const locale = localeActive();
  const [nom, setNom] = useState("");
  const [pays, setPays] = useState("US");
  // La devise suit le pays tant que l'utilisateur ne l'a pas changée
  // lui-même : beaucoup de gens sont payés dans une autre monnaie que celle
  // de leur pays, mais c'est l'exception, pas le cas courant.
  const [devise, setDevise] = useState<string | null>(null);
  const [montant, setMontant] = useState("");
  const [frequence, setFrequence] = useState<Frequence>("mensuelle");
  const [type, setType] = useState<Beneficiaire["type"]>("contractant");
  const [date, setDate] = useState(aujourdhuiISO());

  const deviseEffective = devise ?? PAYS_DEVISE[pays] ?? "USD";
  const paysTries = [...CODES_PAYS].sort((a, b) =>
    nomPays(a, locale).localeCompare(nomPays(b, locale), locale),
  );

  return (
    <form
      className="mt-10 border-y border-border py-8"
      onSubmit={(e) => {
        e.preventDefault();
        onAjouter({
          id: crypto.randomUUID(),
          nom: nom.trim(),
          pays,
          devise: deviseEffective,
          montant: Number(montant) || 0,
          frequence,
          type,
          prochainPaiement: date,
        });
      }}
    >
      <h2 className="font-heading text-xl font-semibold">
        {t.accueil.equipe.ajouter}
      </h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.nom}
          </span>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder={t.accueil.equipe.nomExemple}
            className={`${CLASSE_CHAMP} mt-1`}
          />
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.pays}
          </span>
          <select
            value={pays}
            onChange={(e) => {
              setPays(e.target.value);
              setDevise(null);
            }}
            className={`${CLASSE_CHAMP} mt-1`}
          >
            {paysTries.map((code) => (
              <option key={code} value={code}>
                {nomPays(code, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.devise}
          </span>
          <input
            value={deviseEffective}
            onChange={(e) => setDevise(e.target.value.toUpperCase())}
            maxLength={3}
            className={`${CLASSE_CHAMP} mt-1 uppercase`}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {t.accueil.equipe.deviseAuto}
          </span>
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.montant}
          </span>
          <input
            required
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className={`${CLASSE_CHAMP} chiffres mt-1`}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {t.accueil.equipe.montantAide}
          </span>
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.frequence}
          </span>
          <select
            value={frequence}
            onChange={(e) => setFrequence(e.target.value as Frequence)}
            className={`${CLASSE_CHAMP} mt-1`}
          >
            {FREQUENCES.map((f) => (
              <option key={f} value={f}>
                {t.accueil.frequences[f]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.type}
          </span>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as Beneficiaire["type"])
            }
            className={`${CLASSE_CHAMP} mt-1`}
          >
            <option value="employe">{t.accueil.equipe.employe}</option>
            <option value="contractant">{t.accueil.equipe.contractant}</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-muted-foreground">
            {t.accueil.equipe.prochainPaiement}
          </span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${CLASSE_CHAMP} chiffres mt-1`}
          />
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit">{t.commun.ajouter}</Button>
        <Button type="button" variant="ghost" onClick={onAnnuler}>
          {t.commun.annuler}
        </Button>
      </div>
    </form>
  );
}

/** Une ligne de chiffre clé : le montant d'abord, le pourcentage ensuite et en gris. */
function ChiffreCle({
  terme,
  valeur,
  detail,
  aide,
}: {
  terme: string;
  valeur: string;
  detail: string;
  aide?: string;
}) {
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <dt className="font-medium">{terme}</dt>
        <dd className="flex items-baseline gap-3">
          <span className="chiffres text-lg">{valeur}</span>
          <span className="chiffres text-sm text-muted-foreground">
            {detail}
          </span>
        </dd>
      </div>
      {aide && (
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {aide}
        </p>
      )}
    </div>
  );
}
