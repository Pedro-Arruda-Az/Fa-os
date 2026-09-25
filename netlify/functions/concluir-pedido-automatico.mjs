// ============================================================
// FAÇOS - conclui automaticamente um pedido "em andamento"
//
// Chamada pela tela "Meus pedidos" (Pedidos.js) 30 segundos depois
// que o pedido foi criado, pra liberar a avaliação do profissional
// sem precisar esperar o profissional marcar o serviço como
// concluído manualmente. O tempo mínimo também é conferido aqui no
// servidor (a partir do "criado_em" gravado no banco), então não dá
// pra "adiantar" a conclusão manipulando o navegador.
// ============================================================

import {
    respostaJson,
    origemPermitida,
    ipDoRequest,
    limitarTaxa,
    emailValido,
    supabaseGet,
    supabasePatch
} from "./_shared.mjs";

const TEMPO_MINIMO_MS = 30_000;

async function buscarPedido(id) {
    const { dados } = await supabaseGet(
        `pedidos?id=eq.${encodeURIComponent(id)}&select=id,usuario_email,status,criado_em`
    );
    return dados && dados[0] ? dados[0] : null;
}

export default async function concluirPedidoAutomatico(request) {
    if (!origemPermitida(request)) {
        return respostaJson(403, { error: "Origem não permitida." });
    }
    if (!limitarTaxa(`concluir-pedido:${ipDoRequest(request)}`, 20, 60_000)) {
        return respostaJson(429, { error: "Muitas tentativas em pouco tempo." });
    }

    try {
        const corpo = await request.json().catch(() => null);
        if (!corpo) {
            return respostaJson(400, { error: "Corpo da requisição inválido." });
        }

        const { pedidoId, usuarioEmail } = corpo;

        if (!pedidoId || typeof pedidoId !== "string") {
            return respostaJson(400, { error: "Pedido inválido." });
        }
        if (!emailValido(usuarioEmail)) {
            return respostaJson(400, { error: "Email inválido." });
        }

        const pedido = await buscarPedido(pedidoId);
        if (!pedido) {
            return respostaJson(404, { error: "Pedido não encontrado." });
        }
        if (pedido.usuario_email !== usuarioEmail) {
            return respostaJson(403, { error: "Esse pedido não pertence a esse usuário." });
        }

        // Já concluído (por essa mesma chamada em outra aba, por exemplo) — sem erro, só confirma.
        if (pedido.status !== "em_andamento") {
            return respostaJson(200, { ok: true, jaConcluido: true });
        }

        const decorrido = Date.now() - new Date(pedido.criado_em).getTime();
        if (decorrido < TEMPO_MINIMO_MS) {
            return respostaJson(400, {
                error: "Ainda não passou tempo suficiente para concluir esse pedido."
            });
        }

        await supabasePatch("pedidos", `id=eq.${encodeURIComponent(pedidoId)}`, {
            status: "concluido"
        });

        return respostaJson(200, { ok: true });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return respostaJson(500, { error: "Ocorreu um erro interno ao concluir o pedido." });
    }
}

export const config = {
    path: "/api/concluir-pedido-automatico"
};
