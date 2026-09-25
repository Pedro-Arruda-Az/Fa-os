-- ─────────────────────────────────────────────────────────────
-- Foto de perfil da empresa (tabela "usuarios")
--
-- A tabela "profissionais" já tinha a coluna "foto_perfil" (criada
-- desde o início, mas nunca usada até agora). Esse script só adiciona
-- a mesma coluna na tabela "usuarios", pra empresa também poder
-- salvar uma foto de perfil.
--
-- A foto é gravada como base64 (redimensionada e comprimida no
-- navegador antes de enviar — ver Shared/foto-perfil.js), então não
-- precisa de nenhum bucket de storage nem de configuração extra no
-- Supabase.
--
-- Idempotente — seguro rodar de novo a qualquer momento.
-- ─────────────────────────────────────────────────────────────

alter table usuarios add column if not exists foto_perfil text;
