
// Dados de demonstração desta tela. titulo/descricao/tempo não ficam mais
// fixos em português: são remontados em montarTextosNotificacao() a partir
// de tituloKey (chave do dicionário) e descType/dados/tempoValor+tempoUnidade,
// pra funcionar nos dois idiomas.
const notificacoes = [
    {
        id: 1,
        tipo: 'message',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
        tituloKey: 'notificacoes.tituloNovaMensagem',
        descType: 'mensagem',
        dados: { nome: 'LimpaMais Serviços' },
        tempoValor: 5,
        tempoUnidade: 'min',
        lida: false
    },
    {
        id: 2,
        tipo: 'payment',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
        tituloKey: 'notificacoes.tituloPagamentoConfirmado',
        descType: 'pagamento',
        dados: { valor: 'R$ 150,00' },
        tempoValor: 2,
        tempoUnidade: 'hora',
        lida: false
    },
    {
        id: 3,
        tipo: 'star',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 6 6.5 1-4.7 4.6L18 20l-6-3.2L6 20l1.2-6.4L2.5 9l6.5-1 3-6Z"/></svg>',
        tituloKey: 'notificacoes.tituloAvalieServico',
        descType: 'avaliar',
        dados: { empresa: 'Clean House Pro' },
        tempoValor: 1,
        tempoUnidade: 'dia',
        lida: true
    },
    {
        id: 4,
        tipo: 'check',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        tituloKey: 'notificacoes.tituloServicoConcluido',
        descType: 'concluido',
        dados: {},
        tempoValor: 2,
        tempoUnidade: 'dia',
        lida: true
    },
    {
        id: 5,
        tipo: 'message',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
        tituloKey: 'notificacoes.tituloNovaMensagem',
        descType: 'mensagem',
        dados: { nome: 'João Silva' },
        tempoValor: 3,
        tempoUnidade: 'dia',
        lida: true
    },
    {
        id: 6,
        tipo: 'payment',
        icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
        tituloKey: 'notificacoes.tituloCreditoAdicionado',
        descType: 'credito',
        dados: { valor: 'R$ 500,00' },
        tempoValor: 5,
        tempoUnidade: 'dia',
        lida: true
    }
];

// Monta a descrição (com o dado variável, tipo nome/valor/empresa, no meio
// da frase) no idioma atual.
function montarDescricaoNotificacao(idioma, descType, dados) {
    switch (descType) {
        case 'mensagem':
            return idioma === 'en' ? `${dados.nome} sent you a message` : `${dados.nome} enviou uma mensagem`;
        case 'pagamento':
            return idioma === 'en' ? `Payment of ${dados.valor} was processed` : `Pagamento de ${dados.valor} foi processado`;
        case 'avaliar':
            return idioma === 'en' ? `Rate the service from ${dados.empresa}` : `Avalie o serviço da ${dados.empresa}`;
        case 'concluido':
            return traduzirCliente('notificacoes.descServicoConcluido');
        case 'credito':
            return idioma === 'en' ? `${dados.valor} was added to your account` : `${dados.valor} foram adicionados à sua conta`;
        default:
            return '';
    }
}

// Monta o "há X min/horas/dias" no idioma atual a partir do valor/unidade
// fixos de cada notificação de demonstração.
function formatarTempoDemo(valor, unidade, idioma) {
    if (unidade === 'min') {
        return idioma === 'en' ? `${valor} min ago` : `${valor} min atrás`;
    }
    if (unidade === 'hora') {
        return idioma === 'en'
            ? `${valor} hour${valor !== 1 ? 's' : ''} ago`
            : `${valor} hora${valor !== 1 ? 's' : ''} atrás`;
    }
    if (unidade === 'dia') {
        return idioma === 'en'
            ? `${valor} day${valor !== 1 ? 's' : ''} ago`
            : `${valor} dia${valor !== 1 ? 's' : ''} atrás`;
    }
    return '';
}

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

function renderNotificacoes() {
    const idioma = window.facosClienteIdiomaAtual ? facosClienteIdiomaAtual() : 'pt';
    const container = document.getElementById('notifList');
    container.innerHTML = '';

    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div class="notif-empty">
                <p style="font-size:1.2rem;" data-i18n="notificacoes.nenhumaNotificacao">${traduzirCliente('notificacoes.nenhumaNotificacao')}</p>
                <p style="font-size:0.9rem;margin-top:0.5rem;" data-i18n="notificacoes.emDiaPorAqui">${traduzirCliente('notificacoes.emDiaPorAqui')}</p>
            </div>
        `;
    } else {
        notificacoes.forEach(notif => {
            const card = document.createElement('div');
            card.className = `notif-card${notif.lida ? '' : ' unread'}`;
            card.dataset.id = notif.id;

            const titulo = traduzirCliente(notif.tituloKey);
            const descricao = montarDescricaoNotificacao(idioma, notif.descType, notif.dados);
            const tempo = formatarTempoDemo(notif.tempoValor, notif.tempoUnidade, idioma);

            card.innerHTML = `
                <div class="notif-body">
                    <div class="notif-title">${titulo}</div>
                    <div class="notif-desc">${descricao}</div>
                    <div class="notif-time">${tempo}</div>
                </div>
                ${notif.lida ? '' : '<div class="notif-dot"></div>'}
            `;

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

function atualizarBannerNaoLidas() {
    const banner = document.getElementById('unreadBanner');
    const countEl = document.getElementById('unreadCount');
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    countEl.textContent = naoLidas;
    banner.classList.toggle('hidden', naoLidas === 0);
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
            // Título/descrição/"há X" são montados na hora a partir dos
            // dados de demonstração, então refaz a lista pra atualizar.
            renderNotificacoes();
        });
    }
}

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
