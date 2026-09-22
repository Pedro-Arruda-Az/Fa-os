// ============================================================
// FAÇOS - lista os pedidos reais de um profissional (backend)
//
// Usado pela tela "Pedidos" do profissional (Profissional/pepe.html)
// pra buscar, direto do banco, os pedidos que os clientes fizeram
// com ele — nome do cliente, serviço, data/hora exata, endereço e
// informações adicionais. Assim os pedidos continuam lá mesmo se o
// profissional sair e voltar, ou entrar de outro aparelho.
// ============================================================

import {
    respostaJson,
    emailValido,
    origemPermitida,
    ipDoRequest,
    limitarTaxa,
    supabaseGet
} from "./_shared.mjs";

export default async function pedidosProfissional(request) {
    if (request.method !== "GET") {
        return respostaJson(405, { error: "Método não permitido." });
    }

    if (!origemPermitida(request)) {
        return respostaJson(403, { error: "Origem não permitida." });
    }

    if (!limitarTaxa(`pedidos-profissional:${ipDoRequest(request)}`, 30, 60_000)) {
        return respostaJson(429, {
            error: "Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo."
        });
    }

    try {
        const url = new URL(request.url);
        const email = String(url.searchParams.get("email") || "").trim().toLowerCase();

        if (!emailValido(email)) {
            return respostaJson(400, { error: "Email inválido." });
        }

        const { ok, dados } = await supabaseGet(
            `pedidos?profissional_email=eq.${encodeURIComponent(email)}` +
                `&select=id,usuario_nome,usuario_email,titulo,endereco,observacoes,valor,status,criado_em` +
                `&order=criado_em.desc&limit=50`
        );

        if (!ok) {
            return respostaJson(502, { error: "Não foi possível buscar os pedidos agora." });
        }

        return respostaJson(200, { pedidos: dados || [] });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return respostaJson(500, { error: "Ocorreu um erro interno ao buscar os pedidos." });
    }
}

export const config = {
    path: "/api/pedidos-profissional"
};
