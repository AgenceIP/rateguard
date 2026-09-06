"use client";

import Link from "next/link";

import { useLangue, useT } from "@/i18n";
import type { Langue } from "@/lib/format";

const LANGUES: Langue[] = ["fr", "en"];

/**
 * Le sélecteur est un groupe de deux boutons plutôt qu'un menu : à deux
 * options, l'état courant se lit sans ouvrir quoi que ce soit.
 */
function SelecteurLangue() {
  const t = useT();
  const { langue, changerLangue } = useLangue();

  return (
    <div
      role="group"
      aria-label={t.langue.choisir}
      className="flex items-baseline gap-1 text-sm"
    >
      {LANGUES.map((code, index) => (
        <span key={code} className="flex items-baseline gap-1">
          {index > 0 && (
            <span aria-hidden className="text-border">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => changerLangue(code)}
            aria-current={langue === code}
            className={
              langue === code
                ? "font-semibold text-foreground"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {code.toUpperCase()}
            <span className="sr-only"> — {t.langue[code]}</span>
          </button>
        </span>
      ))}
    </div>
  );
}

export function EnTete() {
  const t = useT();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-baseline gap-8 px-6 py-5">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          {t.marque.nom}
        </Link>
        <nav className="flex items-baseline gap-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.accueil}
          </Link>
          <Link
            href="/journal"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.journal}
          </Link>
          <Link
            href="/donnees"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.donnees}
          </Link>
          <Link
            href="/conformite"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.conformite}
          </Link>
        </nav>
        <div className="ml-auto">
          <SelecteurLangue />
        </div>
      </div>
    </header>
  );
}

export function PiedDePage() {
  const t = useT();

  return (
    <footer className="mt-20 border-t border-border">
      <p className="mx-auto w-full max-w-6xl px-6 py-6 text-sm leading-relaxed text-muted-foreground">
        {t.piedDePage}
      </p>
    </footer>
  );
}
