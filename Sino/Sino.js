/* ============================================================
   FAÇOS - Sino.js
   Página de notificações
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const notificacoes = [
    {
        id: 1,
        titulo: 'Nova mensagem',
        descricao: 'LimpaMais Serviços enviou uma mensagem',
        tempo: '5 min atrás',
        lida: false,
        icone: '💬'
    },
    {
        id: 2,
        titulo: 'Pagamento confirmado',
        descricao: 'Pagamento de R$ 150,00 foi processado',
        tempo: '2 horas atrás',
        lida: false,
        icone: '✅'
    },
    {
        id: 3,
        titulo: 'Avalie o serviço',
        descricao: 'Avalie o serviço da Clean House Pro',
        tempo: '1 dia atrás',
        lida: true,
        icone: '⭐'
    },
    {
        id: 4,
        titulo: 'Serviço concluído',
        descricao: 'Seu pedido de limpeza foi concluído',
        tempo: '2 dias atrás',
        lida: true,
        icone: '🔧'
    },
    {
        id: 5,
        titulo: 'Nova mensagem',
        descricao: 'João Silva enviou uma mensagem',
        tempo: '3 dias atrás',
        lida: true,
        icone: '💬'
    }
];

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

// ========== RENDERIZAR NOTIFICAÇÕES ==========
function renderNotificacoes(lista) {
    const container = document.getElementById('notificacoesList');
    container.innerHTML = '';

    // Atualizar contador
    const naoLidas = lista.filter(n => !n.lida).length;
    document.getElementById('unreadCount').textContent = naoLidas;

    if (lista.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-light);">
                <p style="font-size:1.2rem;">Nenhuma notificação</p>
                <p style="font-size:0.9rem;margin-top:0.5rem;">Você está em dia!</p>
            </div>
        `;
        return;
    }

    lista.forEach(notif => {
        const card = document.createElement('div');
        card.className = `notificacao-card${notif.lida ? '' : ' unread'}`;
        card.dataset.id = notif.id;

        card.innerHTML = `
            <div class="notificacao-info">
                <div class="notificacao-titulo">${notif.titulo}</div>
                <div class="notificacao-descricao">${notif.descricao}</div>
                <div class="notificacao-tempo">${notif.tempo}</div>
            </div>
            <div class="notificacao-right">
                ${!notif.lida ? '<div class="unread-dot"></div>' : ''}
                <div class="notificacao-icone">${notif.icone}</div>
            </div>
        `;

        // Marcar como lida ao clicar
        card.addEventListener('click', () => {
            marcarComoLida(notif.id);
        });

        container.appendChild(card);
    });
}

// ========== MARCAR COMO LIDA ==========
function marcarComoLida(id) {
    const notif = notificacoes.find(n => n.id === id);
    if (notif && !notif.lida) {
        notif.lida = true;
        renderNotificacoes(notificacoes);
        
        // Feedback visual
        const card = document.querySelector(`.notificacao-card[data-id="${id}"]`);
        if (card) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0.7';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 300);
        }
    }
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

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    renderNotificacoes(notificacoes);
    configurarModoEscuro();
    configurarSidebar();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);
});