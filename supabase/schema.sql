-- =========================================================
-- SCHEMA.SQL — la base de données de Novimo (Supabase)
-- ---------------------------------------------------------
-- À coller UNE fois dans Supabase > SQL Editor > New query > Run.
-- Crée : les profils (comptes), les devis, et les règles de
-- sécurité (chaque client ne voit que SES devis ; seul l'admin
-- voit tout et peut changer les statuts).
--
-- ⚠️ Si ton adresse admin change, remplace-la ci-dessous
--    (fonction est_admin) ET dans site/config.js.
-- =========================================================


-- ---------- 1. Les profils : une ligne par compte créé ----------
create table if not exists public.profils (
  id       uuid primary key references auth.users (id) on delete cascade,
  email    text,
  nom      text,
  cree_le  timestamptz not null default now()
);


-- ---------- 2. Les devis ----------
create table if not exists public.devis (
  id               uuid primary key default gen_random_uuid(),
  numero           text not null unique,                 -- ex. NOV-20261016-K7Q2
  user_id          uuid references auth.users (id) on delete set null,
  email            text not null,
  commerce         text not null,
  type_commerce    text,
  prenom           text,
  telephone        text,
  message          text,
  lignes           jsonb not null default '[]',          -- [{ texte, montant }]
  prestations      jsonb not null default '[]',          -- [{ id, nom, quantite }] pour les statistiques
  options          jsonb not null default '[]',
  total            numeric(10, 2) not null check (total >= 0),
  acompte          numeric(10, 2) not null check (acompte >= 0),
  premier_devis    boolean not null default false,       -- premier devis de cette adresse e-mail ?
  statut           text not null default 'en_cours'
                   check (statut in ('en_cours', 'signe', 'cloture', 'annule')),
  cree_le          timestamptz not null default now(),
  acompte_recu_le  timestamptz,                          -- date de l'acompte (compte dans les gains)
  solde_recu_le    timestamptz                           -- date du solde (compte dans les gains)
);
create index if not exists devis_email_idx on public.devis (lower(email));
create index if not exists devis_user_idx  on public.devis (user_id);


-- ---------- 3. Qui est l'admin ? ----------
create or replace function public.est_admin()
returns boolean
language sql stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'bouletpro45@gmail.com';
$$;


-- ---------- 4. À chaque inscription : créer le profil et rattacher les anciens devis ----------
create or replace function public.apres_inscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profils (id, email, nom)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;

  -- les devis faits avant de créer le compte (même e-mail) apparaissent dans son espace
  update public.devis set user_id = new.id
  where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists quand_inscription on auth.users;
create trigger quand_inscription
  after insert on auth.users
  for each row execute function public.apres_inscription();


-- ---------- 5. Les règles de sécurité (Row Level Security) ----------
alter table public.profils enable row level security;
alter table public.devis   enable row level security;

-- Profils : chacun voit le sien, l'admin voit tout (pour compter les comptes)
drop policy if exists "profil : lecture" on public.profils;
create policy "profil : lecture" on public.profils
  for select using (id = auth.uid() or public.est_admin());

drop policy if exists "profil : modification" on public.profils;
create policy "profil : modification" on public.profils
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Devis : un client voit ses devis, l'admin voit tout
drop policy if exists "devis : lecture" on public.devis;
create policy "devis : lecture" on public.devis
  for select using (user_id = auth.uid() or public.est_admin());

-- Devis : seul l'admin change les statuts
drop policy if exists "devis : modification admin" on public.devis;
create policy "devis : modification admin" on public.devis
  for update using (public.est_admin()) with check (public.est_admin());

-- Il n'y a volontairement AUCUNE règle "insert" ni "delete" :
-- les devis ne sont créés que par la fonction serveur "envoyer-devis"
-- (qui utilise la clé secrète), et personne ne peut en supprimer depuis le site.


-- ---------- 6. Droits d'accès pour l'API ----------
-- (les projets récents n'ouvrent plus les tables automatiquement ;
--  les règles RLS ci-dessus filtrent ensuite ligne par ligne)
grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.profils to authenticated;
grant select, update on public.devis   to authenticated;
grant all on public.profils, public.devis to service_role;
-- ---------- 7. Les visites (mesure d'audience, avec consentement) ----------
create table if not exists public.visites (
  id        bigint generated always as identity primary key,
  cree_le   timestamptz not null default now(),
  page      text not null check (char_length(page) between 1 and 80),
  source    text check (char_length(source) <= 60),
  appareil  text check (appareil in ('mobile', 'tablette', 'ordinateur')),
  visiteur  text check (char_length(visiteur) <= 16)
);
create index if not exists visites_cree_le on public.visites (cree_le);
alter table public.visites enable row level security;

-- N'importe quel visiteur peut AJOUTER une visite, seul l'admin peut les LIRE
drop policy if exists "visites : ajout" on public.visites;
create policy "visites : ajout" on public.visites
  for insert to anon, authenticated with check (true);
drop policy if exists "visites : lecture admin" on public.visites;
create policy "visites : lecture admin" on public.visites
  for select to authenticated using (public.est_admin());

grant insert on public.visites to anon, authenticated;
grant select on public.visites to authenticated;
grant all on public.visites to service_role;

-- ---------- 8. Anti-spam : empreinte de l'IP sur les devis ----------
alter table public.devis add column if not exists ip_hash text;
create index if not exists devis_ip_hash on public.devis (ip_hash, cree_le);

-- ---------- 9. Les conversations ----------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  email           text not null,
  nom             text,
  categorie       text not null check (categorie in ('projet', 'modele', 'suivi', 'retouches', 'paiement', 'partenariat', 'autre')),
  sujet_chiffre   text not null,
  statut          text not null default 'demande' check (statut in ('demande', 'acceptee', 'refusee', 'fermee')),
  non_lu_admin    boolean not null default true,
  non_lu_client   boolean not null default false,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now()
);
create index if not exists conversations_user on public.conversations (user_id, maj_le desc);
create index if not exists conversations_statut on public.conversations (statut, maj_le desc);

-- ---------- 10. Les messages ----------
create table if not exists public.messages (
  id               bigint generated always as identity primary key,
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  auteur           text not null check (auteur in ('client', 'admin')),
  contenu_chiffre  text not null,
  cree_le          timestamptz not null default now()
);
create index if not exists messages_conversation on public.messages (conversation_id, cree_le);

-- Verrouillage : RLS activé et AUCUNE règle pour anon / authenticated
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
revoke all on public.conversations, public.messages from anon, authenticated;
grant all on public.conversations, public.messages to service_role;
