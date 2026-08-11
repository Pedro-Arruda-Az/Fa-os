function responder(status, conteudo) {
    return new Response(JSON.stringify(conteudo), {
        status,

        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

function escaparHtml(texto = "") {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function enviarEmail(request) {
    if (request.method !== "POST") {
        return responder(405, {
            error: "Método não permitido."
        });
    }

    try {
        const apiKey = process.env.BREVO_API_KEY;
        const emailRemetente = process.env.BREVO_SENDER_EMAIL;

        const nomeRemetente =
            process.env.BREVO_SENDER_NAME || "Meu Projeto";

        const emailResposta =
            process.env.BREVO_REPLY_EMAIL || emailRemetente;

        if (!apiKey || !emailRemetente) {
            return responder(500, {
                error: "As variáveis do Brevo não foram configuradas."
            });
        }

        const dados = await request.json();

        const nome = String(dados.nome || "")
            .trim()
            .slice(0, 100);

        const email = String(dados.email || "")
            .trim()
            .toLowerCase()
            .slice(0, 150);

        const assunto = String(dados.assunto || "")
            .trim()
            .slice(0, 150);

        const mensagem = String(dados.mensagem || "")
            .trim()
            .slice(0, 3000);

        if (!nome || !email || !assunto || !mensagem) {
            return responder(400, {
                error: "Todos os campos são obrigatórios."
            });
        }

        if (!emailValido(email)) {
            return responder(400, {
                error: "O e-mail informado não é válido."
            });
        }

        const nomeSeguro = escaparHtml(nome);

        const mensagemSegura = escaparHtml(mensagem)
            .replaceAll("\n", "<br>");

        const respostaBrevo = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "api-key": apiKey
                },

                body: JSON.stringify({
                    sender: {
                        name: nomeRemetente,
                        email: emailRemetente
                    },

                    to: [
                        {
                            name: nome,
                            email: email
                        }
                    ],

                    replyTo: {
                        name: nomeRemetente,
                        email: emailResposta
                    },

                    subject: assunto,

                    htmlContent: `
                        <!DOCTYPE html>
                        <html lang="pt-BR">
                        <body
                            style="
                                margin: 0;
                                padding: 30px;
                                background-color: #f1f5f9;
                                font-family: Arial, sans-serif;
                            "
                        >
                            <div
                                style="
                                    max-width: 600px;
                                    margin: auto;
                                    padding: 30px;
                                    background-color: #ffffff;
                                    border-radius: 10px;
                                "
                            >
                                <h1>Olá, ${nomeSeguro}!</h1>

                                <p>${mensagemSegura}</p>

                                <p
                                    style="
                                        margin-top: 30px;
                                        color: #64748b;
                                        font-size: 13px;
                                    "
                                >
                                    Esta mensagem foi enviada
                                    automaticamente.
                                </p>
                            </div>
                        </body>
                        </html>
                    `
                })
            }
        );

        const resultadoBrevo =
            await respostaBrevo.json().catch(() => ({}));

        if (!respostaBrevo.ok) {
            console.error("Erro do Brevo:", resultadoBrevo);

            return responder(502, {
                error:
                    resultadoBrevo.message ||
                    "O Brevo não conseguiu enviar o e-mail."
            });
        }

        return responder(200, {
            message: "E-mail enviado com sucesso!",
            messageId: resultadoBrevo.messageId
        });
    } catch (erro) {
        console.error("Erro interno:", erro);

        return responder(500, {
            error: "Ocorreu um erro interno ao enviar o e-mail."
        });
    }
}

export const config = {
    path: "/api/enviar-email"
};