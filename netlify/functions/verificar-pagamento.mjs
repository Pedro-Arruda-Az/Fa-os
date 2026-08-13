// ============================================================
// FAÇOS - verificar-pagamento.mjs
// Confirma um pagamento no Mercado Pago (direto na API deles,
// nunca confiando só nos parâmetros da URL) e credita o saldo
// do usuário no Supabase.
// ============================================================

const SUPABASE_URL = "https://fbgnvpcqwpvbwqtmqpzj.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc";

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

function responder(status, conteudo) {
    return new Response(JSON.stringify(conteudo), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

async function buscarPagamentoPorReferencia(externalReference) {
    const resposta = await fetch(
        `${SUPABASE_URL}/rest/v1/pagamentos?external_reference=eq.${encodeURIComponent(
            externalReference
        )}&select=*`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const linhas = await resposta.json().catch(() => []);
    return linhas && linhas[0] ? linhas[0] : null;
}

async function buscarSaldoUsuario(email) {
    const resposta = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(
            email
        )}&select=saldo`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const linhas = await resposta.json().catch(() => []);
    return linhas && linhas[0] ? Number(linhas[0].saldo || 0) : 0;
}

async function creditarSaldo(email, novoSaldo) {
    await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ saldo: novoSaldo })
        }
    );
}

async function atualizarPagamento(externalReference, campos) {
    await fetch(
        `${SUPABASE_URL}/rest/v1/pagamentos?external_reference=eq.${encodeURIComponent(
            externalReference
        )}`,
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
}

export default async function verificarPagamento(request) {
    try {
        const accessToken = process.env.MP_ACCESS_TOKEN;

        if (!accessToken) {
            return responder(500, {
                error: "A variável MP_ACCESS_TOKEN não foi configurada."
            });
        }

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("payment_id");
        const externalReference = url.searchParams.get("external_reference");

        if (!paymentId || !externalReference) {
            return responder(400, { error: "Parâmetros de pagamento ausentes." });
        }

        // Busca o registro local do pagamento (criado antes do checkout)
        const pagamento = await buscarPagamentoPorReferencia(externalReference);

        if (!pagamento) {
            return responder(404, { error: "Pagamento não encontrado." });
        }

        // Já processado antes (evita creditar duas vezes se a pessoa
        // atualizar a página de retorno)
        if (pagamento.status === "aprovado") {
            const saldoAtual = await buscarSaldoUsuario(pagamento.usuario_email);
            return responder(200, {
                status: "ja_processado",
                valor: Number(pagamento.valor),
                novoSaldo: saldoAtual
            });
        }

        // Confirma o pagamento direto na API do Mercado Pago —
        // nunca confiamos apenas nos parâmetros que voltam na URL
        const respostaMp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const dadosMp = await respostaMp.json().catch(() => null);

        if (!respostaMp.ok || !dadosMp) {
            return responder(502, {
                error: "Não foi possível confirmar o pagamento com o Mercado Pago."
            });
        }

        if (dadosMp.external_reference !== externalReference) {
            return responder(400, { error: "Referência de pagamento não confere." });
        }

        if (dadosMp.status !== "approved") {
            await atualizarPagamento(externalReference, {
                status: dadosMp.status === "rejected" ? "rejeitado" : "pendente",
                mp_payment_id: String(paymentId),
                atualizado_em: new Date().toISOString()
            });

            return responder(200, {
                status: dadosMp.status,
                valor: Number(pagamento.valor)
            });
        }

        // Pagamento aprovado: credita o saldo do usuário
        const valor = Number(pagamento.valor);
        const saldoAtual = await buscarSaldoUsuario(pagamento.usuario_email);
        const novoSaldo = Math.round((saldoAtual + valor) * 100) / 100;

        await creditarSaldo(pagamento.usuario_email, novoSaldo);

        await atualizarPagamento(externalReference, {
            status: "aprovado",
            mp_payment_id: String(paymentId),
            atualizado_em: new Date().toISOString()
        });

        return responder(200, {
            status: "aprovado",
            valor,
            novoSaldo
        });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return responder(500, {
            error: "Ocorreu um erro interno ao verificar o pagamento."
        });
    }
}

export const config = {
    path: "/api/verificar-pagamento"
};
