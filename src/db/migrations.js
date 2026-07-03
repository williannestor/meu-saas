const { randomUUID } = require("node:crypto");

async function rowExists(client, table, where) {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const clause = keys.map((k) => `${k} = $${keys.indexOf(k) + 1}`).join(" and ");

  const { rows } = await client.sql(`select id from public.${table} where ${clause} limit 1`, values);
  return Boolean(rows.length);
}

async function insertRow(client, table, payload) {
  const keys = Object.keys(payload);
  const values = Object.values(payload);
  const cols = keys.join(", ");
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
  const { rows } = await client.sql(`insert into public.${table} (${cols}) values (${placeholders}) returning *`, values);
  return rows[0];
}

async function migrate(client) {
  await client.sql(`
    create table if not exists public.workspaces (
      id uuid primary key default gen_random_uuid(),
      slug text not null unique,
      name text not null,
      brand_name text not null default 'MEUS-ARQUIVOS',
      settings jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await client.sql(`
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
  `);

  await client.sql(`
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
  `);

  await client.sql(`create index if not exists leads_workspace_phone_idx on public.leads (workspace_id, phone);`);
  await client.sql(`create index if not exists leads_workspace_company_idx on public.leads (workspace_id, lower(company));`);

  await client.sql(`
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
  `);

  await client.sql(`create index if not exists conversations_workspace_lead_idx on public.conversations (workspace_id, lead_id);`);

  await client.sql(`
    create table if not exists public.messages (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      conversation_id uuid not null references public.conversations(id) on delete cascade,
      direction text not null,
      text text not null,
      meta jsonb not null default '{}'::jsonb,
      sent_at timestamptz not null default now()
    );
  `);

  await client.sql(`create index if not exists messages_conversation_idx on public.messages (conversation_id, sent_at);`);

  await client.sql(`
    create table if not exists public.deal_stages (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      key text not null,
      label text not null,
      position int not null default 0,
      created_at timestamptz not null default now()
    );
  `);

  await client.sql(`create unique index if not exists deal_stages_workspace_key_idx on public.deal_stages (workspace_id, key);`);

  await client.sql(`
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
  `);
}

async function seed(client) {
  const exists = await rowExists(client, "workspaces", { slug: "default" });
  if (!exists) {
    await insertRow(client, "workspaces", {
      id: randomUUID(),
      slug: "default",
      name: "Default",
      brand_name: "MEUS-ARQUIVOS",
      settings: {}
    });
  }
}

module.exports = { migrate, seed };
