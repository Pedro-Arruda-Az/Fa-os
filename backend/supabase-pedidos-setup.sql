-- ============================================================
-- FAÇOS - Histórico de pedidos real (substitui os dados fixos)
-- Rode este script uma vez no SQL Editor do Supabase.
-- ============================================================

create table if not exists pedidos (
    id uuid primary key default gen_random_uuid(),
    usuario_email text not null,
    titulo text not null,
    profissional text not null,
    valor numeric(10,2) not null,
    status text not null default 'em_andamento',   -- em_andamento | concluido | cancelado
    avaliacao numeric(2,1),
    forma_pagamento text,                          -- carteira | mercadopago
    criado_em timestamptz not null default now()
);

create index if not exists idx_pedidos_usuario_email
    on pedidos (usuario_email);

create index if not exists idx_pedidos_status
    on pedidos (status);
