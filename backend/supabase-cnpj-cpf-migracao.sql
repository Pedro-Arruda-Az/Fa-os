-- ============================================================
-- FAÇOS - Migração: Empresa passa a usar CNPJ, Profissional passa a usar CPF
-- Rode este script uma vez no SQL Editor do Supabase.
-- Todos os comandos são seguros de repetir.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABELA "usuarios" (cadastro de EMPRESA — quem contrata)
-- Ganha o campo "cnpj".
-- ─────────────────────────────────────────────────────────────
alter table usuarios
    add column if not exists cnpj text;

create unique index if not exists usuarios_cnpj_key
    on usuarios (cnpj)
    where cnpj is not null;

-- ─────────────────────────────────────────────────────────────
-- TABELA "profissionais" (cadastro de PROFISSIONAL — quem presta serviço)
-- Ganha o campo "cpf". O campo "cnpj" antigo pode ser removido
-- depois que você migrar os dados existentes (ou mantido, se
-- quiser guardar o CNPJ de quem já tinha cadastro).
-- ─────────────────────────────────────────────────────────────
alter table profissionais
    add column if not exists cpf text;

create unique index if not exists profissionais_cpf_key
    on profissionais (cpf)
    where cpf is not null;

-- Se quiser remover a coluna "cnpj" antiga da tabela profissionais
-- depois de confirmar que não precisa mais dela, rode:
-- alter table profissionais drop column if exists cnpj;
