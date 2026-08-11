/* ============================================================
   FAÇOS - mensagens.js
   Mensagens com clientes (painel do profissional)
   ============================================================ */

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== DADOS DE EXEMPLO ==========
const conversas = {
    joao: {
        nome: 'João Silva',
        mensagens: [
            { tipo: 'recebida', texto: 'Olá! Gostaria de contratar seus serviços', hora: '09:45' },
            { tipo: 'enviada', texto: 'Olá! Claro, será um prazer atendê-lo. Qual serviço você precisa?', hora: '09:47' },
            { tipo: 'recebida', texto: 'Preciso de limpeza residencial, são 3 cômodos', hora: '09:48' },
            { tipo: 'enviada', texto: 'Perfeito! Posso atender hoje à tarde. Qual o melhor horário para você?', hora: '09:50' },
            { tipo: 'recebida', texto: 'Quando você pode vir?', hora: '10:30' },
            { tipo: 'enviada', texto: 'Posso ir hoje às 14h. Pode ser?', hora: '10:32' },
            { tipo: 'recebida', texto: 'Ok, até logo!', hora: '10:38' }
        ]
    },
    maria: {
        nome: 'Maria Santos',
        mensagens: [
            { tipo: 'recebida', texto: 'Bom dia! O serviço de ontem ficou ótimo', hora: '09:10' },
            { tipo: 'enviada', texto: 'Que bom que gostou, Maria! Qualquer coisa estou à disposição', hora: '09:12' },
            { tipo: 'recebida', texto: 'Obrigada pelo serviço!', hora: '09:15' }
        ]
    },
    pedro: {
        nome: 'Pedro Costa',
        mensagens: [
            { tipo: 'recebida', texto: 'Podemos marcar para amanhã?', hora: 'Ontem 13:20' },
            { tipo: 'enviada', texto: 'Sim, consigo às 14h. Fica bom?', hora: 'Ontem 13:25' },
            { tipo: 'recebida', texto: 'Isso, às 14h', hora: 'Ontem 13:26' }
        ]
    },
    ana: {
        nome: 'Ana Lima',
        mensagens: [
            { tipo: 'recebida', texto: 'Oi, tudo bem? Vi seu perfil e gostei do seu trabalho', hora: 'Ontem 11:00' },
            { tipo: 'recebida', texto: 'Pode fazer orçamento?', hora: 'Ontem 11:02' }
        ]
    },
    carlos: {
        nome: 'Carlos Mendes',
        mensagens: [
            { tipo: 'enviada', texto: 'Estou a caminho, chego em 10 minutos', hora: 'Seg 08:50' },
            { tipo: 'recebida', texto: 'Chegou aí?', hora: 'Seg 09:05' }
        ]
    },
    beatriz: {
        nome: 'Beatriz Souza',
        mensagens: [
            { tipo: 'enviada', texto: 'Serviço finalizado! Qualquer coisa é só chamar', hora: 'Dom 16:40' },
            { tipo: 'recebida', texto: 'Muito obrigada!', hora: 'Dom 16:45' }
        ]
    }
};

// ========== ELEMENTOS ==========
const conversasList = document.getElementById('conversasList');
const chatMensagens = document.getElementById('chatMensagens');
const chatContatoNome = document.getElementById('chatContatoNome');
const chatInput = document.getElementById('chatInput');
const enviarBtn = document.getElementById('enviarBtn');

// ========== RENDERIZAR MENSAGENS ==========
function renderizarConversa(id) {
    const conversa = conversas[id];
    if (!conversa) return;

    chatContatoNome.textContent = conversa.nome;
    chatMensagens.innerHTML = '';

    conversa.mensagens.forEach((msg) => {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${msg.tipo === 'enviada' ? 'msg-enviada' : 'msg-recebida'}`;

        const texto = document.createElement('p');
        texto.className = 'msg-texto';
        texto.textContent = msg.texto;

        const hora = document.createElement('span');
        hora.className = 'msg-hora';
        hora.textContent = msg.hora;

        bubble.appendChild(texto);
        bubble.appendChild(hora);
        chatMensagens.appendChild(bubble);
    });

    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

// ========== TROCAR CONVERSA AO CLICAR ==========
if (conversasList) {
    conversasList.addEventListener('click', function (e) {
        const item = e.target.closest('.conversa-item');
        if (!item) return;

        document.querySelectorAll('.conversa-item').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');

        renderizarConversa(item.dataset.id);
    });
}

// ========== ENVIAR MENSAGEM (DEMONSTRAÇÃO) ==========
function enviarMensagem() {
    const texto = chatInput.value.trim();
    if (!texto) return;

    const idAtivo = document.querySelector('.conversa-item.active')?.dataset.id;
    if (!idAtivo || !conversas[idAtivo]) return;

    const agora = new Date();
    const hora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    conversas[idAtivo].mensagens.push({ tipo: 'enviada', texto, hora });
    renderizarConversa(idAtivo);
    chatInput.value = '';
}

if (enviarBtn) {
    enviarBtn.addEventListener('click', enviarMensagem);
}

if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') enviarMensagem();
    });
}

// ========== PERFIL (LOGOUT) ==========
const perfilBtn = document.getElementById('perfilBtn');
if (perfilBtn) {
    perfilBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Deseja sair do painel profissional?')) {
            localStorage.removeItem('profissionalLogado');
            window.location.href = '/Profissional/login_profissional.html';
        }
    });
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    renderizarConversa('joao');
});
