-- ============================================================
-- FAÇOS - Script mestre único do banco de dados
-- ============================================================
-- Esse é o ÚNICO arquivo que você precisa guardar e rodar
-- daqui pra frente. Toda vez que o banco precisar de uma
-- mudança nova, a gente EDITA esse mesmo arquivo (não cria
-- um novo) e você cola o conteúdo inteiro por cima do mesmo
-- snippet salvo no SQL Editor do Supabase.
--
-- É seguro rodar esse arquivo inteiro quantas vezes quiser,
-- mesmo que parte dele já tenha sido aplicada antes — nenhum
-- comando aqui apaga ou duplica dado nenhum.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1) TABELA "usuarios" (cadastro de EMPRESA — quem contrata)
-- ─────────────────────────────────────────────────────────────
create table if not exists usuarios (
    id bigserial primary key,
    nome varchar(255) not null,
    nome_user varchar(255),
    email varchar(255) not null unique,
    senha varchar(255) not null,
    telefone varchar(50),
    data_cadastro timestamptz not null default now()
);

alter table usuarios add column if not exists endereco text;
alter table usuarios add column if not exists cnpj text;
alter table usuarios add column if not exists cpf varchar(14);
alter table usuarios add column if not exists saldo numeric(10,2) not null default 0;
alter table usuarios alter column cpf drop not null;

create unique index if not exists usuarios_cnpj_key
    on usuarios (cnpj) where cnpj is not null;

create unique index if not exists usuarios_cpf_key
    on usuarios (cpf) where cpf is not null;


-- ─────────────────────────────────────────────────────────────
-- 2) TABELA "profissionais" (cadastro de PROFISSIONAL — quem presta serviço)
-- ─────────────────────────────────────────────────────────────
create table if not exists profissionais (
    id bigserial primary key,
    nome_empresa varchar(255) not null,
    email varchar(255) not null unique,
    senha varchar(255) not null,
    telefone varchar(50),
    descricao text,
    categoria varchar(100),
    avaliacao decimal(3,2) default 0,
    total_avaliacoes int default 0,
    status varchar(20) default 'ativo',
    data_cadastro timestamptz not null default now(),
    foto_perfil text,
    latitude decimal(10,8),
    longitude decimal(11,8),
    raio_atendimento int default 10
);

alter table profissionais add column if not exists endereco text;
alter table profissionais add column if not exists area_atuacao text;
alter table profissionais add column if not exists sobre text;
alter table profissionais add column if not exists cpf varchar(14);
alter table profissionais add column if not exists cnpj varchar(18);
alter table profissionais add column if not exists preco_servico numeric(10,2);
alter table profissionais alter column cnpj drop not null;

alter table profissionais add column if not exists saldo numeric(10,2) not null default 0;
alter table profissionais add column if not exists chave_pix text;
alter table profissionais add column if not exists banco text;

create unique index if not exists profissionais_cpf_key
    on profissionais (cpf) where cpf is not null;

create unique index if not exists profissionais_cnpj_key
    on profissionais (cnpj) where cnpj is not null;

-- Se quiser remover a coluna "cnpj" antiga da tabela profissionais
-- depois de confirmar que não precisa mais dela, rode à parte:
-- alter table profissionais drop column if exists cnpj;


-- ─────────────────────────────────────────────────────────────
-- 3) TABELA "pagamentos"
--    Créditos adicionados via Mercado Pago + gastos pagos com
--    saldo da carteira ou Mercado Pago. (Usada de verdade pelo site.)
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

alter table pagamentos add column if not exists tipo text not null default 'credito';
alter table pagamentos add column if not exists descricao text;
alter table pagamentos add column if not exists profissional_email text;
alter table pagamentos alter column external_reference drop not null;

create index if not exists idx_pagamentos_external_reference on pagamentos (external_reference);
create index if not exists idx_pagamentos_usuario_email on pagamentos (usuario_email);
create index if not exists idx_pagamentos_tipo on pagamentos (tipo);
create index if not exists idx_pagamentos_profissional_email on pagamentos (profissional_email);


-- ─────────────────────────────────────────────────────────────
-- 4) TABELA "pedidos"
--    Histórico de pedidos (tela "Histórico de Pedidos"). (Usada de verdade pelo site.)
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

create index if not exists idx_pedidos_usuario_email on pedidos (usuario_email);
create index if not exists idx_pedidos_status on pedidos (status);


-- ─────────────────────────────────────────────────────────────
-- 4.1) TABELAS "conversas" e "mensagens_chat"
--      Chat de verdade entre cliente (empresa) e profissional,
--      criado automaticamente quando um serviço é pago.
-- ─────────────────────────────────────────────────────────────
create table if not exists conversas (
    id uuid primary key default gen_random_uuid(),
    usuario_email text not null,
    usuario_nome text,
    profissional_email text not null,
    profissional_nome text,
    servico text,
    criado_em timestamptz not null default now(),
    ultima_mensagem text,
    ultima_mensagem_em timestamptz not null default now(),
    unique (usuario_email, profissional_email)
);

create table if not exists mensagens_chat (
    id uuid primary key default gen_random_uuid(),
    conversa_id uuid not null references conversas(id) on delete cascade,
    remetente text not null,          -- 'cliente' | 'profissional'
    texto text not null,
    criado_em timestamptz not null default now()
);

