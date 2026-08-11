/* ============================================================
   FAÇOS - Pedidos.js
   Página de histórico de pedidos
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const pedidos = [
    {
        id: 1,
        titulo: 'Limpeza completa residencial',
        profissional: 'LimpaMais Serviços',
        data: '20 Abr 2026',
        preco: 'R$ 150,00',
        status: 'concluido',
        avaliacao: 5.0
    },
    {
        id: 2,
        titulo: 'Reparo elétrico',
        profissional: 'Eletro Fix',
        data: '18 Abr 2026',
        preco: 'R$ 200,00',
        status: 'concluido',
        avaliacao: 4.5
    },
    {
        id: 3,
        titulo: 'Montagem de guarda-roupa',
        profissional: 'Montagem Express',
        data: '15 Abr 2026',
        preco: 'R$ 180,00',
        status: 'concluido',
        avaliacao: 5.0
    },
    {
        id: 4,
        titulo: 'Limpeza pós-obra',
        profissional: 'Clean House Pro',
        data: '12 Abr 2026',
        preco: 'R$ 350,00',
        status: 'concluido',
        avaliacao: null
    },
    {
        id: 5,
        titulo: 'Instalação de ar-condicionado',
        profissional: 'Frio Total',
        data: '10 Abr 2026',
        preco: 'R$ 450,00',
        status: 'andamento',
        avaliacao: null
    },
    {
        id: 6,
        titulo: 'Desentupimento de pia',
        profissional: 'Desentupidora Rápida',
        data: '05 Abr 2026',
        preco: 'R$ 120,00',
        status: 'cancelado',
        avaliacao: null
    }
];

let filtroAtual = 'todos';

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

// ========== RENDERIZAR PEDIDOS ==========
function renderPedidos(lista) {
    const container = document.getElementById('pedidosList');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-light);">
                <p style="font-size:1.2rem;">Nenhum pedido encontrado</p>
                <p style="font-size:0.9rem;margin-top:0.5rem;">Você ainda não tem pedidos nesta categoria</p>
            </div>
        `;
        return;
    }

    lista.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';

        // Montar avaliação
        let avaliacaoHtml = '';
        if (pedido.avaliacao !== null) {
            const estrelas = Math.round(pedido.avaliacao);
            let estrelasHtml = '';
            for (let i = 1; i <= 5; i++) {
                estrelasHtml += `<span class="star${i <= estrelas ? '' : ' empty'}">★</span>`;
            }
            avaliacaoHtml = `
                <div class="pedido-avaliacao">
                    <div class="stars">${estrelasHtml}</div>
                    <span class="avaliacao-nota">${pedido.avaliacao}</span>
                </div>
            `;
        } else {
            avaliacaoHtml = `
                <div class="pedido-avaliacao">
                    <span class="sem-avaliacao">Aguardando avaliação</span>
                </div>
            `;
        }

        // Mapear status para classe CSS
        const statusClass = `status-${pedido.status}`;
        const statusLabel = {
            'concluido': 'Concluído',
            'andamento': 'Em andamento',
            'cancelado': 'Cancelado'
        }[pedido.status] || pedido.status;

        card.innerHTML = `
            <div class="pedido-info">
                <div class="pedido-titulo">${pedido.titulo}</div>
                <div class="pedido-profissional"><strong>${pedido.profissional}</strong></div>
                <div class="pedido-data">${pedido.data}</div>
                ${avaliacaoHtml}
            </div>
            <div class="pedido-right">
                <div class="pedido-preco">${pedido.preco}</div>
                <span class="pedido-status ${statusClass}">${statusLabel}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// ========== FILTRAR PEDIDOS ==========
function filtrarPedidos(filtro) {
    filtroAtual = filtro;
    let listaFiltrada = [];

    switch (filtro) {
        case 'todos':
            listaFiltrada = pedidos;
            break;
        case 'concluidos':
            listaFiltrada = pedidos.filter(p => p.status === 'concluido');
            break;
        case 'andamento':
            listaFiltrada = pedidos.filter(p => p.status === 'andamento');
            break;
        case 'cancelados':
            listaFiltrada = pedidos.filter(p => p.status === 'cancelado');
            break;
        default:
            listaFiltrada = pedidos;
    }

    renderPedidos(listaFiltrada);

    // Atualizar botões ativos
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filtro === filtro);
    });
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
    renderPedidos(pedidos);
    configurarModoEscuro();
    configurarSidebar();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    // Filtros
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarPedidos(btn.dataset.filtro);
        });
    });
});