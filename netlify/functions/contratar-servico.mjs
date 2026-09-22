// ============================================================
// FAÇOS - contratação de um profissional (backend)
//
// Antes, todo esse fluxo (debitar/creditar saldo, gravar pedido e
// pagamento) rodava no navegador, direto contra o Supabase, e o
// preço vinha do próprio cliente. Aqui o servidor re-busca o preço
// real do profissional, confere saldo e só então grava tudo usando
// a service role key — a tabela "pedidos"/"pagamentos" não precisa
// mais aceitar escrita da chave anônima.
// ============================================================

import {
    SUPABASE_URL,
    SUPABASE_KEY,
    respostaJson,
    emailValido,
    origemPermitida,
    ipDoRequest,
    limitarTaxa,
    supabaseGet,
    supabasePost,
    supabasePatch,
    gerarReferencia
} from "./_shared.mjs";

async function buscarUsuario(email) {
    const { ok, dados } = await supabaseGet(
        `usuarios?email=eq.${encodeURIComponent(email)}&select=email,nome,saldo`
    );
    return ok && dados && dados[0] ? dados[0] : null;
}

async function buscarProfissional(email) {
    const { ok, dados } = await supabaseGet(
        `profissionais?email=eq.${encodeURIComponent(
            email
        )}&select=email,nome_empresa,saldo,status,preco_servico`
    );
    return ok && dados && dados[0] ? dados[0] : null;
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

// Registra pedido + pagamentos (gasto do cliente / ganho do profissional)
// + notificação + conversa, e credita o profissional. Usado tanto no
// pagamento via carteira (na hora) quanto na confirmação de um
// pagamento via Mercado Pago (depois de aprovado).
async function finalizarContratacao({ usuario, pro, servico, valor, formaPagamento, endereco, observacoes }) {
    await supabasePost("pedidos", {
        usuario_email: usuario.email,
        usuario_nome: usuario.nome || usuario.email,
        titulo: servico,
        profissional: pro.nome_empresa,
        profissional_email: pro.email,
        valor,
        status: "em_andamento",
        forma_pagamento: formaPagamento,
        endereco: endereco || null,
        observacoes: observacoes || null
    });

    const novoSaldoProfissional =
        Math.round((Number(pro.saldo || 0) + valor) * 100) / 100;

    await supabasePatch(
        "profissionais",
        `email=eq.${encodeURIComponent(pro.email)}`,
        { saldo: novoSaldoProfissional }
    );

    await supabasePost("pagamentos", {
        usuario_email: usuario.email,
        profissional_email: pro.email,
        valor,
        forma_pagamento: formaPagamento,
        status: "aprovado",
        tipo: "ganho",
        descricao: `${servico} - ${usuario.nome || usuario.email}`,
        external_reference: gerarReferencia("GANHO")
    });

    await supabasePost("notificacoes_app", {
        destinatario_tipo: "profissional",
        destinatario_email: pro.email,
        tipo: "pagamento",
        titulo: "Pagamento recebido",
        descricao: `R$ ${valor.toFixed(2).replace(".", ",")} de ${
            usuario.nome || usuario.email
        } - ${servico}`
    });

    await garantirConversa(usuario.email, usuario.nome, pro, servico);
}

export default async function contratarServico(request) {
    if (request.method !== "POST") {
        return respostaJson(405, { error: "Método não permitido." });
    }

    if (!origemPermitida(request)) {
        return respostaJson(403, { error: "Origem não permitida." });
    }

    if (!limitarTaxa(`contratar:${ipDoRequest(request)}`, 10, 60_000)) {
        return respostaJson(429, {
            error: "Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo."
        });
    }

    try {
        const dados = await request.json();

        const usuarioEmail = String(dados.usuarioEmail || "").trim().toLowerCase();
        const profissionalEmail = String(dados.profissionalEmail || "")
            .trim()
            .toLowerCase();
        const servico = String(dados.servico || "").trim().slice(0, 120);
        const formaPagamento = String(dados.formaPagamento || "").trim();
        const origin = String(dados.origin || "").trim();
        const endereco = String(dados.endereco || "").trim().slice(0, 300);
        const observacoes = String(dados.observacoes || "").trim().slice(0, 800);

        if (!emailValido(usuarioEmail) || !emailValido(profissionalEmail)) {
            return respostaJson(400, { error: "Email inválido." });
        }
        if (!servico) {
            return respostaJson(400, { error: "Serviço inválido." });
        }
        if (!endereco) {
            return respostaJson(400, { error: "Endereço é obrigatório." });
        }
        if (!["carteira", "mercadopago"].includes(formaPagamento)) {
            return respostaJson(400, { error: "Forma de pagamento inválida." });
        }

        const [usuario, pro] = await Promise.all([
            buscarUsuario(usuarioEmail),
            buscarProfissional(profissionalEmail)
        ]);

        if (!usuario) return respostaJson(404, { error: "Usuário não encontrado." });
        if (!pro) return respostaJson(404, { error: "Profissional não encontrado." });
        if (pro.status !== "ativo") {
            return respostaJson(400, { error: "Este profissional não está disponível no momento." });
        }

        // O preço vem sempre do banco — nunca do que o navegador mandar.
        const valor = Math.round(Number(pro.preco_servico || 0) * 100) / 100;
        if (!valor || valor <= 0) {
            return respostaJson(400, { error: "Este profissional ainda não tem um preço configurado." });
        }

        if (formaPagamento === "carteira") {
            const saldoAtual = Number(usuario.saldo || 0);
            if (saldoAtual < valor) {
                return respostaJson(400, { error: "Saldo insuficiente na carteira." });
            }

            const novoSaldoUsuario = Math.round((saldoAtual - valor) * 100) / 100;
            const { ok: okDebito } = await supabasePatch(
                "usuarios",
                `email=eq.${encodeURIComponent(usuarioEmail)}`,
                { saldo: novoSaldoUsuario }
            );
            if (!okDebito) {
                return respostaJson(500, { error: "Não foi possível debitar o saldo." });
            }

            await supabasePost("pagamentos", {
                usuario_email: usuarioEmail,
                valor,
                forma_pagamento: "carteira",
                status: "aprovado",
                tipo: "gasto",
                descricao: `${servico} - ${pro.nome_empresa}`,
                external_reference: gerarReferencia("GASTO")
            });

            await finalizarContratacao({
                usuario,
                pro,
                servico,
                valor,
                formaPagamento: "carteira",
                endereco,
                observacoes
            });

            return respostaJson(200, { ok: true, novoSaldo: novoSaldoUsuario });
        }

        // formaPagamento === "mercadopago"
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            return respostaJson(500, {
                error: "A variável MP_ACCESS_TOKEN não foi configurada."
            });
        }
        if (!origin || !/^https?:\/\//.test(origin)) {
            return respostaJson(400, { error: "Origem da requisição inválida." });
        }

        const externalReference = gerarReferencia("CONTRATO");

        // Guarda um registro "pendente" com tudo que precisamos pra
        // concluir a contratação quando o pagamento for confirmado —
        // incluindo endereço e observações, que só viram um pedido de
        // verdade lá em confirmar-contratacao.mjs.
        await supabasePost("pagamentos", {
            usuario_email: usuarioEmail,
            profissional_email: profissionalEmail,
            valor,
            forma_pagamento: "mercadopago",
            status: "pendente",
            tipo: "contratacao",
            descricao: servico,
            external_reference: externalReference,
            endereco,
            observacoes
        });

        const backUrl = `${origin}/Servicos/retorno-contratacao.html?ref=${encodeURIComponent(
            externalReference
        )}`;

        const respostaMp = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                items: [
                    {
                        title: `Serviço - ${servico} - ${pro.nome_empresa}`,
                        quantity: 1,
                        currency_id: "BRL",
                        unit_price: valor
                    }
                ],
                payer: { email: usuarioEmail },
                back_urls: {
                    success: backUrl,
                    failure: backUrl,
                    pending: backUrl
                },
                auto_return: "approved",
                statement_descriptor: "FACOS SERVICOS",
                external_reference: externalReference
            })
        });

        const resultadoMp = await respostaMp.json().catch(() => null);

        if (!respostaMp.ok || !resultadoMp?.init_point) {
            console.error("Erro Mercado Pago:", resultadoMp);
            return respostaJson(502, {
                error: "Não foi possível criar o pagamento no Mercado Pago."
            });
        }

        await supabasePatch(
            "pagamentos",
            `external_reference=eq.${encodeURIComponent(externalReference)}`,
            { mp_preference_id: resultadoMp.id }
        );

        return respostaJson(200, {
            init_point: resultadoMp.init_point,
            external_reference: externalReference
        });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return respostaJson(500, { error: "Ocorreu um erro interno ao processar a contratação." });
    }
}

export const config = {
    path: "/api/contratar-servico"
};
