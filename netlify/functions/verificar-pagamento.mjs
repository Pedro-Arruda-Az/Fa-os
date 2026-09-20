import {
    SUPABASE_URL,
    SUPABASE_KEY,
    respostaJson as responder,
    origemPermitida,
    ipDoRequest,
    limitarTaxa
} from "./_shared.mjs";

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
    if (!origemPermitida(request)) {
        return responder(403, { error: "Origem não permitida." });
    }

    if (!limitarTaxa(`verificar-pagamento:${ipDoRequest(request)}`, 15, 60_000)) {
        return responder(429, { error: "Muitas tentativas em pouco tempo." });
    }

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
