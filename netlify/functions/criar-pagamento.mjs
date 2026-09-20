import {
    SUPABASE_URL,
    SUPABASE_KEY,
    respostaJson as responder,
    emailValido,
    origemPermitida,
    ipDoRequest,
    limitarTaxa
} from "./_shared.mjs";

async function inserirPagamentoPendente(dados) {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/pagamentos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify([dados])
    });

    const resultado = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            (resultado && resultado.message) ||
                "Não foi possível registrar o pagamento no banco."
        );
    }

    return resultado[0];
}

export default async function criarPagamento(request) {
    if (request.method !== "POST") {
        return responder(405, { error: "Método não permitido." });
    }

    if (!origemPermitida(request)) {
        return responder(403, { error: "Origem não permitida." });
    }

    if (!limitarTaxa(`criar-pagamento:${ipDoRequest(request)}`, 8, 60_000)) {
        return responder(429, {
            error: "Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo."
        });
    }

    try {
        const accessToken = process.env.MP_ACCESS_TOKEN;

        if (!accessToken) {
            return responder(500, {
                error: "A variável MP_ACCESS_TOKEN não foi configurada."
            });
        }

        const dados = await request.json();

        const email = String(dados.email || "").trim().toLowerCase();
        const nome = String(dados.nome || "Cliente Faços").trim().slice(0, 100);
        const valor = Number(dados.valor);
        const formaPagamento = String(dados.formaPagamento || "").trim().slice(0, 40);
        const origin = String(dados.origin || "").trim();

        if (!email || !emailValido(email)) {
            return responder(400, { error: "Email inválido." });
        }

        if (!valor || valor <= 0 || valor > 50000) {
            return responder(400, { error: "Valor de crédito inválido." });
        }

        if (!origin || !/^https?:\/\//.test(origin)) {
            return responder(400, { error: "Origem da requisição inválida." });
        }

        const externalReference = `FACO-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        // Registra o pagamento como "pendente" antes de mandar pro Mercado Pago
        await inserirPagamentoPendente({
            usuario_email: email,
            valor,
            forma_pagamento: formaPagamento,
            status: "pendente",
            external_reference: externalReference
        });

        const backUrl = `${origin}/Pagamentos/Pagamentos.html`;

        const preferencia = {
            items: [
                {
                    title: "Crédito na carteira Faços",
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: Math.round(valor * 100) / 100
                }
            ],
            payer: { email },
            back_urls: {
                success: backUrl,
                failure: backUrl,
                pending: backUrl
            },
            auto_return: "approved",
            statement_descriptor: "FACOS SERVICOS",
            external_reference: externalReference
        };

        const respostaMp = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(preferencia)
            }
        );

        const resultadoMp = await respostaMp.json().catch(() => null);

        if (!respostaMp.ok || !resultadoMp?.init_point) {
            console.error("Erro Mercado Pago:", resultadoMp);
            return responder(502, {
                error: "Não foi possível criar o pagamento no Mercado Pago."
            });
        }

        await fetch(
            `${SUPABASE_URL}/rest/v1/pagamentos?external_reference=eq.${externalReference}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({ mp_preference_id: resultadoMp.id })
            }
        );

        return responder(200, {
            init_point: resultadoMp.init_point,
            external_reference: externalReference
        });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return responder(500, {
            error: "Ocorreu um erro interno ao criar o pagamento."
        });
    }
}

export const config = {
    path: "/api/criar-pagamento"
};
