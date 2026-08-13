-- ============================================================
-- FAÇOS - Corrige bloqueio de gravação (RLS) nas tabelas novas
-- Rode este script no SQL Editor do Supabase.
-- ============================================================

-- As tabelas "pagamentos" e "pedidos" são criadas pelo Supabase
-- com Row Level Security (RLS) ativado por padrão e nenhuma
-- política liberada — isso bloqueia silenciosamente qualquer
-- gravação feita pelo navegador (a chave usada no site inteiro).
-- Desativamos aqui pra manter a mesma política do resto do app
-- (tabela "usuarios" já funciona assim).

alter table pagamentos disable row level security;
alter table pedidos disable row level security;
