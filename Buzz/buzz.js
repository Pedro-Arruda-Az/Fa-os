
(function () {
    function criarWidgetBuzz() {
        if (document.getElementById('buzzWidget')) return;

        const widget = document.createElement('div');
        widget.className = 'buzz-widget';
        widget.id = 'buzzWidget';
        widget.innerHTML = `
            <div class="buzz-header">
                <div class="buzz-header-info">
                    <div class="buzz-avatar">🐝</div>
                    <div class="buzz-titles">
                        <span class="buzz-name">Buzz</span>
                        <span class="buzz-subtitle">Sua abelha assistente</span>
                    </div>
                </div>
                <button class="buzz-close" id="buzzClose" type="button">&times;</button>
            </div>
            <div class="buzz-messages" id="buzzMessages">
                <div class="buzz-message buzz-message-bot">
                    Olá! 👋 Sou o Buzz! Como posso ajudar você hoje?
                </div>
            </div>
            <div class="buzz-footer">
                <input type="text" id="buzzInput" class="buzz-input" placeholder="Digite sua mensagem...">
                <button class="buzz-send" id="buzzSend" type="button">Enviar</button>
            </div>
        `;
        document.body.appendChild(widget);
    }

    function configurarBuzz() {
        criarWidgetBuzz();

        const buzzWidget = document.getElementById('buzzWidget');
        const buzzClose = document.getElementById('buzzClose');
        const buzzInput = document.getElementById('buzzInput');
        const buzzSend = document.getElementById('buzzSend');
        const buzzMessages = document.getElementById('buzzMessages');

        const helpButtons = document.querySelectorAll('.help-button');

        // Histórico da conversa (só na memória — some se recarregar a
        // página), mandado inteiro pro backend a cada mensagem pra IA
        // ter contexto do que já foi falado.
        const historico = [];

        helpButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                buzzWidget.classList.toggle('active');
                if (buzzWidget.classList.contains('active')) {
                    buzzInput.focus();
                }
            });
        });

        buzzClose.addEventListener('click', () => {
            buzzWidget.classList.remove('active');
        });

        function adicionarMensagem(texto, quemFalou) {
            const msg = document.createElement('div');
            msg.className = `buzz-message buzz-message-${quemFalou}`;
            msg.textContent = texto;
            buzzMessages.appendChild(msg);
            buzzMessages.scrollTop = buzzMessages.scrollHeight;
            return msg;
        }

        function mostrarDigitando() {
            const indicador = document.createElement('div');
            indicador.className = 'buzz-message buzz-message-bot buzz-digitando';
            indicador.id = 'buzzDigitando';
            indicador.innerHTML = '<span></span><span></span><span></span>';
            buzzMessages.appendChild(indicador);
            buzzMessages.scrollTop = buzzMessages.scrollHeight;
        }

        function removerDigitando() {
            const indicador = document.getElementById('buzzDigitando');
            if (indicador) indicador.remove();
        }

        async function enviarMensagem() {
            const texto = buzzInput.value.trim();
            if (!texto) return;

            adicionarMensagem(texto, 'user');
            historico.push({ role: 'user', content: texto });

            buzzInput.value = '';
            buzzInput.disabled = true;
            buzzSend.disabled = true;
            mostrarDigitando();

            try {
                const resposta = await fetch('/api/assistente-suporte', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mensagens: historico })
                });

                const dados = await resposta.json().catch(() => null);
                removerDigitando();

                if (!resposta.ok || !dados || !dados.resposta) {
                    adicionarMensagem('Desculpa, não consegui responder agora. Tenta de novo em instantes.', 'bot');
                } else {
                    adicionarMensagem(dados.resposta, 'bot');
                    historico.push({ role: 'assistant', content: dados.resposta });
                }
            } catch (err) {
                console.error('Não foi possível falar com o assistente:', err);
                removerDigitando();
                adicionarMensagem('Não consegui me conectar agora. Confere sua internet e tenta de novo.', 'bot');
            } finally {
                buzzInput.disabled = false;
                buzzSend.disabled = false;
                buzzInput.focus();
            }
        }

        buzzSend.addEventListener('click', enviarMensagem);
        buzzInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enviarMensagem();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', configurarBuzz);
    } else {
        configurarBuzz();
    }
})();
