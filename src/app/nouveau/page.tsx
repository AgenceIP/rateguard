"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";
import { montantLigneEnDevise } from "@/lib/calculs";
import { aujourdhuiISO, formaterPourcentage } from "@/lib/format";
import { enregistrerForfait } from "@/lib/stockage";
import { recupererTaux } from "@/lib/taux";
import type { DeviseCible, Forfait, LignePaiement } from "@/lib/types";

interface LigneBrouillon {
  id: string;
  pourcentage: string;
  dateEstimee: string;
  description: string;
}

/**
 * Valeurs de départ calquées sur le cas réel d'Umrah MTL : une vingtaine de
 * pèlerins, un seul virement au fournisseur environ une semaine après
 * l'encaissement du groupe. Rien n'est figé — une agence qui bloque des
 * chambres pour le Hajj entrera une date à plusieurs mois, et tous les calculs
 * de risque s'ajusteront à cette durée.
 */
function ligneParDefaut(): LigneBrouillon {
  return {
    id: crypto.randomUUID(),
    pourcentage: "100",
    dateEstimee: aujourdhuiISO(7),
    // Vide : l'exemple est un placeholder, pas du texte à effacer. Il vient de
    // la langue active, qui peut changer après le montage de cette ligne.
    description: "",
  };
}

