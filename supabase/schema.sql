-- RateGuard — schéma Supabase.
--
-- À exécuter tel quel dans l'éditeur SQL du projet Supabase, puis renseigner
-- NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.
-- Sans ces variables, l'application bascule sur le localStorage du navigateur
-- et reste pleinement fonctionnelle (voir src/lib/stockage.ts).
--
-- Il n'y a pas d'authentification : l'application ne demande ni courriel ni
-- mot de passe. Chaque navigateur génère un identifiant d'espace opaque,
-- conservé localement, qui sert de clé de partitionnement. C'est suffisant
-- pour un outil de calcul qui ne détient aucun fonds, et c'est dit à
-- l'utilisateur sur la page « D'où viennent les données ».

create table if not exists profils (
  espace       text primary key,
  devise_base  text not null default 'CAD',
  hypotheses   jsonb not null default '{}'::jsonb,
  maj          timestamptz not null default now()
);

create table if not exists beneficiaires (
  id                uuid primary key default gen_random_uuid(),
  espace            text not null references profils (espace) on delete cascade,
  nom               text not null,
  pays              text not null,
  devise            text not null,
  montant           numeric(14, 2) not null check (montant >= 0),
  frequence         text not null,
  type              text not null check (type in ('employe', 'contractant')),
  prochain_paiement date not null,
  cree_le           timestamptz not null default now()
);

create index if not exists beneficiaires_espace_idx on beneficiaires (espace);

-- Historique des décisions.
--
-- Une ligne est écrite quand l'utilisateur retient une stratégie pour un
-- paiement. Elle fige le taux et sa date : c'est ce qui permet, des semaines
-- plus tard, d'expliquer pourquoi ce choix a été fait avec les informations
-- disponibles ce jour-là. Aucune ligne n'est jamais modifiée après coup.
create table if not exists decisions (
  id              uuid primary key default gen_random_uuid(),
  espace          text not null references profils (espace) on delete cascade,
  beneficiaire_id uuid references beneficiaires (id) on delete set null,
  beneficiaire_nom text not null,
  strategie       text not null,
  devise_base     text not null,
  devise_cible    text not null,
  montant_cible   numeric(14, 2) not null,
  taux            numeric(18, 8) not null,
  date_taux       date not null,
  cout_estime     numeric(14, 2) not null,
  cree_le         timestamptz not null default now()
);

create index if not exists decisions_espace_idx on decisions (espace, cree_le desc);

-- Paiements déjà exécutés, saisis à la main depuis un relevé bancaire.
--
-- C'est la table qui fait passer l'outil de l'estimation à la mesure : une
-- fois trois lignes présentes sur un corridor, le comparateur cesse d'utiliser
-- ses ordres de grandeur publics et se calibre sur ces chiffres-là.
--
-- montant_recu et date_reference sont nullables et le restent : le premier
-- débloque le coût tout compris, le second le coût de l'attente. Les rendre
-- obligatoires empêcherait de saisir un paiement dont on n'a pas tout retrouvé,
-- et une ligne partielle vaut mieux qu'une ligne absente.
create table if not exists paiements_passes (
  id               uuid primary key default gen_random_uuid(),
  espace           text not null references profils (espace) on delete cascade,
  beneficiaire_id  uuid references beneficiaires (id) on delete set null,
  beneficiaire_nom text not null,
  date             date not null,
  devise_base      text not null,
  montant_envoye   numeric(14, 2) not null check (montant_envoye > 0),
  devise           text not null,
  montant_voulu    numeric(14, 2) not null check (montant_voulu > 0),
  montant_recu     numeric(14, 2) check (montant_recu >= 0),
  frais_affiches   numeric(14, 2) check (frais_affiches >= 0),
  canal            text not null,
  date_reference   date,
  note             text not null default '',
  cree_le          timestamptz not null default now()
);

create index if not exists paiements_passes_espace_idx
  on paiements_passes (espace, date desc);

-- RLS activée avec un accès par espace.
--
-- Postgres ne connaît pas « create policy if not exists » : les politiques sont
-- donc supprimées puis recréées, ce qui garde le script rejouable tel quel.
--
-- La clé anon est publique par nature : sans politique, n'importe qui pourrait
-- lire toutes les lignes. L'identifiant d'espace n'étant pas un secret
-- cryptographique, ce modèle protège contre l'énumération, pas contre un
-- attaquant qui connaîtrait déjà un identifiant. C'est un compromis assumé
-- pour un outil sans compte utilisateur ; passer à Supabase Auth est le
-- chemin de sortie si l'outil devait porter des données sensibles.
alter table profils             enable row level security;
alter table beneficiaires       enable row level security;
alter table decisions           enable row level security;
alter table paiements_passes    enable row level security;

drop policy if exists profils_espace on profils;
create policy profils_espace on profils
  for all using (espace = current_setting('request.headers', true)::json ->> 'x-espace')
  with check (espace = current_setting('request.headers', true)::json ->> 'x-espace');

drop policy if exists beneficiaires_espace on beneficiaires;
create policy beneficiaires_espace on beneficiaires
  for all using (espace = current_setting('request.headers', true)::json ->> 'x-espace')
  with check (espace = current_setting('request.headers', true)::json ->> 'x-espace');

drop policy if exists decisions_espace on decisions;
create policy decisions_espace on decisions
  for all using (espace = current_setting('request.headers', true)::json ->> 'x-espace')
  with check (espace = current_setting('request.headers', true)::json ->> 'x-espace');

drop policy if exists paiements_passes_espace on paiements_passes;
create policy paiements_passes_espace on paiements_passes
  for all using (espace = current_setting('request.headers', true)::json ->> 'x-espace')
  with check (espace = current_setting('request.headers', true)::json ->> 'x-espace');
