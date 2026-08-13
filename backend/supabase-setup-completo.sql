-- ============================================================
-- FAÇOS - Script completo e atualizado (carteira + pedidos)
-- Pode rodar tudo de uma vez, mesmo que parte disso já exista
-- no seu banco — todos os comandos são seguros de repetir.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) SALDO DO USUÁRIO (carteira)
-- ─────────────────────────────────────────────────────────────
alter table usuarios
    add column if not exists saldo numeric(10,2) not null default 0;


-- ─────────────────────────────────────────────────────────────
-- 2) TABELA "pagamentos"
--    Créditos adicionados via Mercado Pago + gastos pagos com
--    saldo da carteira ou Mercado Pago.
-- ─────────────────────────────────────────────────────────────
create table if not exists pagamentos (
    id uuid primary key default gen_random_uuid(),
    usuario_email text not null,
    valor numeric(10,2) not null,
    forma_pagamento text,
    status text not null default 'pendente',           -- pendente | aprovado | rejeitado
    mp_payment_id text,
    mp_preference_id text,
    external_reference text,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz,
    tipo text not null default 'credito',               -- credito | gasto
    descricao text
);

-- Garante essas colunas mesmo se a tabela já existia de antes
alter table pagamentos add column if not exists tipo text not null default 'credito';
alter table pagamentos add column if not exists descricao text;
alter table pagamentos alter column external_reference drop not null;

create index if not exists idx_pagamentos_external_reference
    on pagamentos (external_reference);

create index if not exists idx_pagamentos_usuario_email
    on pagamentos (usuario_email);

create index if not exists idx_pagamentos_tipo
    on pagamentos (tipo);


-- ─────────────────────────────────────────────────────────────
-- 3) TABELA "pedidos"
--    Histórico de pedidos (tela "Histórico de Pedidos").
-- ─────────────────────────────────────────────────────────────
create table if not exists pedidos (
    id uuid primary key default gen_random_uuid(),
    usuario_email text not null,
    titulo text not null,
    profissional text not null,
    valor numeric(10,2) not null,
    status text not null default 'em_andamento',        -- em_andamento | concluido | cancelado
    avaliacao numeric(2,1),
    forma_pagamento text,                                -- carteira | mercadopago
    criado_em timestamptz not null default now()
);

create index if not exists idx_pedidos_usuario_email
    on pedidos (usuario_email);

create index if not exists idx_pedidos_status
    on pedidos (status);


-- ─────────────────────────────────────────────────────────────
-- 4) RLS (Row Level Security)
--    Desativado nessas duas tabelas pra manter a mesma política
--    de acesso já usada em "usuarios" no resto do site.
-- ─────────────────────────────────────────────────────────────
alter table pagamentos disable row level security;
alter table pedidos disable row level security;
