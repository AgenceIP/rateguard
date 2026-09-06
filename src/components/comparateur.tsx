"use client";

import { Fragment, useState } from "react";

import { useT } from "@/i18n";
import { formaterMontant } from "@/lib/format";
import type { CleStrategie, CoutStrategie } from "@/lib/types";

/**
 * Le comparateur.
 *
 * L'ordre des lignes reste celui du raisonnement — ce que tu fais aujourd'hui,
 * puis les alternatives — et jamais un tri par prix : classer transformerait un
 * comparateur en recommandation. La moins chère est SIGNALÉE, pas remontée.
 */
export function Comparateur({
  strategies,
  base,
  moinsChere,
  onNoter,
}: {
  strategies: CoutStrategie[];
  base: string;
  moinsChere: CleStrategie;
  onNoter: (cle: CleStrategie) => void;
}) {
  const t = useT();
  const s = t.paiement.strategies;
  const [depliee, setDepliee] = useState<CleStrategie | null>(null);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="py-2 font-normal">
              {s.colonneOption}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {s.colonneCout}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {s.colonneCertitude}
            </th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((option) => {
            const texte = s[option.cle];
            const ouverte = depliee === option.cle;
            return (
              <Fragment key={option.cle}>
                <tr className="border-b border-border align-baseline">
                  <th scope="row" className="py-4 pr-4 text-left font-medium">
                    {texte.nom}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {texte.court}
                    </span>
                    {option.cle === moinsChere && (
                      <span className="mt-1 block text-xs font-medium">
                        {s.moinsChere}
                      </span>
                    )}
                  </th>
                  <td className="py-4 text-right">
                    <span className="chiffres">
                      {option.certain
                        ? formaterMontant(option.coutCentral, base, 0)
                        : s.central(formaterMontant(option.coutCentral, base, 0))}
                    </span>
                    {!option.certain && (
                      <span className="chiffres block text-xs">
                        {s.plage(
                          formaterMontant(option.coutPlancher, base, 0),
                          formaterMontant(option.coutPlafond, base, 0),
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right text-muted-foreground">
                    {option.certain ? s.certain : s.incertainCourt}
                    <button
                      type="button"
                      className="mt-1 block w-full text-right text-xs underline underline-offset-4"
                      aria-expanded={ouverte}
                      aria-controls={`detail-${option.cle}`}
                      onClick={() => setDepliee(ouverte ? null : option.cle)}
                    >
                      {ouverte ? s.replier : s.deplier}
                    </button>
                  </td>
                </tr>

                {ouverte && (
                  <tr id={`detail-${option.cle}`} className="border-b border-border">
                    <td colSpan={3} className="py-4">
                      <p className="max-w-2xl leading-relaxed">
                        {texte.explication}
                      </p>
                      <p className="mt-2 max-w-2xl leading-relaxed">
                        + {texte.pour}
                      </p>
                      <p className="mt-1 max-w-2xl leading-relaxed">
                        − {texte.contre}
                      </p>
                      <dl className="registre mt-4 max-w-md border-y border-border">
                        {option.lignes.map((l) => (
                          <div
                            key={l.cle}
                            className="flex justify-between gap-6 py-2"
                          >
                            <dt className="text-muted-foreground">
                              {s.postes[l.cle]}
                            </dt>
                            <dd className="chiffres">
                              {formaterMontant(l.montant, base, 0)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {option.nombreTransferts > 1 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {s.transferts(option.nombreTransferts)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="mt-3 text-xs underline underline-offset-4"
                        onClick={() => onNoter(option.cle)}
                      >
                        {t.paiement.decision.bouton}
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
