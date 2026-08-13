-- ============================================================
-- FAÇOS - Atualização: registrar gastos (não só créditos)
-- Rode este script uma vez no SQL Editor do Supabase.
-- É seguro rodar mesmo se você já rodou o script anterior.
-- ============================================================

-- 1) Marca se o registro é um crédito adicionado (Mercado Pago)
--    ou um gasto (pagamento de serviço)
alter table pagamentos
    add column if not exists tipo text not null default 'credito';  -- 'credito' | 'gasto'

-- 2) Descrição livre do gasto (ex: "Limpeza residencial - LimpaMais Serviços")
alter table pagamentos
    add column if not exists descricao text;

-- 3) Pagamentos feitos com saldo da carteira não passam pelo Mercado
--    Pago, então não têm necessariamente um external_reference vindo
--    de lá. Deixamos a coluna opcional.
alter table pagamentos
    alter column external_reference drop not null;

create index if not exists idx_pagamentos_tipo
    on pagamentos (tipo);
