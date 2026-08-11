/* ============================================================
   FAÇOS - Chat.js
   Página de mensagens com profissionais
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const conversations = [
    {
        id: 1,
        name: 'LimpaMais Serviços',
        initials: 'LM',
        online: true,
        lastMessage: 'Obrigado pela preferência!',
        time: '10:30',
        unread: 2,
        messages: [
            { from: 'pro', text: 'Olá! Claro, qual seria o serviço?', time: '09:47' },
            { from: 'user', text: 'Perfeito! Podemos ir hoje às 15h?', time: '09:50' },
            { from: 'pro', text: 'Obrigado pela preferência!', time: '10:30' }
        ]
    },
    {
        id: 2,
        name: 'Clean House Pro',
        initials: 'CH',
        online: true,
        lastMessage: 'Estaremos aí amanhã às 14h',
        time: '09:15',
        unread: 0,
        messages: [
            { from: 'user', text: 'Bom dia! Gostaria de agendar uma limpeza', time: '08:30' },
            { from: 'pro', text: 'Estaremos aí amanhã às 14h', time: '09:15' }
        ]
    },
    {
        id: 3,
        name: 'João Silva - Faxineiro',
        initials: 'JS',
        online: false,
        lastMessage: 'Tudo bem! Pode marcar',
        time: 'Ontem',
        unread: 0,
        messages: [
            { from: 'user', text: 'Olá João, tem disponibilidade hoje?', time: 'Ontem 14:20' },
            { from: 'pro', text: 'Tudo bem! Pode marcar', time: 'Ontem 14:25' }
        ]
    },
    {
        id: 4,
        name: 'Brilho Total',
        initials: 'BT',
        online: false,
        lastMessage: 'Muito obrigado!',
        time: 'Segunda',
        unread: 0,
        messages: [
            { from: 'pro', text: 'Serviço concluído com sucesso!', time: 'Segunda 17:00' },
            { from: 'user', text: 'Muito obrigado!', time: 'Segunda 17:05' }
        ]
    }
];

let activeChatId = null;
let currentUser = null;

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
    currentUser = JSON.parse(usuarioLogado);
}

// ========== RENDERIZAR LISTA DE CONVERSAS ==========
function renderConversations(list) {
    const container = document.getElementById('conversationsList');
    const countEl = document.getElementById('chatCount');

    countEl.textContent = `${list.length} conversa${list.length !== 1 ? 's' : ''}`;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:var(--text-light);padding:2rem;font-size:0.95rem;">Nenhuma conversa encontrada.</p>`;
        return;
    }

    list.forEach(conv => {
        const card = document.createElement('div');
        card.className = `conv-card${activeChatId === conv.id ? ' active' : ''}`;
        card.dataset.id = conv.id;

        card.innerHTML = `
            <div class="conv-avatar">
                ${conv.initials}
                ${conv.online ? '<span class="online-dot"></span>' : ''}
            </div>
            <div class="conv-info">
                <div class="conv-name">${conv.name}</div>
                <div class="conv-last-msg">${conv.lastMessage}</div>
            </div>
            <div class="conv-time">${conv.time}</div>
            ${conv.unread > 0 ? `<div class="conv-unread">${conv.unread}</div>` : ''}
        `;

        card.addEventListener('click', () => openChat(conv.id));
        container.appendChild(card);
    });
}

// ========== ABRIR CHAT ==========
function openChat(chatId) {
    const conv = conversations.find(c => c.id === chatId);
    if (!conv) return;

    activeChatId = chatId;

    // Atualizar lista
    document.querySelectorAll('.conv-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.conv-card[data-id="${chatId}"]`);
    if (card) card.classList.add('active');

    // Mostrar chat ativo
    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('chatActive').style.display = 'flex';

    // Preencher cabeçalho
    document.getElementById('chatAvatar').textContent = conv.initials;
    document.getElementById('chatContactName').textContent = conv.name;
    document.getElementById('chatContactStatus').textContent = conv.online ? 'Online' : 'Offline';
    document.getElementById('chatContactStatus').style.color = conv.online ? 'var(--online-color)' : 'var(--text-light)';

    // Renderizar mensagens
    renderMessages(conv.messages);

    // Limpar unread
    conv.unread = 0;
    renderConversations(conversations);

    // Scroll para o final
    scrollToBottom();
}

// ========== RENDERIZAR MENSAGENS ==========
function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = msg.from === 'user' ? 'msg-sent' : 'msg-received';
        div.innerHTML = `
            ${msg.text}
            <span class="msg-time">${msg.time}</span>
        `;
        container.appendChild(div);
    });
}

// ========== ENVIAR MENSAGEM ==========
function sendMessage() {
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    if (!text || activeChatId === null) return;

    const conv = conversations.find(c => c.id === activeChatId);
    if (!conv) return;

    // Adicionar mensagem do usuário
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    conv.messages.push({ from: 'user', text: text, time: time });
    conv.lastMessage = text;
    conv.time = time;

    // Renderizar
    renderMessages(conv.messages);
    scrollToBottom();

    // Limpar input
    input.value = '';

    // Atualizar lista
    renderConversations(conversations);

    // Simular resposta do profissional (1-2 segundos)
    const responses = [
        'Entendi! Vou verificar a disponibilidade.',
        'Claro! Podemos agendar para amanhã?',
        'Perfeito! Já estou a caminho.',
        'Obrigado pela mensagem!',
        'Vou confirmar com a equipe e te aviso.'
    ];
    
    setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        conv.messages.push({ from: 'pro', text: randomResponse, time: time });
        conv.lastMessage = randomResponse;
        
        renderMessages(conv.messages);
        scrollToBottom();
        renderConversations(conversations);
    }, 1000 + Math.random() * 1500);
}

// ========== SCROLL PARA O FINAL ==========
function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

// ========== MODO ESCURO ==========
function configurarModoEscuro() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;

    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Modo claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? '☀️ Modo claro' : '🌙 Modo escuro';
    });
}

// ========== SIDEBAR TOGGLE ==========
function configurarSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const pinned = sidebar.classList.toggle('pinned');
            sidebarToggle.textContent = pinned ? '‹' : '›';
        });
    }
}

// ========== BACK BUTTON (MOBILE) ==========
function configurarBackButton() {
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('chatPlaceholder').style.display = 'flex';
            document.getElementById('chatActive').style.display = 'none';
            activeChatId = null;
            document.querySelectorAll('.conv-card').forEach(c => c.classList.remove('active'));
        });
    }
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    renderConversations(conversations);
    configurarModoEscuro();
    configurarSidebar();
    configurarBackButton();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    // Enviar mensagem (Enter ou clique)
    const input = document.getElementById('chatMessageInput');
    const sendBtn = document.getElementById('chatSendBtn');

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    sendBtn.addEventListener('click', sendMessage);

    // Busca
    const searchInput = document.getElementById('searchChat');
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        const filtered = conversations.filter(c => 
            !q || c.name.toLowerCase().includes(q)
        );
        renderConversations(filtered);
    });

    // Abrir primeira conversa por padrão (se houver)
    if (conversations.length > 0) {
        openChat(conversations[0].id);
    }
});