export default function NouveauForfaitPage() {
  const t = useT();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [pelerins, setPelerins] = useState("20");
  const [montant, setMontant] = useState("50000");
  const [deviseCible, setDeviseCible] = useState<DeviseCible>("SAR");
  const [marge, setMarge] = useState("12");
  // La ligne par défaut naît côté navigateur seulement : son identifiant
  // (crypto.randomUUID) et sa date (aujourd'hui + 7) ne peuvent pas être
  // calculés deux fois — une fois sur le serveur, une fois ici — sans donner
  // deux résultats différents, ce que React signale comme une erreur
  // d'hydratation. Le serveur rend donc un échéancier vide, rempli au montage.
  const [echeancier, setEcheancier] = useState<LigneBrouillon[]>([]);

  useEffect(() => {
    setEcheancier([ligneParDefaut()]);
  }, []);

  const [erreurs, setErreurs] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);

  const totalPourcentage = useMemo(
    () =>
      echeancier.reduce(
        (somme, ligne) => somme + (Number(ligne.pourcentage) || 0),
        0,
      ),
    [echeancier],
  );

  function majLigne(id: string, champs: Partial<LigneBrouillon>) {
    setEcheancier((lignes) =>
      lignes.map((ligne) =>
        ligne.id === id ? { ...ligne, ...champs } : ligne,
      ),
    );
  }

  function valider(): string[] {
    const trouvees: string[] = [];
    if (!nom.trim()) trouvees.push(t.nouveau.erreurs.nom);
    if (!(Number(pelerins) > 0)) trouvees.push(t.nouveau.erreurs.pelerins);
    if (!(Number(montant) > 0)) trouvees.push(t.nouveau.erreurs.montant);
    const margeNum = Number(marge);
    if (!(margeNum >= 0 && margeNum <= 100))
      trouvees.push(t.nouveau.erreurs.marge);
    if (echeancier.length === 0)
      trouvees.push(t.nouveau.erreurs.echeancierVide);
    if (echeancier.some((ligne) => !ligne.dateEstimee))
      trouvees.push(t.nouveau.erreurs.echeancierDate);
    if (Math.abs(totalPourcentage - 100) > 0.01)
      trouvees.push(t.nouveau.erreurs.echeancierTotal);
    return trouvees;
  }

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    const trouvees = valider();
    setErreurs(trouvees);
    if (trouvees.length > 0) return;

    setEnCours(true);
    try {
      // Le taux est capté ici et nulle part ailleurs : c'est l'instant que le
      // reçu de verrouillage horodate.
      const { taux, sourceTaux } = await recupererTaux(deviseCible);
      const montantTotalCAD = Number(montant);

      const lignes: LignePaiement[] = echeancier.map((ligne) => ({
        id: ligne.id,
        pourcentage: Number(ligne.pourcentage),
        montant: montantLigneEnDevise(
          Number(ligne.pourcentage),
          montantTotalCAD,
          taux,
        ),
        devise: deviseCible,
        dateEstimee: ligne.dateEstimee,
        description: ligne.description.trim() || t.nouveau.echeancier.ligne,
      }));

      const forfait: Forfait = {
        id: crypto.randomUUID(),
        nom: nom.trim(),
        nombrePelerins: Number(pelerins),
        montantTotalCAD,
        deviseCible,
        echeancier: lignes,
        margeConnue: Number(marge),
        dateCreation: sourceTaux.horodatageRecuperation,
        tauxVerrouille: taux,
        sourceTaux,
      };

      enregistrerForfait(forfait);
      router.push(`/forfait/${forfait.id}`);
    } catch {
      setErreurs([t.nouveau.erreurs.taux]);
      setEnCours(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="font-heading text-4xl font-semibold">
        {t.nouveau.titre}
      </h1>
      <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
        {t.nouveau.sousTitre}
      </p>

      <form onSubmit={soumettre} className="mt-12 space-y-12">
        <section className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nom">{t.nouveau.champs.nom}</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={t.nouveau.champs.nomExemple}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              {t.nouveau.champs.nomIndice}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pelerins">{t.nouveau.champs.pelerins}</Label>
              <Input
                id="pelerins"
                type="number"
                min={1}
                className="chiffres"
                value={pelerins}
                onChange={(e) => setPelerins(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant">{t.nouveau.champs.montant}</Label>
              <Input
                id="montant"
                type="number"
                min={0}
                step={100}
                className="chiffres"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t.nouveau.champs.montantIndice}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="devise">{t.nouveau.champs.deviseCible}</Label>
              <Select
                value={deviseCible}
                onValueChange={(valeur) =>
                  setDeviseCible(valeur as DeviseCible)
                }
              >
                <SelectTrigger id="devise" className="w-full">
                  {/* Base UI affiche la valeur brute par défaut : on formate. */}
                  <SelectValue>
                    {(valeur: DeviseCible) => t.nouveau.champs.devises[valeur]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.nouveau.champs.devises).map(
                    ([code, libelle]) => (
                      <SelectItem key={code} value={code}>
                        {libelle}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t.nouveau.champs.deviseIndice}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marge">{t.nouveau.champs.marge}</Label>
              <Input
                id="marge"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="chiffres"
                value={marge}
                onChange={(e) => setMarge(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t.nouveau.champs.margeIndice}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">
            {t.nouveau.echeancier.titre}
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t.nouveau.echeancier.indice}
          </p>

          {/*
            L'échéancier est une vraie séquence de versements : la numérotation
            porte de l'information, elle n'est pas décorative.
          */}
          <ol className="registre mt-6 border-y border-border">
            {echeancier.map((ligne, index) => (
              <li
                key={ligne.id}
                className="grid gap-4 py-5 sm:grid-cols-[2rem_1fr_9rem_11rem_auto] sm:items-end"
              >
                <span className="chiffres pb-2 text-sm text-muted-foreground">
                  {index + 1}
                </span>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${ligne.id}`}>
                    {t.commun.description}
                  </Label>
                  <Input
                    id={`desc-${ligne.id}`}
                    value={ligne.description}
                    placeholder={t.nouveau.echeancier.descriptionExemple}
                    onChange={(e) =>
                      majLigne(ligne.id, { description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`pct-${ligne.id}`}>
                    {t.nouveau.echeancier.pourcentage}
                  </Label>
                  <Input
                    id={`pct-${ligne.id}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="chiffres"
                    value={ligne.pourcentage}
                    onChange={(e) =>
                      majLigne(ligne.id, { pourcentage: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`date-${ligne.id}`}>
                    {t.nouveau.echeancier.dateEstimee}
                  </Label>
                  <Input
                    id={`date-${ligne.id}`}
                    type="date"
                    className="chiffres"
                    value={ligne.dateEstimee}
                    onChange={(e) =>
                      majLigne(ligne.id, { dateEstimee: e.target.value })
                    }
                  />
                </div>

                {echeancier.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-self-start text-muted-foreground"
                    onClick={() =>
                      setEcheancier((lignes) =>
                        lignes.filter((autre) => autre.id !== ligne.id),
                      )
                    }
                  >
                    {t.nouveau.echeancier.retirer}
                  </Button>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setEcheancier((lignes) => [
                  ...lignes,
                  { ...ligneParDefaut(), pourcentage: "0" },
                ])
              }
            >
              {t.nouveau.echeancier.ajouter}
            </Button>
            <p
              className={`chiffres text-sm ${
                Math.abs(totalPourcentage - 100) > 0.01
                  ? "text-statut-jaune"
                  : "text-muted-foreground"
              }`}
            >
              {Math.abs(totalPourcentage - 100) > 0.01
                ? t.nouveau.echeancier.totalEcart(
                    formaterPourcentage(totalPourcentage, 0),
                  )
                : t.nouveau.echeancier.totalOk}
            </p>
          </div>
        </section>

        {erreurs.length > 0 && (
          <ul
            className="space-y-1 border-l-2 border-destructive pl-4 text-sm text-destructive"
            role="alert"
          >
            {erreurs.map((erreur) => (
              <li key={erreur}>{erreur}</li>
            ))}
          </ul>
        )}

        <Button type="submit" size="lg" disabled={enCours}>
          {enCours ? t.nouveau.actionEnCours : t.nouveau.action}
        </Button>
      </form>
    </div>
  );
}
