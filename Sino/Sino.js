const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentUser = null;
let notificacoes = [];


function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}


function formatarTempoRelativo(isoString) {
    const data = new Date(isoString);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras} hora${diffHoras !== 1 ? 's' : ''} atrás`;
    if (diffDias === 1) return 'Ontem';
    return `${diffDias} dias atrás`;
}


async function buscarNotificacoes() {
    if (!supabaseClient || !currentUser) return [];

    const { data, error } = await supabaseClient
        .from('notificacoes_app')
        .select('*')
        .eq('destinatario_email', currentUser.email)
        .eq('destinatario_tipo', 'cliente')
        .order('criado_em', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
    }

    return data || [];
}


function renderNotificacoes(lista) {
    const container = document.getElementById('notificacoesList');
    container.innerHTML = '';

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
                <div class="notificacao-descricao">${notif.descricao || ''}</div>
                <div class="notificacao-tempo">${formatarTempoRelativo(notif.criado_em)}</div>
            </div>
            <div class="notificacao-right">
                ${!notif.lida ? '<div class="unread-dot"></div>' : ''}
            </div>
        `;

        card.addEventListener('click', () => {
            marcarComoLida(notif.id);
        });

        container.appendChild(card);
    });
}


const LINK_POR_TIPO_CLIENTE = {
    mensagem: '/Chat/Chat.html',
    pagamento: '/Pagamentos/Pagamentos.html',
    sistema: null
};


async function marcarComoLida(id) {
    const notif = notificacoes.find(n => n.id === id);
    if (!notif) return;

    if (!notif.lida) {
        notif.lida = true;
        renderNotificacoes(notificacoes);

        if (supabaseClient) {
            await supabaseClient
                .from('notificacoes_app')
                .update({ lida: true })
                .eq('id', id);
        }
    }

    const destino = LINK_POR_TIPO_CLIENTE[notif.tipo];
    if (destino) {
        window.location.href = destino;
    }
}


function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}


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


function escutarNotificacoesEmTempoReal() {
    if (!supabaseClient || !currentUser) return;

    supabaseClient
        .channel(`notificacoes-cliente-${currentUser.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notificacoes_app',
            filter: `destinatario_email=eq.${currentUser.email}`
        }, async () => {
            notificacoes = await buscarNotificacoes();
            renderNotificacoes(notificacoes);
        })
        .subscribe();
}


document.addEventListener('DOMContentLoaded', async () => {
    currentUser = verificarLogin();
    if (!currentUser) return;

    configurarModoEscuro();
    configurarMenuConfiguracoes();
    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    notificacoes = await buscarNotificacoes();
    renderNotificacoes(notificacoes);
    escutarNotificacoesEmTempoReal();
});
