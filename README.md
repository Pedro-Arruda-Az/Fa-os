# Faços

Marketplace de serviços domésticos que conecta clientes (empresas/pessoas que
precisam de um serviço) a profissionais autônomos (limpeza, elétrica,
manutenção, jardinagem, tecnologia, casa e instalações). Site estático
(HTML/CSS/JS puro) com [Supabase](https://supabase.com) como backend de
dados e [Netlify Functions](https://docs.netlify.com/functions/overview/)
para tudo que precisa de uma chave privada (pagamentos e email).

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Banco de dados (Supabase)](#banco-de-dados-supabase)
- [Executando localmente](#executando-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança](#segurança)
- [Testes](#testes)
- [Deploy](#deploy)

## Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou superior (as Netlify Functions rodam em runtime Node)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) — `npm install -g netlify-cli`
- Uma conta [Supabase](https://supabase.com) (banco de dados)
- Uma conta [Mercado Pago](https://www.mercadopago.com.br/developers) com credenciais de produção ou teste
- Uma conta [Brevo](https://www.brevo.com) (envio de email transacional)

Não há `package.json`/dependências de frontend — todo o site é HTML/CSS/JS
servido como arquivo estático. As únicas dependências de runtime ficam nas
Netlify Functions, que usam só `fetch` nativo (sem pacotes externos).

## Instalação

```bash
git clone <url-do-repositorio>
cd Facos
netlify login          # se ainda não tiver feito
```

## Configuração de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

| Variável | Onde é usada | Onde conseguir |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `netlify/functions/*.mjs` | Supabase → Project Settings → API → `service_role` |
| `MP_ACCESS_TOKEN` | `netlify/functions/criar-pagamento.mjs`, `contratar-servico.mjs`, `verificar-pagamento.mjs`, `confirmar-contratacao.mjs` | Mercado Pago → Suas integrações → Credenciais |
| `BREVO_API_KEY` | `netlify/functions/enviar-email.mjs` | Brevo → SMTP & API → API Keys |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` / `BREVO_REPLY_EMAIL` | idem | seu remetente verificado na Brevo |
| `ANTHROPIC_API_KEY` | `netlify/functions/assistente-suporte.mjs` | [console.anthropic.com](https://console.anthropic.com/) → Settings → API Keys. Usada pelo chat de suporte com IA (o Buzz, no botão "Ajuda/Suporte"). Sem essa chave configurada, o Buzz continua abrindo normalmente, mas avisa que ainda não foi configurado em vez de responder. |

**Nunca** commite o `.env` real (ele já está no `.gitignore`). Em produção,
essas variáveis ficam configuradas no painel da Netlify
(Site settings → Environment variables), não em um arquivo no repositório.

A chave pública do Supabase (`anon key`) usada pelo navegador já vem
embutida nos arquivos `.js` do frontend — ela é feita pra ser pública, mas
só tem os privilégios que o Row Level Security (RLS) de cada tabela
permitir (veja [Segurança](#segurança)).

## Banco de dados (Supabase)

**Forma mais simples:** rode só o `backend/supabase-banco-completo.sql`
inteiro, de uma vez, no SQL Editor do seu projeto Supabase. Ele já junta
todos os scripts abaixo num só arquivo (schema base, cadastro, CNPJ/CPF,
pedidos, pagamentos/carteira, endereço e observações do pedido, e a
segurança/RLS) e é idempotente — seguro rodar de novo a qualquer momento,
mesmo que seu banco já tenha essas tabelas.

Se preferir rodar em partes (por exemplo, pra revisar cada mudança), os
scripts individuais em `backend/*.sql` fazem a mesma coisa, nesta ordem:

1. `supabase-schema-completo.sql` — schema base (usuários, profissionais, etc.)
2. `supabase-cadastro-empresa-profissional.sql`
3. `supabase-cnpj-cpf-migracao.sql`
4. `supabase-pedidos-setup.sql`
5. `supabase-pagamentos-setup.sql`
6. `supabase-pagamentos-gastos-setup.sql`
7. `supabase-pedidos-endereco-observacoes.sql` — adiciona `endereco`, `observacoes`, `profissional_email` e `usuario_nome` em `pedidos` (e o espaço temporário em `pagamentos`) para a tela de Pedidos do profissional.
8. `supabase-fix-rls.sql` — **ativa o Row Level Security** em `pedidos` e `pagamentos` com as policies corretas (leitura pública, escrita só pelo backend). Rode por último.

Se o seu banco já existia antes desta atualização (ou seja, você já rodou
o passo 1 numa versão anterior), rode também o
`supabase-usuarios-localizacao.sql` — ele só adiciona as colunas
`latitude`/`longitude` na tabela `usuarios`, usadas na tela de
localização. Quem rodar o `supabase-banco-completo.sql` ou o
`supabase-schema-completo.sql` já atualizados não precisa deste passo
extra.

`supabase-setup-completo.sql` é um script de conveniência mais antigo que
junta boa parte dos passos acima (sem as colunas mais novas) — prefira o
`supabase-banco-completo.sql`.

## Executando localmente

```bash
netlify dev
```

Isso sobe o site estático e as Netlify Functions juntos (lendo o `.env`
local) em `http://localhost:8888`. Abra `http://localhost:8888/index.html`.

Para rodar só como site estático, sem as functions de pagamento/email
funcionando (ex.: ajustar layout), também dá pra usar:

```bash
python3 -m http.server 8080
```

## Estrutura do projeto

```
Auth/                 Login e cadastro (clientes e profissionais)
Landing Page/          Perfil e telas do cliente
Servicos/              6 categorias de serviço (busca profissional + contratação)
Profissional/          Painel do profissional (dashboard, pedidos, carteira, chat...)
Pagamentos/            Adicionar crédito na carteira via Mercado Pago
Pedidos/                Histórico de pedidos do cliente
Chat/, Buzz/            Chat entre cliente/profissional e assistente
Localizacao/, Sino/, Notificacoes/, Shared/   Componentes auxiliares
netlify/functions/     Backend (Mercado Pago, email, contratação)
backend/                Scripts SQL do Supabase
imagens/                Assets estáticos
```

## Segurança

- **RLS ativo em `pedidos` e `pagamentos`**: a chave pública do navegador só
  consegue *ler* essas tabelas. Criar/alterar pedidos e pagamentos só é
  possível pelas Netlify Functions, usando a `SUPABASE_SERVICE_ROLE_KEY`
  (que fica só no servidor).
- **Nenhuma credencial privada no frontend**: o token do Mercado Pago e a
  service role key do Supabase só existem em `netlify/functions/*.mjs`,
  lidos via `process.env`.
- **Preço sempre conferido no servidor**: `contratar-servico.mjs` busca o
  preço do profissional direto no banco — o valor que o navegador manda é
  ignorado.
- **Endpoints de pagamento**: validam origem da chamada (mesma origem do
  site), aplicam um rate limit básico por IP e validam todos os parâmetros
  antes de falar com o Mercado Pago.

> Se este repositório (ou um `.zip` dele) já foi compartilhado com alguém
> fora do time, rotacione a `SUPABASE_SERVICE_ROLE_KEY` e o
> `MP_ACCESS_TOKEN` nos respectivos painéis antes de ir pra produção —
> qualquer pessoa com o valor antigo consegue usá-lo até lá.

## Testes

Não há suíte de testes automatizados ainda. Ao alterar algo, o checklist
manual mínimo é:

- Cadastro/login (empresa e profissional)
- Busca e contratação de um profissional (carteira **e** Mercado Pago) em
  pelo menos uma categoria de `Servicos/`
- Carteira: adicionar crédito e ver o saldo atualizar
- Painel do profissional: pedido recebido, chat, notificação

## Deploy

O projeto está pronto para a Netlify (`netlify.toml` já aponta
`publish = "."` e `netlify/functions` como pasta de functions):

```bash
netlify deploy --prod
```

Antes do primeiro deploy em produção, configure todas as variáveis de
[Configuração de ambiente](#configuração-de-ambiente) no painel da Netlify
e rode os scripts de [Banco de dados](#banco-de-dados-supabase) no seu
projeto Supabase de produção.
