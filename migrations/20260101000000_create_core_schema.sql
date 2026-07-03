-- ===========================
-- MEUS-ARQUIVOS
-- Banco: Postgres / Supabase
-- ===========================

-- 1. Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand_name text not null default 'MEUS-ARQUIVOS',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Usuários do app (por workspace)
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'agent',
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint app_users_workspace_email unique (workspace_id, email)
);

-- 3. Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text not null,
  phone text not null,
  address text not null default '',
  website text not null default '',
  search_term text not null default '',
  city text not null default '',
  niche text not null default '',
  stage text not null default 'Entrada',
  deal_value numeric not null default 0,
  owner text not null default 'MEUS-ARQUIVOS',
  tags text[] not null default '{}',
  notes text not null default '',
  priority text not null default 'Media',
  source text not null default 'n8n Scraper',
  status text not null default 'Novo',
  sent_status text not null default 'Pendente',
  last_seen text not null default 'Agora',
  whatsapp_opt_in boolean not null default true,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workspace_phone_idx on public.leads (workspace_id, phone);
create index if not exists leads_workspace_company_idx on public.leads (workspace_id, lower(company));

-- 4. Conversas
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null default 'whatsapp',
  status text not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_workspace_lead_idx on public.conversations (workspace_id, lead_id);

-- 5. Mensagens
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null,
  text text not null,
  meta jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, sent_at);

-- 6. Estágios do funil
create table if not exists public.deal_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists deal_stages_workspace_key_idx on public.deal_stages (workspace_id, key);

-- 7. Regras de automação
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed básico para workspace default
insert into public.workspaces (slug, name)
values ('default', 'Default')
on conflict (slug) do nothing;
