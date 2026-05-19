-- ═══════════════════════════════════════════════════════════════════════════
-- SabrinaAI — Schéma Supabase
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase de ton projet
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Table : agents ────────────────────────────────────────────────────────
-- Un agent = une entreprise cliente avec son IA téléphonique configurée
create table if not exists public.agents (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,

  name          text not null,
  sector        text not null,
  description   text not null default '',
  services      text not null default '',
  hours         text not null default '',
  address       text not null default '',
  phone         text not null default '',
  country_code  text not null default 'FR',   -- FR, CD, BE, CI, SN, etc.
  language      text not null default 'fr-FR',
  voice_name    text,                          -- voix préférée (browser TTS)

  -- Personnalisation
  agent_name    text not null default 'Sabrina',
  greeting      text,                          -- phrase d'accueil custom
  tone          text not null default 'chaleureux', -- chaleureux | formel | direct

  -- Intégrations
  calendly_url     text,                       -- lien Calendly à partager pour prise de RDV
  escalation_phone text,                       -- numéro pour transfert vers humain

  -- État
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists agents_owner_idx on public.agents(owner_id);

-- ─── Table : faqs ──────────────────────────────────────────────────────────
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.agents(id) on delete cascade,
  question    text not null,
  answer      text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists faqs_agent_idx on public.faqs(agent_id);

-- ─── Table : calls (historique d'appels simulés ou réels) ──────────────────
create table if not exists public.calls (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references public.agents(id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  source        text not null default 'simulator',   -- simulator | twilio | africastalking | whatsapp
  transcript    jsonb not null default '[]'::jsonb,  -- [{role, content, ts}]
  duration_sec  int,
  satisfaction  int,                                  -- 1..5 optionnel
  caller_id     text,                                 -- numéro appelant si réel
  created_at    timestamptz not null default now()
);

create index if not exists calls_agent_idx   on public.calls(agent_id);
create index if not exists calls_owner_idx   on public.calls(owner_id);
create index if not exists calls_created_idx on public.calls(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — chaque utilisateur ne voit que SES données
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.agents enable row level security;
alter table public.faqs   enable row level security;
alter table public.calls  enable row level security;

-- agents : owner only
drop policy if exists agents_select on public.agents;
drop policy if exists agents_insert on public.agents;
drop policy if exists agents_update on public.agents;
drop policy if exists agents_delete on public.agents;

create policy agents_select on public.agents for select using (auth.uid() = owner_id);
create policy agents_insert on public.agents for insert with check (auth.uid() = owner_id);
create policy agents_update on public.agents for update using (auth.uid() = owner_id);
create policy agents_delete on public.agents for delete using (auth.uid() = owner_id);

-- faqs : accessible si on possède l'agent parent
drop policy if exists faqs_select on public.faqs;
drop policy if exists faqs_insert on public.faqs;
drop policy if exists faqs_update on public.faqs;
drop policy if exists faqs_delete on public.faqs;

create policy faqs_select on public.faqs for select using (
  exists (select 1 from public.agents a where a.id = agent_id and a.owner_id = auth.uid())
);
create policy faqs_insert on public.faqs for insert with check (
  exists (select 1 from public.agents a where a.id = agent_id and a.owner_id = auth.uid())
);
create policy faqs_update on public.faqs for update using (
  exists (select 1 from public.agents a where a.id = agent_id and a.owner_id = auth.uid())
);
create policy faqs_delete on public.faqs for delete using (
  exists (select 1 from public.agents a where a.id = agent_id and a.owner_id = auth.uid())
);

-- calls : owner only
drop policy if exists calls_select on public.calls;
drop policy if exists calls_insert on public.calls;
drop policy if exists calls_delete on public.calls;

create policy calls_select on public.calls for select using (auth.uid() = owner_id);
create policy calls_insert on public.calls for insert with check (auth.uid() = owner_id);
create policy calls_delete on public.calls for delete using (auth.uid() = owner_id);

-- ─── Trigger : updated_at automatique sur agents ──────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_agents_updated on public.agents;
create trigger trg_agents_updated before update on public.agents
  for each row execute function public.touch_updated_at();
