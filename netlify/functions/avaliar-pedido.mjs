// ============================================================
// FAÇOS - registra a avaliação de um pedido concluído
//
// Chamada pela tela "Meus pedidos" (telinha de avaliação estilo Uber)
// quando a empresa avalia o profissional depois do serviço concluído.
// Grava a nota, os motivos rápidos (chips) e o texto livre de "outros
// motivos" no pedido, e atualiza a média de avaliação do profissional
// — tudo pelo servidor (service role key), a chave anônima do
// navegador só consegue ler a tabela "pedidos", nunca escrever nela.
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

async function buscarPedido(id) {
    const { dados } = await supabaseGet(
        `pedidos?id=eq.${encodeURIComponent(id)}&select=id,usuario_email,profissional_email,status,avaliacao`
    );
    return dados && dados[0] ? dados[0] : null;
}

async function buscarProfissional(email) {
    const { dados } = await supabaseGet(
        `profissionais?email=eq.${encodeURIComponent(email)}&select=email,avaliacao,total_avaliacoes`
    );
    return dados && dados[0] ? dados[0] : null;
}

export default async function avaliarPedido(request) {
    if (!origemPermitida(request)) {
        return respostaJson(403, { error: "Origem não permitida." });
    }
    if (!limitarTaxa(`avaliar-pedido:${ipDoRequest(request)}`, 10, 60_000)) {
        return respostaJson(429, { error: "Muitas tentativas em pouco tempo." });
    }

    try {
        const corpo = await request.json().catch(() => null);
        if (!corpo) {
            return respostaJson(400, { error: "Corpo da requisição inválido." });
        }

        const { pedidoId, usuarioEmail, nota, motivos, comentario } = corpo;

        if (!pedidoId || typeof pedidoId !== "string") {
            return respostaJson(400, { error: "Pedido inválido." });
        }
        if (!emailValido(usuarioEmail)) {
            return respostaJson(400, { error: "Email inválido." });
        }
        const notaNumero = Number(nota);
        if (!Number.isInteger(notaNumero) || notaNumero < 1 || notaNumero > 5) {
            return respostaJson(400, { error: "A nota precisa ser um número inteiro de 1 a 5." });
        }
        const motivosLista = Array.isArray(motivos)
            ? motivos.filter((m) => typeof m === "string" && m.trim()).slice(0, 10)
            : [];
        const comentarioTexto = typeof comentario === "string" ? comentario.trim().slice(0, 1000) : "";

        const pedido = await buscarPedido(pedidoId);
        if (!pedido) {
            return respostaJson(404, { error: "Pedido não encontrado." });
        }
        if (pedido.usuario_email !== usuarioEmail) {
            return respostaJson(403, { error: "Esse pedido não pertence a esse usuário." });
        }
        if (pedido.status !== "concluido") {
            return respostaJson(400, { error: "Só é possível avaliar pedidos já concluídos." });
        }

        await supabasePatch("pedidos", `id=eq.${encodeURIComponent(pedidoId)}`, {
            avaliacao: notaNumero,
            avaliacao_motivos: motivosLista.length ? motivosLista.join(", ") : null,
            avaliacao_comentario: comentarioTexto || null
        });

        // Atualiza a média do profissional (só se ele existir e tiver email vinculado ao pedido).
        if (pedido.profissional_email) {
            const pro = await buscarProfissional(pedido.profissional_email);
            if (pro) {
                const totalAtual = Number(pro.total_avaliacoes || 0);
                const mediaAtual = Number(pro.avaliacao || 0);
                const novoTotal = totalAtual + 1;
                const novaMedia = Math.round(((mediaAtual * totalAtual + notaNumero) / novoTotal) * 100) / 100;

                await supabasePatch("profissionais", `email=eq.${encodeURIComponent(pro.email)}`, {
                    avaliacao: novaMedia,
                    total_avaliacoes: novoTotal
                });
            }
        }

        return respostaJson(200, { ok: true });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return respostaJson(500, { error: "Ocorreu um erro interno ao registrar a avaliação." });
    }
}

export const config = {
    path: "/api/avaliar-pedido"
};
