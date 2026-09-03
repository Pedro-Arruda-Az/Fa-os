/* ============================================================
   FAÇOS - Notificacoes.js
   Página de notificações
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const notificacoes = [
    {
        id: 1,
        tipo: 'message',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
        titulo: 'Nova mensagem',
        descricao: 'LimpaMais Serviços enviou uma mensagem',
        tempo: '5 min atrás',
        lida: false
    },
    {
        id: 2,
        tipo: 'payment',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
        titulo: 'Pagamento confirmado',
        descricao: 'Pagamento de R$ 150,00 foi processado',
        tempo: '2 horas atrás',
        lida: false
    },
    {
        id: 3,
        tipo: 'star',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 6 6.5 1-4.7 4.6L18 20l-6-3.2L6 20l1.2-6.4L2.5 9l6.5-1 3-6Z"/></svg>',
        titulo: 'Avalie o serviço',
        descricao: 'Avalie o serviço da Clean House Pro',
        tempo: '1 dia atrás',
        lida: true
    },
    {
        id: 4,
        tipo: 'check',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        titulo: 'Serviço concluído',
        descricao: 'Seu pedido de limpeza foi concluído',
        tempo: '2 dias atrás',
        lida: true
    },
    {
        id: 5,
        tipo: 'message',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
        titulo: 'Nova mensagem',
        descricao: 'João Silva enviou uma mensagem',
        tempo: '3 dias atrás',
        lida: true
    },
    {
        id: 6,
        tipo: 'payment',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
        titulo: 'Crédito adicionado',
        descricao: 'R$ 500,00 foram adicionados à sua conta',
        tempo: '5 dias atrás',
        lida: true
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
function renderNotificacoes() {
    const container = document.getElementById('notifList');
    container.innerHTML = '';

    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div class="notif-empty">
                <p style="font-size:1.2rem;">Nenhuma notificação</p>
                <p style="font-size:0.9rem;margin-top:0.5rem;">Você está em dia por aqui!</p>
            </div>
        `;
    } else {
        notificacoes.forEach(notif => {
            const card = document.createElement('div');
            card.className = `notif-card${notif.lida ? '' : ' unread'}`;
            card.dataset.id = notif.id;

            card.innerHTML = `
                <div class="notif-body">
                    <div class="notif-title">${notif.titulo}</div>
                    <div class="notif-desc">${notif.descricao}</div>
                    <div class="notif-time">${notif.tempo}</div>
                </div>
                ${notif.lida ? '' : '<div class="notif-dot"></div>'}
            `;

            // Marcar como lida ao clicar
            card.addEventListener('click', () => {
                if (!notif.lida) {
                    notif.lida = true;
                    renderNotificacoes();
                    atualizarBannerNaoLidas();
                }
            });

            container.appendChild(card);
        });
    }

    atualizarBannerNaoLidas();
}

// ========== BANNER DE NÃO LIDAS ==========
function atualizarBannerNaoLidas() {
    const banner = document.getElementById('unreadBanner');
    const countEl = document.getElementById('unreadCount');
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    countEl.textContent = naoLidas;
    banner.classList.toggle('hidden', naoLidas === 0);
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

// ========== MODO ESCURO ==========
function configurarModoEscuro() {
    const modoClaroBtn = document.getElementById('modoClaroBtn');
    const modoClaroLabel = document.getElementById('modoClaroLabel');
    if (!modoClaroBtn) return;

    function aplicarModo(escuro) {
        document.body.classList.toggle('dark-mode', escuro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', escuro ? 'menu.modoClaro' : 'menu.modoEscuro');
            if (window.facosClienteAplicarIdioma) window.facosClienteAplicarIdioma();
        }
    }

    if (localStorage.getItem('darkMode') === 'enabled') {
        aplicarModo(true);
    }

    modoClaroBtn.addEventListener('click', () => {
        const escuro = !document.body.classList.contains('dark-mode');
        aplicarModo(escuro);
        localStorage.setItem('darkMode', escuro ? 'enabled' : 'disabled');
    });
}

// ========== MENU DE CONFIGURAÇÕES (ENGRENAGEM) ==========
function configurarMenuConfiguracoes() {
    const configBtn = document.getElementById('configBtn');
    const configMenu = document.getElementById('configMenu');
    if (!configBtn || !configMenu) return;

    configBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        configMenu.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
        if (!configMenu.contains(e.target) && e.target !== configBtn) {
            configMenu.classList.remove('open');
        }
    });

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosClienteTrocarIdioma) facosClienteTrocarIdioma();
        });
    }
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
    renderNotificacoes();
    configurarModoEscuro();
    configurarMenuConfiguracoes();
    configurarSidebar();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', fazerLogout);
    }
});
