-- ─────────────────────────────────────────────────────────────
-- Avaliação do profissional (tela "Meus pedidos" da empresa)
--
-- A tabela "pedidos" já tinha a coluna "avaliacao" (nota de 1 a 5).
-- Este script adiciona os dois campos extras usados pela telinha de
-- avaliação estilo Uber: os motivos rápidos selecionados (chips) e o
-- campo de texto livre "Outros motivos".
--
-- Idempotente — seguro rodar de novo a qualquer momento, mesmo que
-- essas colunas já existam.
-- ─────────────────────────────────────────────────────────────

alter table pedidos add column if not exists avaliacao_motivos text;
alter table pedidos add column if not exists avaliacao_comentario text;
