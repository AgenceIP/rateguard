"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { HYPOTHESES_DEFAUT } from "./hypotheses";
import type { Beneficiaire, Hypotheses, Profil } from "./types";

/**
 * Persistance — Supabase quand il est configuré, localStorage sinon.
 *
 * Les deux implémentations existent parce que l'application doit tourner sans
 * aucune variable d'environnement : une démo qui exige des identifiants pour
 * afficher son premier écran est une démo qui ne s'ouvre pas. Dès que
 * NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont présentes,
 * tout passe par Supabase sans qu'aucun appelant ne change.
 *
 * L'API est asynchrone des deux côtés, y compris pour le localStorage qui
 * n'en aurait pas besoin : c'est le prix pour que le reste du code n'ait
 * jamais à savoir lequel des deux répond.
 */

const CLE_PROFIL = "rateguard.profil.v2";
const CLE_DECISIONS = "rateguard.decisions.v2";
const CLE_ESPACE = "rateguard.espace.v1";

/**
 * Identifiant d'espace, opaque et local. Il n'y a pas de compte utilisateur :
 * c'est ce jeton, gardé dans le navigateur, qui rattache les lignes Supabase
 * à cette installation.
 */
export function espace(): string {
  if (typeof window === "undefined") return "";
  let valeur = window.localStorage.getItem(CLE_ESPACE);
  if (!valeur) {
    valeur = crypto.randomUUID();
    window.localStorage.setItem(CLE_ESPACE, valeur);
  }
  return valeur;
}

let client: SupabaseClient | null | undefined;

function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && cle
      ? createClient(url, cle, {
          // L'en-tête que lisent les politiques RLS du schéma.
          global: { headers: { "x-espace": espace() } },
          auth: { persistSession: false },
        })
      : null;
  return client;
}

/** true quand les données partent vers Supabase, false quand elles restent locales. */
export function stockageDistant(): boolean {
  return supabase() !== null;
}

export const PROFIL_VIDE: Profil = {
  deviseBase: "CAD",
  beneficiaires: [],
  hypotheses: HYPOTHESES_DEFAUT,
};

function lireLocal<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    // Un stockage corrompu ne doit jamais empêcher l'application de démarrer.
    return defaut;
  }
}

export async function lireProfil(): Promise<Profil> {
  const sb = supabase();
  if (!sb) return lireLocal(CLE_PROFIL, PROFIL_VIDE);

  const id = espace();
  const [profil, beneficiaires] = await Promise.all([
    sb.from("profils").select("devise_base, hypotheses").eq("espace", id).maybeSingle(),
    sb.from("beneficiaires").select("*").eq("espace", id).order("cree_le"),
  ]);

  if (profil.error || beneficiaires.error) return lireLocal(CLE_PROFIL, PROFIL_VIDE);

  return {
    deviseBase: profil.data?.devise_base ?? PROFIL_VIDE.deviseBase,
    hypotheses: {
      ...HYPOTHESES_DEFAUT,
      ...((profil.data?.hypotheses as Partial<Hypotheses>) ?? {}),
    },
    beneficiaires: (beneficiaires.data ?? []).map((l) => ({
      id: l.id as string,
      nom: l.nom as string,
      pays: l.pays as string,
      devise: l.devise as string,
      montant: Number(l.montant),
      frequence: l.frequence as Beneficiaire["frequence"],
      type: l.type as Beneficiaire["type"],
      prochainPaiement: l.prochain_paiement as string,
    })),
  };
}

export async function enregistrerProfil(profil: Profil): Promise<void> {
  const sb = supabase();
  if (!sb) {
    window.localStorage.setItem(CLE_PROFIL, JSON.stringify(profil));
    return;
  }

  const id = espace();
  await sb
    .from("profils")
    .upsert({
      espace: id,
      devise_base: profil.deviseBase,
      hypotheses: profil.hypotheses,
      maj: new Date().toISOString(),
    });

  // Remplacement intégral : la liste de bénéficiaires est toujours écrite en
  // bloc depuis l'interface, un diff ligne à ligne n'apporterait rien.
  await sb.from("beneficiaires").delete().eq("espace", id);
  if (profil.beneficiaires.length > 0) {
    await sb.from("beneficiaires").insert(
      profil.beneficiaires.map((b) => ({
        id: b.id,
        espace: id,
        nom: b.nom,
        pays: b.pays,
        devise: b.devise,
        montant: b.montant,
        frequence: b.frequence,
        type: b.type,
        prochain_paiement: b.prochainPaiement,
      })),
    );
  }
}

export interface Decision {
  id: string;
  beneficiaireId: string;
  beneficiaireNom: string;
  strategie: string;
  deviseBase: string;
  deviseCible: string;
  montantCible: number;
  taux: number;
  dateTaux: string;
  coutEstime: number;
  creeLe: number;
}

/**
 * Journal des décisions.
 *
 * Une ligne fige le taux et sa date au moment du choix. C'est ce qui permet,
 * plus tard, d'expliquer une décision avec ce qu'on savait ce jour-là plutôt
 * qu'avec ce qu'on sait maintenant. Rien n'est modifié après écriture.
 */
export async function lireDecisions(): Promise<Decision[]> {
  const sb = supabase();
  if (!sb) return lireLocal<Decision[]>(CLE_DECISIONS, []);

  const { data, error } = await sb
    .from("decisions")
    .select("*")
    .eq("espace", espace())
    .order("cree_le", { ascending: false });

  if (error || !data) return [];
  return data.map((l) => ({
    id: l.id as string,
    beneficiaireId: (l.beneficiaire_id as string) ?? "",
    beneficiaireNom: l.beneficiaire_nom as string,
    strategie: l.strategie as string,
    deviseBase: l.devise_base as string,
    deviseCible: l.devise_cible as string,
    montantCible: Number(l.montant_cible),
    taux: Number(l.taux),
    dateTaux: l.date_taux as string,
    coutEstime: Number(l.cout_estime),
    creeLe: new Date(l.cree_le as string).getTime(),
  }));
}

export async function enregistrerDecision(
  decision: Omit<Decision, "id" | "creeLe">,
): Promise<void> {
  const sb = supabase();
  if (!sb) {
    const existantes = lireLocal<Decision[]>(CLE_DECISIONS, []);
    const ligne: Decision = {
      ...decision,
      id: crypto.randomUUID(),
      creeLe: Date.now(),
    };
    window.localStorage.setItem(
      CLE_DECISIONS,
      JSON.stringify([ligne, ...existantes]),
    );
    return;
  }

  await sb.from("decisions").insert({
    espace: espace(),
    beneficiaire_id: decision.beneficiaireId || null,
    beneficiaire_nom: decision.beneficiaireNom,
    strategie: decision.strategie,
    devise_base: decision.deviseBase,
    devise_cible: decision.deviseCible,
    montant_cible: decision.montantCible,
    taux: decision.taux,
    date_taux: decision.dateTaux,
    cout_estime: decision.coutEstime,
  });
}
