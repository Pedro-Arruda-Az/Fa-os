-- ============================================================
-- FAÇOS - Ajustes para o novo cadastro (Empresa / Profissional)
-- Rode este script uma vez no SQL Editor do Supabase.
-- Todos os comandos são seguros de repetir.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABELA "usuarios" (cadastro de EMPRESA — quem contrata)
-- Agora não pede mais CPF, e ganhou o campo "endereco".
-- ─────────────────────────────────────────────────────────────
alter table usuarios
    add column if not exists endereco text;

alter table usuarios
    alter column cpf drop not null;

-- ─────────────────────────────────────────────────────────────
-- TABELA "profissionais" (cadastro de PROFISSIONAL — quem presta serviço)
-- Ganhou os campos "endereco" e "area_atuacao".
-- ─────────────────────────────────────────────────────────────
alter table profissionais
    add column if not exists endereco text;

alter table profissionais
    add column if not exists area_atuacao text;
