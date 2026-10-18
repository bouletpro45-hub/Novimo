-- =========================================================
-- AJOUT DU 18/10/2026 : devis en dollars (site anglais)
-- À coller une fois dans Supabase > SQL Editor > Run.
-- La colonne "devise" dit si un devis est en euros (site français)
-- ou en dollars (site anglais). Les anciens devis restent en euros.
-- =========================================================

alter table public.devis
  add column if not exists devise text not null default 'EUR'
  check (devise in ('EUR', 'USD'));
