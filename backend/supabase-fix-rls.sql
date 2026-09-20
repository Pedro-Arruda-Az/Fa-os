-- ============================================================
-- FAÇOS - Row Level Security em "pedidos" e "pagamentos"
-- Rode este script no SQL Editor do Supabase.
-- ============================================================
--
-- Antes, este script DESATIVAVA o RLS nessas duas tabelas pra
-- destravar a gravação feita pelo navegador. Isso foi revertido:
-- agora todo INSERT/UPDATE/DELETE em pedidos e pagamentos passa
-- pelas Netlify Functions (contratar-servico, confirmar-contratacao,
-- criar-pagamento, verificar-pagamento), que usam a
-- SUPABASE_SERVICE_ROLE_KEY — essa chave ignora RLS, então o
-- backend continua funcionando normalmente mesmo com RLS ativo.
--
-- A chave anônima (usada em todo o site) só pode LER essas tabelas
-- (necessário pras telas "Meus pedidos" / "Carteira"). Ela não tem
-- mais permissão nenhuma de escrita — qualquer tentativa de inserir/
-- editar/apagar direto do navegador (ex.: console do DevTools) passa
-- a ser bloqueada pelo Postgres.
--
-- Observação importante: como o login deste projeto não usa o
-- Supabase Auth (é um login próprio, com hash verificado no
-- navegador), não existe "auth.uid()" pra restringir a leitura só
-- às linhas do próprio usuário. Por isso a policy de leitura abaixo
-- é aberta pra qualquer um com a chave anônima — o mesmo nível de
-- acesso que as demais tabelas do projeto (usuarios, profissionais,
-- conversas etc.) já têm hoje. Pra restringir a leitura por usuário
-- de verdade no futuro, o login precisaria migrar pro Supabase Auth.

alter table pedidos enable row level security;
alter table pagamentos enable row level security;

drop policy if exists "pedidos leitura publica" on pedidos;
create policy "pedidos leitura publica"
    on pedidos for select
    using (true);

drop policy if exists "pagamentos leitura publica" on pagamentos;
create policy "pagamentos leitura publica"
    on pagamentos for select
    using (true);

-- Nenhuma policy de insert/update/delete é criada de propósito:
-- sem uma policy que libere a operação, o Postgres bloqueia por
-- padrão pra quem usa a chave anônima. Só a service role key
-- (usada exclusivamente pelo backend) segue passando direto.
