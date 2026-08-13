-- ============================================================
-- FAÇOS - Setup de carteira/pagamentos (Mercado Pago)
-- Rode este script uma vez no SQL Editor do Supabase
-- ============================================================

-- 1) Saldo do usuário (carteira)
alter table usuarios
    add column if not exists saldo numeric(10,2) not null default 0;

-- 2) Histórico de pagamentos de crédito via Mercado Pago
create table if not exists pagamentos (
    id uuid primary key default gen_random_uuid(),
    usuario_email text not null,
    valor numeric(10,2) not null,
    forma_pagamento text,
    status text not null default 'pendente',           -- pendente | aprovado | rejeitado
    mp_payment_id text,
    mp_preference_id text,
    external_reference text unique not null,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz
);

create index if not exists idx_pagamentos_external_reference
    on pagamentos (external_reference);

create index if not exists idx_pagamentos_usuario_email
    on pagamentos (usuario_email);

-- 3) RLS (Row Level Security) — a tabela pagamentos só é escrita
--    pelas Netlify Functions (que usam a service role / anon key
--    já usada no restante do projeto). Se RLS estiver ativado no
--    seu projeto Supabase, habilite acesso público de leitura/escrita
--    igual ao que já é usado na tabela "usuarios", ou desative RLS
--    nesta tabela para manter a mesma política do resto do app:
--
-- alter table pagamentos disable row level security;
