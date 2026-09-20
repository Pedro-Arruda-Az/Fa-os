// ============================================================
// FAÇOS - utilidades compartilhadas pelas Netlify Functions
// ============================================================

export const SUPABASE_URL = "https://fbgnvpcqwpvbwqtmqpzj.supabase.co";

// Chave pública (mesma usada no navegador). Serve só de último recurso,
// caso a service role key não esteja configurada no ambiente.
export const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc";

// A service role key só existe no ambiente do servidor (Netlify) e
// ignora RLS com segurança — é ela que deve estar configurada em
// produção para as tabelas sensíveis (pedidos, pagamentos).
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export function respostaJson(status, conteudo) {
    return new Response(JSON.stringify(conteudo), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

export function emailValido(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Não fixamos um domínio (o projeto ainda não tem um domínio de produção
// definido no repositório). Em vez de Access-Control-Allow-Origin: "*",
// validamos que o cabeçalho Origin (quando enviado pelo navegador) bate
// com o próprio host que está servindo a função — bloqueia chamadas
// feitas a partir de outro site.
export function origemPermitida(request) {
    const origin = request.headers.get("origin");
    if (!origin) return true; // navegação direta / mesma origem não manda esse header

    try {
        const host = request.headers.get("host");
        return Boolean(host) && new URL(origin).host === host;
    } catch {
        return false;
    }
}

export function ipDoRequest(request) {
    return (
        request.headers.get("x-nf-client-connection-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "desconhecido"
    );
}

// Rate limiting simples em memória — válido enquanto a instância da
// função ficar "quente" entre chamadas (comportamento padrão do
// runtime serverless da Netlify). Não substitui um limitador
// distribuído (ex.: Upstash/Redis) para tráfego alto, mas já barra
// abuso básico de um mesmo IP sem depender de infraestrutura extra.
const janelasDeChamadas = new Map();

export function limitarTaxa(chave, limite = 8, janelaMs = 60_000) {
    const agora = Date.now();
    const chamadas = (janelasDeChamadas.get(chave) || []).filter(
        (t) => agora - t < janelaMs
    );
    chamadas.push(agora);
    janelasDeChamadas.set(chave, chamadas);
    return chamadas.length <= limite;
}

export async function supabaseGet(caminho) {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });
    const dados = await resposta.json().catch(() => null);
    return { ok: resposta.ok, dados };
}

export async function supabasePost(tabela, corpo) {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(Array.isArray(corpo) ? corpo : [corpo])
    });
    const dados = await resposta.json().catch(() => null);
    return { ok: resposta.ok, dados };
}

export async function supabasePatch(tabela, filtroQuery, campos) {
    const resposta = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabela}?${filtroQuery}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(campos)
        }
    );
    const dados = await resposta.json().catch(() => null);
    return { ok: resposta.ok, dados };
}

export function gerarReferencia(prefixo) {
    return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
