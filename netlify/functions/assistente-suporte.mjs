// ============================================================
// FAÇOS - assistente de suporte com IA (Buzz)
//
// Recebe o histórico da conversa do widget "Buzz" (Buzz/buzz.js) e
// responde usando a API da Anthropic (Claude), com um system prompt
// que explica o que é o Faços e como ele funciona — pra tirar dúvidas
// de empresas e profissionais sobre a plataforma.
//
// Não tem acesso a dados reais de conta nenhuma (pedidos, saldo,
// etc.) — é só um assistente de ajuda geral, então nunca inventa
// números específicos da conta de quem está perguntando.
// ============================================================

import {
    respostaJson as responder,
    origemPermitida,
    ipDoRequest,
    limitarTaxa
} from "./_shared.mjs";

const SYSTEM_PROMPT = `Você é o Buzz, o assistente de suporte do Faços — uma plataforma
brasileira que conecta empresas a profissionais de serviços domésticos
(limpeza, elétrica, manutenção, jardinagem, instalações e tecnologia/assistência).

Como o Faços funciona:
- Empresas se cadastram, escolhem uma categoria de serviço, veem os
  profissionais disponíveis e contratam um deles.
- O pagamento pode ser pela carteira (saldo) do app ou via Mercado
  Pago (cartão/pix).
- Depois de contratado, a empresa acompanha o pedido em "Meus
  Pedidos" e a localização do profissional em "Localização" (um mapa
  mostrando o profissional e a distância até a empresa).
- Profissionais se cadastram informando área de atuação, preço do
  serviço e endereço; recebem os pedidos reais na tela "Pedidos" e
  veem um resumo do dia (atendimentos e ganhos) no painel deles.
- Ambos os lados podem editar o perfil (endereço, telefone, etc.) e
  têm uma carteira com saldo e histórico de pagamentos.

Regras importantes:
- Responda sempre em português do Brasil, num tom simpático, direto e
  curto (isso é um chat, não um e-mail — poucas frases por resposta,
  sem listas longas a não ser que ajudem muito).
- Você NÃO tem acesso aos dados reais da conta de quem está
  conversando (não sabe o pedido específico dela, o saldo dela, etc.)
  — se perguntarem algo assim, explique isso com simpatia e oriente a
  pessoa a checar a tela correspondente no app (Pedidos, Carteira,
  etc.), ou dizer que a equipe de suporte humana pode ajudar com
  esses detalhes.
- Se não souber a resposta ou a pergunta for sobre algo fora do
  Faços, admita com naturalidade e não invente informação.
- Nunca peça senha, CPF, CNPJ completo ou dados de cartão pelo chat.`;

export default async function assistenteSuporte(request) {
    if (request.method !== "POST") {
        return responder(405, { error: "Método não permitido." });
    }

    if (!origemPermitida(request)) {
        return responder(403, { error: "Origem não permitida." });
    }

    if (!limitarTaxa(`assistente-suporte:${ipDoRequest(request)}`, 20, 60_000)) {
        return responder(429, {
            error: "Muitas mensagens em pouco tempo. Espera um instante e manda de novo."
        });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return responder(500, {
            error: "O assistente ainda não foi configurado (falta a chave de API)."
        });
    }

    try {
        const dados = await request.json();
        const mensagensRecebidas = Array.isArray(dados.mensagens) ? dados.mensagens : [];

        // Só aceita role "user"/"assistant" com texto, limita tamanho de
        // cada mensagem e quantas mensagens de histórico são levadas em
        // conta — protege contra payloads gigantes ou mal-formados.
        const mensagens = mensagensRecebidas
            .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-20)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

        if (!mensagens.length || mensagens[mensagens.length - 1].role !== "user") {
            return responder(400, { error: "Mensagem inválida." });
        }

        const respostaClaude = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 500,
                system: SYSTEM_PROMPT,
                messages: mensagens
            })
        });

        const resultado = await respostaClaude.json().catch(() => null);

        if (!respostaClaude.ok || !resultado) {
            console.error("Erro da Anthropic:", resultado);
            return responder(502, {
                error: "Não foi possível falar com o assistente agora. Tenta de novo em instantes."
            });
        }

        const texto = (resultado.content || [])
            .filter((bloco) => bloco.type === "text")
            .map((bloco) => bloco.text)
            .join("\n")
            .trim();

        return responder(200, {
            resposta: texto || "Desculpa, não consegui pensar numa resposta agora. Pode reformular a pergunta?"
        });
    } catch (erro) {
        console.error("Erro interno:", erro);
        return responder(500, {
            error: "Ocorreu um erro interno ao falar com o assistente."
        });
    }
}

export const config = {
    path: "/api/assistente-suporte"
};
