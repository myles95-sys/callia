-- ─── Migration : ajout des intégrations Calendly + transfert humain ──────
-- À exécuter UNE FOIS si tu as déjà un projet Supabase existant.
-- Pour un nouveau projet, schema.sql contient déjà ces champs.

alter table public.agents
  add column if not exists calendly_url     text,
  add column if not exists escalation_phone text;
