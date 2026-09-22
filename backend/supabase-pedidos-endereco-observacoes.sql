-- ============================================================
-- FAÇOS - Endereço e observações reais no pedido
--
-- Antes, o endereço e as informações adicionais que a empresa
-- preenche em "Solicitar agora" ficavam só no navegador dela
-- (localStorage) — o backend recebia esses dados mas não gravava.
-- Este script adiciona as colunas que faltam para que fiquem
-- salvos de verdade no banco, ligados ao profissional certo, e
-- continuem lá mesmo se o profissional sair e voltar depois (ou
-- entrar de outro aparelho).
--
-- Rode este script uma vez no SQL Editor do seu projeto Supabase,
-- depois dos scripts já listados no README (pode rodar a qualquer
-- momento depois de supabase-pedidos-setup.sql).
-- ============================================================

-- 1) Tabela "pedidos" — onde o pedido definitivo é gravado.
alter table pedidos add column if not exists endereco text;
alter table pedidos add column if not exists observacoes text;

-- profissional_email: hoje a tabela só guarda o nome da empresa
-- profissional ("profissional"), sem um jeito confiável de cada
-- profissional buscar só os pedidos dele. Com o email, dá pra
-- filtrar direito.
alter table pedidos add column if not exists profissional_email text;

-- usuario_nome: evita ter que buscar o nome do cliente em outra
-- tabela toda vez que o profissional abre a tela de pedidos.
alter table pedidos add column if not exists usuario_nome text;

create index if not exists idx_pedidos_profissional_email
    on pedidos (profissional_email);

-- 2) Tabela "pagamentos" — quando o pagamento é via Mercado Pago, o
-- pedido só é criado de verdade depois que o pagamento volta
-- aprovado (netlify/functions/confirmar-contratacao.mjs). Até lá,
-- o endereço e as observações esperam guardados aqui.
alter table pagamentos add column if not exists endereco text;
alter table pagamentos add column if not exists observacoes text;
