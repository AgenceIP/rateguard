"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Comparateur } from "@/components/comparateur";
import { DatePaiement } from "@/components/date-paiement";
import { Terme } from "@/components/lexique";
import { Button } from "@/components/ui/button";
import {
  DERNIERE_VERIFICATION,
  RISQUES_UNIVERSELS_CLES,
  ficheCrypto,
} from "@/data/crypto-paie";
import { nomPays } from "@/data/pays";
import { useLangue, useT } from "@/i18n";
import { INSTRUCTIONS_FRAIS } from "@/lib/hypotheses";
import {
  formaterDate,
  formaterHorodatage,
  formaterMontant,
  formaterPourcentage,
  formaterTaux,
  joursAvant,
  localeActive,
} from "@/lib/format";
import { hypothesesCalibrees, margeObservee } from "@/lib/journal";
import { derniersJours, JOURS_STATISTIQUES, useMarches } from "@/lib/marche";
import { comparerStrategies, resumerPaiement } from "@/lib/strategies";
import {
  enregistrerDecision,
  enregistrerProfil,
  lireDecisions,
  lireJournal,
  lireProfil,
  type Decision,
} from "@/lib/stockage";
import {
  JOURS_PAR_FREQUENCE,
  type CleStrategie,
  type CoutStrategie,
  type Hypotheses,
  type PaiementPasse,
  type Profil,
  type StatsVolatilite,
  type StatutCrypto,
} from "@/lib/types";
import { calculerVolatilite, coutAuTauxDuJour } from "@/lib/volatilite";

const CLASSE_CHAMP =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Le statut réglementaire est un signal : il a droit aux couleurs de statut. */
const COULEUR_STATUT: Record<StatutCrypto, string> = {
  cours_legal: "text-statut-vert",
  permis_sous_conditions: "text-statut-jaune",
  fiat_obligatoire: "text-statut-rouge",
  interdit: "text-statut-rouge",
  non_verifie: "text-muted-foreground",
};

