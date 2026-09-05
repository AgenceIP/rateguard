import type { Metadata } from "next";

import { t } from "@/i18n";

export const metadata: Metadata = {
  title: `${t.conformite.titre} — ${t.app.nom}`,
};

function Paragraphes({ textes }: { textes: readonly string[] }) {
  return (
    <div className="mt-4 space-y-4">
      {textes.map((texte) => (
        <p key={texte} className="max-w-[68ch] leading-relaxed">
          {texte}
        </p>
      ))}
    </div>
  );
}

export default function ConformitePage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="font-heading text-4xl font-semibold leading-tight">
        {t.conformite.titre}
      </h1>
      <p className="mt-4 max-w-[68ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
        {t.conformite.intro}
      </p>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.risque.titre}
        </h2>
        <Paragraphes textes={t.conformite.risque.corps} />
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.wad.titre}
        </h2>
        <Paragraphes textes={t.conformite.wad.corps} />
        <p className="mt-6 border-l-2 border-primary py-1 pl-4 leading-relaxed">
          {t.conformite.wad.norme}
        </p>
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.desaccord.titre}
        </h2>
        <Paragraphes textes={t.conformite.desaccord.corps} />
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-semibold">
          {t.conformite.limites.titre}
        </h2>
        <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
          <ul className="registre bg-card p-6">
            {t.conformite.limites.fait.map((item) => (
              <li key={item} className="py-3 leading-relaxed first:pt-0">
                {item}
              </li>
            ))}
          </ul>
          <ul className="registre bg-card p-6">
            {t.conformite.limites.neFaitPas.map((item) => (
              <li
                key={item}
                className="py-3 leading-relaxed text-muted-foreground first:pt-0"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-14 border-t border-border pt-8 text-sm leading-relaxed text-muted-foreground">
        {t.conformite.disclaimer}
      </p>
    </article>
  );
}
