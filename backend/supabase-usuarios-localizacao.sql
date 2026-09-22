-- ============================================================
-- FAÇOS - localização (latitude/longitude) da empresa/usuário
--
-- Adiciona as colunas de latitude/longitude na tabela "usuarios"
-- (empresas que contratam o serviço), do mesmo jeito que já existe
-- na tabela "profissionais". Com isso, quando a empresa tiver uma
-- localização real salva, a tela de "Localização do profissional"
-- pode mostrar o pino dela no mapa em vez do ponto inventado perto
-- do profissional.
--
-- É seguro rodar de novo: só adiciona o que ainda não existe.
--
-- Como rodar: Supabase → seu projeto → SQL Editor → cole este
-- arquivo inteiro → Run. (Se você já rodou o supabase-banco-completo.sql
-- mais recente, essas colunas já existem e este arquivo não faz nada.)
-- ============================================================

alter table usuarios add column if not exists latitude decimal(10,8);
alter table usuarios add column if not exists longitude decimal(11,8);
