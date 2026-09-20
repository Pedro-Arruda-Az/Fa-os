// ============================================================
// FAÇOS - confirma a contratação paga via Mercado Pago
//
// Chamada pela página de retorno depois que o Mercado Pago manda o
// usuário de volta. Só aqui (com o pagamento realmente aprovado do
// lado do Mercado Pago) o pedido é criado e o profissional é
// creditado — antes isso acontecia na hora de abrir o checkout,
// mesmo sem confirmação nenhuma de pagamento.
// ============================================================

import {
    respostaJson,
    origemPermitida,
    ipDoRequest,
    limitarTaxa,
    supabaseGet,
    supabasePost,
    supabasePatch
} from "./_shared.mjs";

async function buscarPagamentoPorReferencia(externalReference) {
    const { dados } = await supabaseGet(
        `pagamentos?external_reference=eq.${encodeURIComponent(externalReference)}&select=*`
    );
    return dados && dados[0] ? dados[0] : null;
}

async function buscarUsuario(email) {
    const { dados } = await supabaseGet(
        `usuarios?email=eq.${encodeURIComponent(email)}&select=email,nome,saldo`
    );
    return dados && dados[0] ? dados[0] : null;
}

async function buscarProfissional(email) {
    const { dados } = await supabaseGet(
        `profissionais?email=eq.${encodeURIComponent(email)}&select=email,nome_empresa,saldo,status`
    );
    return dados && dados[0] ? dados[0] : null;
}

async function garantirConversa(usuarioEmail, usuarioNome, pro, servico) {
    const { dados: existentes } = await supabaseGet(
        `conversas?usuario_email=eq.${encodeURIComponent(
            usuarioEmail
        )}&profissional_email=eq.${encodeURIComponent(pro.email)}&select=id`
    );
    if (existentes && existentes[0]) return;

    await supabasePost("conversas", {
        usuario_email: usuarioEmail,
        usuario_nome: usuarioNome || usuarioEmail,
        profissional_email: pro.email,
        profissional_nome: pro.nome_empresa,
        servico,
        ultima_mensagem: "Conversa iniciada após contratação do serviço."
    });
}

export default async function confirmarContratacao(request) {
    if (!origemPermitida(request)) {
        return respostaJson(403, { error: "Origem não permitida." });
    }
    if (!limitarTaxa(`confirmar-contratacao:${ipDoRequest(request)}`, 15, 60_000)) {
        return respostaJson(429, { error: "Muitas tentativas em pouco tempo." });
    }

    try {
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            return respostaJson(500, { error: "A variável MP_ACCESS_TOKEN não foi configurada." });
        }

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("payment_id");
        const externalReference = url.searchParams.get("external_reference");

        if (!paymentId || !externalReference) {
            return respostaJson(400, { error: "Parâmetros de pagamento ausentes." });
        }

        const pagamento = await buscarPagamentoPorReferencia(externalReference);
        if (!pagamento || pagamento.tipo !== "contratacao") {
            return respostaJson(404, { error: "Contratação não encontrada." });
        }

        if (pagamento.status === "aprovado") {
            return respostaJson(200, { status: "ja_processado", valor: Number(pagamento.valor) });
        }

        const respostaMp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const dadosMp = await respostaMp.json().catch(() => null);

        if (!respostaMp.ok || !dadosMp) {
            return respostaJson(502, { error: "Não foi possível confirmar o pagamento com o Mercado Pago." });
        }
        if (dadosMp.external_reference !== externalReference) {
            return respostaJson(400, { error: "Referência de pagamento não confere." });
        }

        if (dadosMp.status !== "approved") {
            await supabasePatch(
                "pagamentos",
                `external_reference=eq.${encodeURIComponent(externalReference)}`,
                {
                    status: dadosMp.status === "rejected" ? "rejeitado" : "pendente",
                    mp_payment_id: String(paymentId),
                    atualizado_em: new Date().toISOString()
                }
            );
            return respostaJson(200, { status: dadosMp.status, valor: Number(pagamento.valor) });
        }

        const [usuario, pro] = await Promise.all([
            buscarUsuario(pagamento.usuario_email),
            buscarProfissional(pagamento.profissional_email)
        ]);

        if (!usuario || !pro) {
            return respostaJson(404, { error: "Usuário ou profissional não encontrado." });
        }

        const valor = Number(pagamento.valor);
        const servico = pagamento.descricao || "Serviço";

        await supabasePost("pedidos", {
            usuario_email: usuario.email,
            titulo: servico,
            profissional: pro.nome_empresa,
            valor,
            status: "em_andamento",
            forma_pagamento: "mercadopago"
        });

        const novoSaldoProfissional = Math.round((Number(pro.saldo || 0) + valor) * 100) / 100;
        await supabasePatch(
            "profissionais",
            `email=eq.${encodeURIComponent(pro.email)}`,
            { saldo: novoSaldoProfissional }
        );

        await supabasePatch(
            "pagamentos",
            `external_reference=eq.${encodeURIComponent(externalReference)}`,
            {
                status: "aprovado",
                mp_payment_id: String(paymentId),
                atualizado_em: new Date().toISOString()
            }
        );

        await supabasePost("notificacoes_app", {
            destinatario_tipo: "profissional",
            destinatario_email: pro.email,
            tipo: "pagamento",
            titulo: "Pagamento recebido",
            descricao: `R$ ${valor.toFixed(2).replace(".", ",")} de ${usuario.nome || usuario.email} - ${servico}`
        });

        await garantirConversa(usuario.email, usuario.nome, pro, servico);

        return respostaJson(200, { status: "aprovado", valor });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return respostaJson(500, { error: "Ocorreu um erro interno ao confirmar a contratação." });
    }
}

export const config = {
    path: "/api/confirmar-contratacao"
};
