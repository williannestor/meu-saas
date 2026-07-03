-- Antes desta migration, ENSURE SUPABASE MIGRATIONS ESTÁ ATIVO OU RODE ESTE SQL DIRETO.
-- Migration: add whatsapp_opt_in when bots/opt-in tracking was added.

alter table if exists public.leads
  add column if not exists whatsapp_opt_in boolean not null default true;