create index if not exists idx_conversas_usuario_email on conversas (usuario_email);
create index if not exists idx_conversas_profissional_email on conversas (profissional_email);
create index if not exists idx_mensagens_chat_conversa_id on mensagens_chat (conversa_id);

-- Ativa o "tempo real" do Supabase nessas duas tabelas — sem isso, o
-- chat só atualiza quando a página é recarregada.
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'mensagens_chat'
    ) then
        alter publication supabase_realtime add table mensagens_chat;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'conversas'
    ) then
        alter publication supabase_realtime add table conversas;
    end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 5) TABELAS DE PLANEJAMENTO ANTIGO
--    Ainda não são usadas pelo site (nenhuma tela lê ou escreve
--    nelas hoje), mas ficam criadas aqui pra não perder esse
--    desenho caso você queira usá-las no futuro.
-- ─────────────────────────────────────────────────────────────
create table if not exists service (
    id_servico bigserial unique,
    tipo_servico varchar(50) unique,
    nome varchar(255) not null,
    descricao varchar(255),
    valor_base varchar(255) not null,
    primary key (id_servico, tipo_servico)
);

create table if not exists contrato (
    id_contrato bigserial primary key,
    id_servico bigint,
    id_profissional bigint references profissionais(id),
    id_usuario bigint references usuarios(id),
    quantidade integer default 1,
    valor_unitario decimal(10,2),
    valor_total decimal(10,2),
    tipo_servico varchar(50),
    status varchar(30) default 'pendente',
    data_solicitacao timestamptz default now(),
    data_agendamento date,
    horario_agendamento time,
    endereco_servico varchar(255),
    observacoes text,
    foreign key (id_servico, tipo_servico) references service(id_servico, tipo_servico)
);

create table if not exists pagamento (
    id_pagamento bigserial primary key,
    id_contrato bigint references contrato(id_contrato),
    id_usuario bigint references usuarios(id),
    valor decimal(10,2),
    data_pagamento varchar(35),
    forma_pagamento varchar(35),
    status_pagamento varchar(20) default 'pendente'
);

create table if not exists profissional_servico (
    id bigserial primary key,
    id_profissional bigint not null references profissionais(id) on delete cascade,
    id_servico bigint not null references service(id_servico) on delete cascade,
    valor_personalizado decimal(10,2),
    disponivel boolean default true,
    unique (id_profissional, id_servico)
);

create table if not exists avaliacao (
    id_avaliacao bigserial primary key,
    id_contrato bigint references contrato(id_contrato),
    id_usuario bigint references usuarios(id),
    id_profissional bigint references profissionais(id),
    nota integer check (nota >= 1 and nota <= 5),
    comentario text,
    data_avaliacao timestamptz default now()
);

create table if not exists mensagem (
    id_mensagem bigserial primary key,
    id_contrato bigint references contrato(id_contrato),
    id_usuario bigint references usuarios(id),
    id_profissional bigint references profissionais(id),
    mensagem text not null,
    enviado_por varchar(20) not null,
    lida boolean default false,
    data_envio timestamptz default now()
);

create table if not exists notificacao (
    id_notificacao bigserial primary key,
    id_usuario bigint references usuarios(id),
    id_profissional bigint references profissionais(id),
    titulo varchar(100) not null,
    mensagem text not null,
    tipo varchar(30),
    lida boolean default false,
    data_criacao timestamptz default now()
);

create table if not exists agenda (
    id_agenda bigserial primary key,
    id_profissional bigint not null references profissionais(id) on delete cascade,
    dia_semana integer check (dia_semana >= 1 and dia_semana <= 7),
    hora_inicio time not null,
    hora_fim time not null,
    disponivel boolean default true
);

create index if not exists idx_contrato_profissional on contrato(id_profissional);
create index if not exists idx_contrato_usuario on contrato(id_usuario);
create index if not exists idx_contrato_status on contrato(status);
create index if not exists idx_pagamento_contrato on pagamento(id_contrato);
create index if not exists idx_mensagem_contrato on mensagem(id_contrato);
create index if not exists idx_notificacao_usuario on notificacao(id_usuario);
create index if not exists idx_notificacao_profissional on notificacao(id_profissional);
create index if not exists idx_profissional_servico_prof on profissional_servico(id_profissional);
create index if not exists idx_profissional_servico_serv on profissional_servico(id_servico);
create index if not exists idx_avaliacao_profissional on avaliacao(id_profissional);
create index if not exists idx_agenda_profissional on agenda(id_profissional);


-- ─────────────────────────────────────────────────────────────
-- 6) RLS (Row Level Security)
--    Desativado em todas as tabelas do projeto pra manter a
--    mesma política de acesso já usada em "usuarios" no resto
--    do site (a chave usada no navegador não tem permissão de
--    escrita se RLS estiver ativo sem uma política liberando).
-- ─────────────────────────────────────────────────────────────
alter table usuarios disable row level security;
alter table profissionais disable row level security;
alter table pagamentos disable row level security;
alter table pedidos disable row level security;
alter table conversas disable row level security;
alter table mensagens_chat disable row level security;
alter table service disable row level security;
alter table contrato disable row level security;
alter table pagamento disable row level security;
alter table profissional_servico disable row level security;
alter table avaliacao disable row level security;
alter table mensagem disable row level security;
alter table notificacao disable row level security;
alter table agenda disable row level security;
