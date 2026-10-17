-- =========================================================
-- AJOUT DU 17/10/2026 : mesure d'audience + anti-spam
-- À coller une fois dans Supabase > SQL Editor > Run.
-- (Déjà inclus à la fin de schema.sql pour une nouvelle installation.)
-- =========================================================

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
