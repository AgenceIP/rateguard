"use client";

import { useEffect, useState } from "react";

import { Glose } from "@/components/lexique";
import { DERNIERE_VERIFICATION, PAYS_VERIFIES } from "@/data/crypto-paie";
import { DEVISES_NON_PUBLIEES, nomPays } from "@/data/pays";
import { useT } from "@/i18n";
import { formaterDate, localeActive } from "@/lib/format";
import { stockageDistant } from "@/lib/stockage";

function Section({
  titre,
  corps,
  children,
}: {
  titre: string;
  corps: string[];
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="font-heading text-2xl font-semibold">{titre}</h2>
      {corps.map((p) => (
        <p key={p} className="mt-3 max-w-3xl leading-relaxed">
          {p}
        </p>
      ))}
      {children}
    </section>
  );
}

export default function Donnees() {
  const t = useT();
  const locale = localeActive();
  // `stockageDistant` lit `process.env` et le localStorage : la valeur ne peut
  // être connue qu'après le montage, sinon le serveur et le client rendent
  // deux phrases différentes.
  const [distant, setDistant] = useState<boolean | null>(null);
  useEffect(() => setDistant(stockageDistant()), []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {t.donnees.titre}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
        {t.donnees.intro}
      </p>

      <Section titre={t.donnees.taux.titre} corps={t.donnees.taux.corps}>
        <p className="mt-3 max-w-3xl leading-relaxed">
          {t.donnees.taux.devisesAbsentes}
        </p>
        <p className="chiffres mt-3 max-w-3xl text-sm text-muted-foreground">
          {DEVISES_NON_PUBLIEES.join(" · ")}
        </p>
      </Section>

      <Section
        titre={t.donnees.statistiques.titre}
        corps={t.donnees.statistiques.corps}
      />

      <Section titre={t.donnees.frais.titre} corps={t.donnees.frais.corps} />

      <Section titre={t.donnees.crypto.titre} corps={t.donnees.crypto.corps}>
        <dl className="registre mt-6 border-y border-border text-sm">
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-1 py-3">
            <dt className="text-muted-foreground">
              {t.donnees.crypto.derniere}
            </dt>
            <dd className="chiffres">{formaterDate(DERNIERE_VERIFICATION)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-1 py-3">
            <dt className="text-muted-foreground">
              {t.donnees.crypto.paysVerifies}
            </dt>
            <dd className="max-w-xl text-right">
              {PAYS_VERIFIES.map((c) => nomPays(c, locale)).join(", ")}
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        titre={t.donnees.stockage.titre}
        corps={
          distant === null
            ? []
            : [distant ? t.donnees.stockage.supabase : t.donnees.stockage.local]
        }
      />

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.donnees.limites.titre}
        </h2>
        <ul className="registre mt-4 max-w-3xl border-y border-border">
          {t.donnees.limites.liste.map((l) => (
            <li key={l} className="py-3 leading-relaxed">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.donnees.lexiqueTitre}
        </h2>
        <Glose
          cles={[
            "taux",
            "marge",
            "volatilite",
            "forward",
            "etalement",
            "multidevise",
            "correspondant",
            "stablecoin",
          ]}
        />
      </section>
    </div>
  );
}
