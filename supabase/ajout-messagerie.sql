-- =========================================================
-- MESSAGERIE (ajout du 17/10/2026)
-- À coller une fois dans Supabase > SQL Editor > Run.
-- (Déjà inclus à la fin de schema.sql pour une nouvelle installation.)
--
-- Le contenu des messages est CHIFFRÉ (AES-256-GCM) par la fonction
-- serveur "messagerie" avant d'arriver ici : la base ne contient que
-- du texte illisible. Aucune règle d'accès n'est donnée au site :
-- SEULE la fonction serveur (clé secrète) peut lire et écrire.
-- =========================================================

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