export function DetailPaiement({ id }: { id: string }) {
  const t = useT();
  const { langue } = useLangue();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [journal, setJournal] = useState<PaiementPasse[]>([]);
  const [ouvertChiffres, setOuvertChiffres] = useState(false);

  useEffect(() => {
    void lireProfil().then(setProfil);
    void lireDecisions().then(setDecisions);
    void lireJournal().then(setJournal);
  }, []);

  const beneficiaire = profil?.beneficiaires.find((b) => b.id === id) ?? null;
  const { marches } = useMarches(
    profil?.deviseBase ?? "CAD",
    beneficiaire ? [beneficiaire.devise] : [],
  );

  if (!profil) {
    return (
      <p className="mx-auto max-w-5xl px-6 py-16 text-muted-foreground">
        {t.commun.chargement}
      </p>
    );
  }

  if (!beneficiaire) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          {t.paiement.retour}
        </Link>
      </div>
    );
  }

  const locale = localeActive();
  const base = profil.deviseBase;
  const b = beneficiaire;
  const marche = marches[b.devise];
  const fenetre = JOURS_PAR_FREQUENCE[b.frequence];
  const paiementsParMois = 30 / fenetre;

  // Fenêtre longue (trois ans) pour le calendrier, fenêtre courte (un an,
  // JOURS_STATISTIQUES) pour les statistiques d'amplitude de cette page :
  // les deux mesurent des choses différentes et ne doivent pas se mélanger.
  // Invariant (pas de garde ici) : marche.serie n'est jamais non-null sans
  // marche.taux — voir src/lib/marche.ts.
  const serie3ans = marche?.serie ?? null;
  const serieStats = serie3ans ? derniersJours(serie3ans, JOURS_STATISTIQUES) : null;
  const stats: StatsVolatilite | null = serieStats
    ? calculerVolatilite(serieStats, fenetre)
    : null;

  // La marge mesurée sur les paiements passés remplace la marge estimée par
  // défaut — mais jamais une valeur que l'utilisateur a saisie lui-même : un
  // champ de formulaire qu'on écrase en silence n'est plus une commande.
  const marge =
    !profil.hypotheses.personnalise && serie3ans && marche?.taux
      ? margeObservee(journal, serie3ans, b.devise, "spot")
      : null;

  // `hypothesesCalibrees` pose `personnalise: true`, ce qui vaut ailleurs
  // « l'utilisateur a saisi ses frais » et supprime la fourchette
  // d'incertitude (strategies.ts:37-39). Or elle ne mesure qu'un chiffre sur
  // neuf : on garde la marge et on rend le drapeau à sa valeur d'origine,
  // sinon la fourchette tombe sur huit frais jamais mesurés.
  const calibrees =
    marge && marche?.taux
      ? hypothesesCalibrees(
          profil.hypotheses,
          marge,
          coutAuTauxDuJour(b.montant, marche.taux),
        )
      : null;

  // La part des frais fixes peut dépasser l'écart total observé : la
  // soustraction de hypothesesCalibrees passe alors sous zéro et son
  // `Math.max(0, …)` renvoie 0. Ce zéro est un artefact de bornage, pas une
  // mesure — on refuse de le présenter comme telle. Voir correctif 4.
  const margeIndecomposable =
    calibrees !== null && marge !== null && calibrees.virementMargePct === 0;

  const hypotheses =
    calibrees && !margeIndecomposable
      ? { ...calibrees, personnalise: profil.hypotheses.personnalise }
      : profil.hypotheses;

  const strategies: CoutStrategie[] =
    marche?.taux && stats
      ? comparerStrategies(b.montant, marche.taux, stats, hypotheses, paiementsParMois)
      : [];
  const resume =
    marche?.taux && stats
      ? resumerPaiement(b.montant, marche.taux, stats, hypotheses, paiementsParMois)
      : null;

  const montant = formaterMontant(b.montant, b.devise, 0);
  const quand = t.accueil.joursRestants(joursAvant(b.prochainPaiement));
  const fiche = ficheCrypto(b.pays, langue);

  function majHypotheses(champ: keyof Hypotheses, valeur: number) {
    if (!profil) return;
    const suivant: Profil = {
      ...profil,
      hypotheses: { ...profil.hypotheses, [champ]: valeur, personnalise: true },
    };
    setProfil(suivant);
    void enregistrerProfil(suivant);
  }

  function noter(cle: CleStrategie) {
    if (!marche?.taux) return;
    const s = strategies.find((x) => x.cle === cle);
    if (!s) return;
    void enregistrerDecision({
      beneficiaireId: b.id,
      beneficiaireNom: b.nom,
      strategie: s.cle,
      deviseBase: base,
      deviseCible: b.devise,
      montantCible: b.montant,
      taux: marche.taux,
      dateTaux: marche.dateTaux,
      coutEstime: s.coutCentral,
    }).then(() => lireDecisions().then(setDecisions));
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div>
        {/* ---------------------------------------------------------- En-tête */}
        <Link
          href="/"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← {t.paiement.retour}
        </Link>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
          {b.nom}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.paiement.sousTitre(montant, nomPays(b.pays, locale), quand)}
        </p>

        {/* ----------------------------------------------------- Vos chiffres */}
        <section className="mt-10">
          <h2 className="font-heading text-2xl font-semibold">
            {t.paiement.vosChiffres.titre}
          </h2>
          <p className="mt-3 text-sm font-medium">
            {profil.hypotheses.personnalise
              ? t.paiement.hypotheses.personnalise
              : margeIndecomposable
                ? t.paiement.vosChiffres.indecomposable
                : marge
                  ? t.paiement.vosChiffres.mesure(marge.n, `${base} → ${b.devise}`)
                  : t.paiement.vosChiffres.defaut}
          </p>
          {marge && !marge.complet && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t.portefeuille.incomplet}
            </p>
          )}
          {!marge && !hypotheses.personnalise && !margeIndecomposable && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t.paiement.vosChiffres.pourAffiner(
                Math.max(
                  1,
                  3 -
                    journal.filter(
                      (p) => p.devise === b.devise && p.canal === "spot",
                    ).length,
                ),
              )}
            </p>
          )}

          <div id="vos-chiffres-detail">
            {!ouvertChiffres ? (
              <>
                <dl className="mt-4 max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">
                      {t.paiement.vosChiffres.marge}
                    </dt>
                    <dd className="chiffres">
                      {formaterPourcentage(hypotheses.virementMargePct, 1)}
                    </dd>
                  </div>
                  {profil.hypotheses.personnalise && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground">
                        {t.paiement.vosChiffres.fraisFixes}
                      </dt>
                      <dd className="chiffres">
                        {formaterMontant(
                          hypotheses.virementFixe +
                            hypotheses.virementIntermediaire +
                            hypotheses.virementReception,
                          base,
                          0,
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                  {t.paiement.hypotheses.intro}
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      "virementFixe",
                      "virementIntermediaire",
                      "virementReception",
                      "virementMargePct",
                      "specialisteMargePct",
                      "specialisteFixe",
                      "forwardPrimePct",
                      "multiDeviseMargePct",
                      "multiDeviseMensuel",
                    ] as const
                  ).map((champ) => (
                    <label key={champ} className="text-sm">
                      <span className="block text-muted-foreground">
                        {t.paiement.hypotheses[champ]}
                      </span>
                      <input
                        inputMode="decimal"
                        value={String(profil.hypotheses[champ])}
                        onChange={(e) =>
                          majHypotheses(champ, Number(e.target.value) || 0)
                        }
                        className={`${CLASSE_CHAMP} chiffres mt-1`}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {profil.hypotheses.personnalise && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const suivant: Profil = {
                          ...profil,
                          hypotheses: { ...profil.hypotheses, personnalise: false },
                        };
                        setProfil(suivant);
                        void enregistrerProfil(suivant);
                      }}
                    >
                      {t.paiement.hypotheses.reinitialiser}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOuvertChiffres(!ouvertChiffres)}
            aria-expanded={ouvertChiffres}
            aria-controls="vos-chiffres-detail"
            className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
          >
            {ouvertChiffres
              ? t.paiement.vosChiffres.fermer
              : t.paiement.vosChiffres.ajuster}
          </button>
        </section>

        {/* Le résumé est l'objet central de la page : c'est la seule surface ornée. */}
        <section className="recu mt-16 rounded-md bg-card p-8">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.paiement.resume.titre}
          </h2>
          <p className="mt-4 max-w-3xl text-xl leading-relaxed">
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
              : marche?.motif
                ? motifEnClair(t, marche.motif, b.devise)
                : t.commun.chargement}
          </p>
          {resume && resume.economie > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {t.paiement.resume.economie(
                formaterMontant(resume.economie, base, 0),
                t.paiement.strategies[resume.moinsChere].nom,
              )}
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------------- Taux */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">
            {t.paiement.taux.titre}
          </h2>
          {marche?.taux && !marche.motif ? (
            <>
              <p className="chiffres mt-4 text-2xl">
                {t.paiement.taux.valeur(base, formaterTaux(marche.taux), b.devise)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.paiement.taux.source} · {t.paiement.taux.dateTaux}{" "}
                {formaterDate(marche.dateTaux)}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {t.paiement.taux.avertissement}
              </p>
            </>
          ) : (
            <div className="mt-4 border-l-2 border-statut-jaune pl-4">
              <p className="font-medium">{t.paiement.taux.indisponible.titre}</p>
              <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
                {marche?.motif
                  ? motifEnClair(t, marche.motif, b.devise)
                  : t.commun.chargement}
              </p>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------- Votre date */}
        {stats && marche?.taux && (
          <DatePaiement
            serie3ans={serie3ans}
            stats={stats}
            datePaiement={b.prochainPaiement}
            montantCible={b.montant}
            taux={marche.taux}
            base={base}
          />
        )}

        {/* ------------------------------------------------------------ Vos options */}
        {resume && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-semibold">
              {t.paiement.strategies.titre}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {t.paiement.strategies.intro}
            </p>

            <Comparateur
              strategies={strategies}
              base={base}
              moinsChere={resume.moinsChere}
              onNoter={noter}
            />

            <div className="mt-10 border-l-2 border-primary pl-5">
              <h3 className="font-heading text-lg font-semibold">
                {t.paiement.strategies.swift.titre}
              </h3>
              <p className="mt-2 max-w-3xl leading-relaxed">
                {t.paiement.strategies.swift.corps}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                {INSTRUCTIONS_FRAIS.map((code) => (
                  <div key={code}>
                    {
                      t.paiement.strategies.swift[
                        code.toLowerCase() as "sha" | "our" | "ben"
                      ]
                    }
                  </div>
                ))}
              </dl>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {t.paiement.strategies.swift.conclusion}
              </p>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------- Statistiques */}
        {stats && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-semibold">
              {t.paiement.stats.titre}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {t.paiement.stats.intro(fenetre, `${base} → ${b.devise}`)}
            </p>

            {!stats.suffisant ? (
              <p className="mt-6 max-w-3xl border-l-2 border-statut-jaune pl-4 leading-relaxed">
                {t.paiement.stats.insuffisant}
              </p>
            ) : stats.quotidiennePct === 0 ? (
              <p className="mt-6 max-w-3xl border-l-2 border-statut-vert pl-4 leading-relaxed">
                {t.paiement.stats.ancree}
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.paiement.stats.periode(
                    formaterDate(stats.debut),
                    formaterDate(stats.fin),
                    stats.observations,
                  )}
                </p>
                <dl className="registre mt-6 border-y border-border">
                  <Mesure
                    titre={t.paiement.stats.amplitudeTypique}
                    aide={t.paiement.stats.amplitudeTypiqueAide}
                    montant={formaterMontant(
                      (stats.amplitudeMedianePct / 100) *
                        (resume?.coutAujourdhui ?? 0),
                      base,
                      0,
                    )}
                    pourcentage={formaterPourcentage(stats.amplitudeMedianePct, 2)}
                  />
                  <Mesure
                    titre={t.paiement.stats.amplitudeLarge}
                    aide={t.paiement.stats.amplitudeLargeAide}
                    montant={formaterMontant(
                      (stats.amplitudeP80Pct / 100) * (resume?.coutAujourdhui ?? 0),
                      base,
                      0,
                    )}
                    pourcentage={formaterPourcentage(stats.amplitudeP80Pct, 2)}
                  />
                  <Mesure
                    titre={t.paiement.stats.pire}
                    aide={t.paiement.stats.pireAide}
                    montant={formaterMontant(
                      (stats.pireDefavorablePct / 100) *
                        (resume?.coutAujourdhui ?? 0),
                      base,
                      0,
                    )}
                    pourcentage={formaterPourcentage(stats.pireDefavorablePct, 2)}
                  />
                  <Mesure
                    titre={t.paiement.stats.annualisee}
                    aide={t.paiement.stats.annualiseeAide}
                    montant=""
                    pourcentage={formaterPourcentage(stats.annualiseePct, 1)}
                  />
                </dl>
              </>
            )}

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {t.paiement.stats.nonPrediction}
            </p>
          </section>
        )}

        {/* ---------------------------------------------------------------- Crypto */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">
            {t.paiement.crypto.titre}
          </h2>
          <p className={`mt-4 text-lg font-medium ${COULEUR_STATUT[fiche.statut]}`}>
            {t.paiement.crypto.statut[fiche.statut]} —{" "}
            {nomPays(b.pays, locale)}
          </p>

          {fiche.statut === "non_verifie" ? (
            <p className="mt-3 max-w-3xl leading-relaxed">
              {t.paiement.crypto.nonVerifie}
            </p>
          ) : (
            <>
              <p className="mt-3 max-w-3xl leading-relaxed">{fiche.resume}</p>
              <h3 className="mt-8 font-medium">{t.paiement.crypto.risquesTitre}</h3>
              <ul className="registre mt-3 max-w-3xl border-y border-border text-sm">
                {fiche.risques.map((r) => (
                  <li key={r} className="py-3 leading-relaxed">
                    {r}
                  </li>
                ))}
                {RISQUES_UNIVERSELS_CLES.map((cle) => (
                  <li key={cle} className="py-3 leading-relaxed">
                    {t.paiement.crypto.universels[cle]}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 font-medium">{t.paiement.crypto.sourcesTitre}</h3>
              <ul className="mt-3 space-y-1 text-sm">
                {fiche.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {s.titre}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            {t.commun.verifieLe} {formaterDate(DERNIERE_VERIFICATION)}
          </p>
          <p className="mt-6 max-w-3xl border-l-2 border-statut-jaune pl-4 leading-relaxed">
            {t.paiement.crypto.avertissement}
          </p>
        </section>

        {/* -------------------------------------------------------------- Décisions */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-semibold">
            {t.paiement.decision.titre}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            {t.paiement.decision.corps}
          </p>

          <h3 className="mt-8 font-medium">{t.paiement.decision.journal}</h3>
          {decisions.filter((d) => d.beneficiaireId === b.id).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t.paiement.decision.vide}
            </p>
          ) : (
            <ul className="registre mt-3 border-y border-border text-sm">
              {decisions
                .filter((d) => d.beneficiaireId === b.id)
                .map((d) => (
                  <li
                    key={d.id}
                    className="chiffres flex flex-wrap items-baseline gap-x-8 gap-y-1 py-3"
                  >
                    <span>{formaterHorodatage(d.creeLe)}</span>
                    <span className="font-medium">
                      {t.paiement.strategies[d.strategie as CleStrategie].nom}
                    </span>
                    <span>
                      1 {d.deviseBase} = {formaterTaux(d.taux)} {d.deviseCible} ·{" "}
                      {formaterDate(d.dateTaux)}
                    </span>
                    <span>{formaterMontant(d.coutEstime, d.deviseBase, 0)}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <div className="mt-16 max-w-3xl">
          <Terme cle="correspondant" />
        </div>
      </div>

      {/* Panneau fixe : les mêmes chiffres qu'ailleurs sur la page, jamais un
          calcul nouveau, pour qu'on les ait sous les yeux en faisant défiler. */}
      {marche?.taux && resume && (
        <aside className="hidden lg:block">
          <dl className="registre sticky top-8 border-y border-border text-sm">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-muted-foreground">
                {t.paiement.taux.dateTaux} {formaterDate(marche.dateTaux)}
              </dt>
              <dd className="chiffres text-right">
                {t.paiement.taux.valeur(
                  base,
                  formaterTaux(marche.taux),
                  b.devise,
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-muted-foreground">
                {t.paiement.vosChiffres.marge}
                {t.commun.deuxPoints}
              </dt>
              <dd className="chiffres">
                {formaterPourcentage(hypotheses.virementMargePct, 1)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-muted-foreground">
                {t.paiement.strategies.moinsChere}
                {t.commun.deuxPoints}
              </dt>
              <dd>{t.paiement.strategies[resume.moinsChere].nom}</dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  );
}

function motifEnClair(
  t: ReturnType<typeof useT>,
  motif: "devise_non_publiee" | "source_indisponible" | "meme_devise",
  devise: string,
): string {
  if (motif === "devise_non_publiee")
    return t.paiement.taux.indisponible.devise_non_publiee(devise);
  if (motif === "meme_devise") return t.paiement.taux.indisponible.meme_devise;
  return t.paiement.taux.indisponible.source_indisponible;
}

function Mesure({
  titre,
  aide,
  montant,
  pourcentage,
}: {
  titre: string;
  aide: string;
  montant: string;
  pourcentage: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 py-4">
      <div className="max-w-md">
        <dt className="font-medium">{titre}</dt>
        <dd className="text-sm text-muted-foreground">{aide}</dd>
      </div>
      {/* Le montant d'abord, le pourcentage ensuite et en gris : c'est la
          règle de lecture de tout l'outil. */}
      <dd className="chiffres text-right">
        {montant && <span className="text-lg">{montant}</span>}
        <span className="ml-3 text-sm text-muted-foreground">{pourcentage}</span>
      </dd>
    </div>
  );
}
