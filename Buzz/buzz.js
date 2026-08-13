/* ============================================================
   FAÇOS - buzz.js
   Widget de chat "Buzz" (Ajuda/Suporte) - injeta e controla o
   chat em qualquer página que carregue este script.
   ============================================================ */

(function () {
    function criarWidgetBuzz() {
        // Evita duplicar o widget caso o script rode mais de uma vez
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

        // Todos os botões de "Ajuda / Suporte" da página abrem o Buzz
        const helpButtons = document.querySelectorAll('.help-button');

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

        function enviarMensagem() {
            const texto = buzzInput.value.trim();
            if (!texto) return;

            const msgUsuario = document.createElement('div');
            msgUsuario.className = 'buzz-message buzz-message-user';
            msgUsuario.textContent = texto;
            buzzMessages.appendChild(msgUsuario);

            buzzInput.value = '';
            buzzMessages.scrollTop = buzzMessages.scrollHeight;

            setTimeout(() => {
                const msgBot = document.createElement('div');
                msgBot.className = 'buzz-message buzz-message-bot';
                msgBot.textContent = 'Obrigado pela mensagem! Nossa equipe vai te responder em breve. 🐝';
                buzzMessages.appendChild(msgBot);
                buzzMessages.scrollTop = buzzMessages.scrollHeight;
            }, 600);
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
