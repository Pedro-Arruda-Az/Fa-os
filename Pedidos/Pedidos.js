/* ============================================================
   FAÇOS - Pedidos.js
   Página de histórico de pedidos (dados reais do Supabase)
   ============================================================ */

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let usuario = null;
let pedidos = [];
let filtroAtual = 'todos';

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

// ========== BUSCAR PEDIDOS REAIS ==========
async function buscarPedidos(email) {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('pedidos')
        .select('*')
        .eq('usuario_email', email)
        .order('criado_em', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
        titulo: p.titulo,
        profissional: p.profissional,
        data: new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''),
        preco: `R$ ${Number(p.valor).toFixed(2).replace('.', ',')}`,
        status: p.status,
        avaliacao: p.avaliacao !== null && p.avaliacao !== undefined ? Number(p.avaliacao) : null
    }));
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
        const statusClass = `status-${pedido.status === 'em_andamento' ? 'andamento' : pedido.status}`;
        const statusLabel = {
            'concluido': 'Concluído',
            'em_andamento': 'Em andamento',
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
            listaFiltrada = pedidos.filter(p => p.status === 'em_andamento');
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
        darkModeToggle.textContent = 'Modo claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? 'Modo claro' : 'Modo escuro';
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
document.addEventListener('DOMContentLoaded', async () => {
    usuario = verificarLogin();
    if (!usuario) return;

    configurarModoEscuro();
    configurarSidebar();

    pedidos = await buscarPedidos(usuario.email);
    filtrarPedidos('todos');

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    // Filtros
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarPedidos(btn.dataset.filtro);
        });
    });
});
