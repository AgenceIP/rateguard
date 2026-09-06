"use client";

import { useT } from "@/i18n";

export default function Conformite() {
  const t = useT();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {t.conformite.titre}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
        {t.conformite.intro}
      </p>

      {/* Les quatre voies sans instrument viennent en premier : ce sont les
          seules qui ne dépendent d'aucun avis contesté. */}
      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.sansInstrument.titre}
        </h2>
        <ol className="registre mt-4 max-w-3xl border-y border-border">
          {t.conformite.sansInstrument.corps.map((p) => (
            <li key={p} className="py-4 leading-relaxed">
              {p}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t.conformite.sansInstrument.note}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.wad.titre}
        </h2>
        {t.conformite.wad.corps.map((p) => (
          <p key={p} className="mt-3 max-w-3xl leading-relaxed">
            {p}
          </p>
        ))}
        <p className="mt-5 border-l-2 border-primary pl-4 font-medium">
          {t.conformite.wad.norme}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.desaccord.titre}
        </h2>
        {t.conformite.desaccord.corps.map((p) => (
          <p key={p} className="mt-3 max-w-3xl leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.cryptoFiqh.titre}
        </h2>
        {t.conformite.cryptoFiqh.corps.map((p) => (
          <p key={p} className="mt-3 max-w-3xl leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      <p className="mt-14 max-w-3xl border-l-2 border-statut-jaune pl-4 leading-relaxed">
        {t.conformite.disclaimer}
      </p>
    </div>
  );
}
