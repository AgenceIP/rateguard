"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { formaterDate, formaterMontant, formaterPourcentage } from "@/lib/format";
import { coutDeLAttente, coutReel, tauxAuPlusProche } from "@/lib/journal";
import { useMarches } from "@/lib/marche";
import {
  enregistrerPaiement,
  lireJournal,
  lireProfil,
  supprimerPaiement,
} from "@/lib/stockage";
import type { CanalPaiement, PaiementPasse, Profil } from "@/lib/types";

const CANAUX: CanalPaiement[] = [
  "spot",
  "forward",
  "etalement",
  "multidevise",
  "autre",
];

export default function Journal() {
  const t = useT();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [paiements, setPaiements] = useState<PaiementPasse[]>([]);
  const [ouvert, setOuvert] = useState(false);

  const recharger = () => lireJournal().then(setPaiements);
  useEffect(() => {
    lireProfil().then(setProfil);
    recharger();
  }, []);

  const base = profil?.deviseBase ?? "CAD";
  const { marches } = useMarches(base, paiements.map((p) => p.devise));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {t.journal.titre}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
        {t.journal.intro}
      </p>

      {paiements.length === 0 ? (
        <p className="mt-10 leading-relaxed">{t.journal.vide}</p>
      ) : (
        <ul className="registre mt-10 border-y border-border">
          {paiements.map((p) => {
            const serie = marches[p.devise]?.serie ?? null;
            const taux = serie ? tauxAuPlusProche(serie, p.date) : null;
            const cout = taux ? coutReel(p, taux) : null;
            const attente = serie ? coutDeLAttente(p, serie) : null;

            return (
              <li key={p.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="font-medium">{p.beneficiaireNom}</span>
                  <span className="chiffres text-sm text-muted-foreground">
                    {formaterDate(p.date)} · {t.journal.canaux[p.canal]}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  {t.journal.colonnes.envoye}
                  {t.commun.deuxPoints}
                  <span className="chiffres">
                    {formaterMontant(p.montantEnvoye, p.deviseBase)}
                  </span>
                  {" · "}
                  {p.montantRecu === null
                    ? t.journal.colonnes.voulu
                    : t.journal.colonnes.recu}
                  {t.commun.deuxPoints}
                  <span className="chiffres">
                    {formaterMontant(p.montantRecu ?? p.montantVoulu, p.devise)}
                  </span>
                </p>

                <p className="mt-1 text-sm">
                  {!cout
                    ? t.journal.ecart.sansTaux
                    : cout.ecart < 0
                      ? cout.complet
                        ? t.journal.ecart.gain(
                            formaterMontant(-cout.ecart, p.deviseBase, 0),
                          )
                        : t.journal.ecart.gainPartiel(
                            formaterMontant(-cout.ecart, p.deviseBase, 0),
                          )
                      : cout.complet
                        ? t.journal.ecart.complet(
                            formaterMontant(cout.ecart, p.deviseBase, 0),
                            formaterPourcentage(cout.ecartPct),
                          )
                        : t.journal.ecart.partiel(
                            formaterMontant(cout.ecart, p.deviseBase, 0),
                            formaterPourcentage(cout.ecartPct),
                          )}
                </p>

                {attente && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {attente.montant >= 0
                      ? t.journal.attente.coute(
                          attente.jours,
                          formaterMontant(attente.montant, p.deviseBase, 0),
                        )
                      : t.journal.attente.rapporte(
                          attente.jours,
                          formaterMontant(-attente.montant, p.deviseBase, 0),
                        )}
                  </p>
                )}

                <button
                  type="button"
                  className="mt-2 text-sm text-muted-foreground underline underline-offset-4"
                  onClick={() => supprimerPaiement(p.id).then(recharger)}
                >
                  {t.journal.supprimer}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {ouvert ? (
        <Formulaire
          base={base}
          onAnnuler={() => setOuvert(false)}
          onEnregistrer={async (p) => {
            await enregistrerPaiement(p);
            await recharger();
            setOuvert(false);
          }}
        />
      ) : (
        <Button className="mt-8" onClick={() => setOuvert(true)}>
          {t.journal.ajouter}
        </Button>
      )}
    </div>
  );
}

function Formulaire({
  base,
  onAnnuler,
  onEnregistrer,
}: {
  base: string;
  onAnnuler: () => void;
  onEnregistrer: (p: Omit<PaiementPasse, "id">) => void;
}) {
  const t = useT();
  const [nom, setNom] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [devise, setDevise] = useState("USD");
  const [envoye, setEnvoye] = useState("");
  const [voulu, setVoulu] = useState("");
  const [recu, setRecu] = useState("");
  const [frais, setFrais] = useState("");
  const [reference, setReference] = useState("");
  const [canal, setCanal] = useState<CanalPaiement>("spot");

  const valide =
    nom.trim() &&
    Number(envoye) > 0 &&
    Number(voulu) > 0 &&
    devise.trim().length === 3;

  return (
    <form
      className="mt-8 border-t border-border pt-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valide) return;
        onEnregistrer({
          beneficiaireId: null,
          beneficiaireNom: nom.trim(),
          date,
          deviseBase: base,
          montantEnvoye: Number(envoye),
          devise: devise.toUpperCase(),
          montantVoulu: Number(voulu),
          montantRecu: recu ? Number(recu) : null,
          fraisAffiches: frais ? Number(frais) : null,
          canal,
          dateReference: reference || null,
          note: "",
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label={t.journal.champs.beneficiaire}>
          <input
            className="champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </Champ>

        <Champ label={t.journal.champs.date} aide={t.journal.champs.dateAide}>
          <input
            className="champ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Champ>

        <Champ label={`${t.journal.champs.montantEnvoye} (${base})`}>
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={envoye}
            onChange={(e) => setEnvoye(e.target.value)}
            required
          />
        </Champ>

        <Champ label={t.journal.champs.montantVoulu}>
          <div className="flex gap-2">
            <input
              className="champ chiffres"
              type="number"
              min="0"
              step="0.01"
              value={voulu}
              onChange={(e) => setVoulu(e.target.value)}
              required
            />
            <input
              className="champ w-24 uppercase"
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              maxLength={3}
              required
              aria-label={t.journal.champs.devise}
            />
          </div>
        </Champ>

        <Champ
          label={t.journal.champs.montantRecu}
          aide={t.journal.champs.montantRecuAide}
        >
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={recu}
            onChange={(e) => setRecu(e.target.value)}
          />
        </Champ>

        <Champ
          label={t.journal.champs.dateReference}
          aide={t.journal.champs.dateReferenceAide}
        >
          <input
            className="champ"
            type="date"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Champ>

        <Champ
          label={`${t.journal.champs.fraisAffiches} (${base})`}
          aide={t.journal.champs.fraisAffichesAide}
        >
          <input
            className="champ chiffres"
            type="number"
            min="0"
            step="0.01"
            value={frais}
            onChange={(e) => setFrais(e.target.value)}
          />
        </Champ>

        <Champ label={t.journal.champs.canal}>
          <select
            className="champ"
            value={canal}
            onChange={(e) => setCanal(e.target.value as CanalPaiement)}
          >
            {CANAUX.map((c) => (
              <option key={c} value={c}>
                {t.journal.canaux[c]}
              </option>
            ))}
          </select>
        </Champ>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={!valide}>
          {t.journal.enregistrer}
        </Button>
        <Button type="button" variant="ghost" onClick={onAnnuler}>
          {t.journal.annuler}
        </Button>
      </div>
    </form>
  );
}

function Champ({
  label,
  aide,
  children,
}: {
  label: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {aide && (
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {aide}
        </span>
      )}
    </label>
  );
}
