
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let profissionalAtual = null;

function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

function carregarDados() {
    const profissional = verificarLogin();
    if (!profissional) return;

    const nomeElement = document.getElementById('empresaNome');
    if (nomeElement) {
        nomeElement.textContent = profissional.nome_empresa || 'Profissional';
    }
}

const ICONE_POR_TIPO = {
    mensagem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    pagamento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2.2 3 2.5c1.7.3 3 1.1 3 2.5s-1.3 2.5-3 2.5-3-1.1-3-2.5"/></svg>',
    sistema: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};

const LINK_POR_TIPO = {
    mensagem: '/Profissional/mensagens.html',
    pagamento: '/Profissional/carteira.html',
    sistema: null
};

function formatarTempoRelativo(isoString) {
    const data = new Date(isoString);
    const diffMin = Math.floor((new Date() - data) / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return 'Ontem';
    return `${diffDias} dias atrás`;
}

async function carregarUltimasNotificacoes() {
    const grid = document.getElementById('ultimasNotifGrid');
    if (!grid || !supabaseClient || !profissionalAtual) return;

    const { data, error } = await supabaseClient
        .from('notificacoes_app')
        .select('*')
        .eq('destinatario_email', profissionalAtual.email)
        .eq('destinatario_tipo', 'profissional')
        .order('criado_em', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Erro ao buscar últimas notificações:', error);
        return;
    }

    renderUltimasNotificacoes(data || []);
}

function renderUltimasNotificacoes(lista) {
    const grid = document.getElementById('ultimasNotifGrid');
    grid.innerHTML = '';

    if (lista.length === 0) {
        grid.innerHTML = `<p class="ultima-notif-vazio">Nenhuma notificação ainda.</p>`;
        return;
    }

    lista.forEach((notif) => {
        const icone = ICONE_POR_TIPO[notif.tipo] || ICONE_POR_TIPO.sistema;
        const link = LINK_POR_TIPO[notif.tipo];

        const card = document.createElement('div');
        card.className = `ultima-notif-card${!notif.lida ? ' nao-lida' : ''}`;
        card.dataset.id = notif.id;

        card.innerHTML = `
            <span class="ultima-notif-icone">${icone}</span>
            <div class="ultima-notif-corpo">
                <div class="ultima-notif-textos">
                    <span class="ultima-notif-titulo">${notif.titulo}</span>
                    <span class="ultima-notif-texto">${notif.descricao || ''}</span>
                </div>
                <span class="ultima-notif-tempo">${formatarTempoRelativo(notif.criado_em)}</span>
            </div>
        `;

        card.addEventListener('click', async () => {
            if (!notif.lida && supabaseClient) {
                await supabaseClient
                    .from('notificacoes_app')
                    .update({ lida: true })
                    .eq('id', notif.id);
            }
            if (link) {
                window.location.href = link;
            } else {
                card.classList.remove('nao-lida');
            }
        });

        grid.appendChild(card);
    });
}

function escutarUltimasNotificacoesEmTempoReal() {
    if (!supabaseClient || !profissionalAtual) return;

    supabaseClient
        .channel(`ultimas-notif-${profissionalAtual.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notificacoes_app',
            filter: `destinatario_email=eq.${profissionalAtual.email}`
        }, () => carregarUltimasNotificacoes())
        .subscribe();
}

function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    profissionalAtual = verificarLogin();

    if (profissionalAtual) {
        carregarUltimasNotificacoes();
        escutarUltimasNotificacoesEmTempoReal();
    }

    const configBtn = document.getElementById('configBtn');
    const configMenu = document.getElementById('configMenu');

    if (configBtn && configMenu) {
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
    }

    const modoClaroBtn = document.getElementById('modoClaroBtn');
    const modoClaroLabel = document.getElementById('modoClaroLabel');

    function aplicarModo(claro) {
        document.documentElement.classList.toggle('light-mode', claro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', claro ? 'menu.modoEscuro' : 'menu.modoClaro');
            if (window.facosAplicarIdioma) facosAplicarIdioma();
        }
        const modoClaroIcone = document.getElementById('modoClaroIcone');
        if (modoClaroIcone) {
            modoClaroIcone.src = claro
                ? '/imagens/icones-escuro/modo-escuro-lua.png'
                : '/imagens/icones-escuro/modo-claro-sol.png';
        }
    }

    if (localStorage.getItem('painelModoClaro') === 'true') {
        aplicarModo(true);
    }

    if (modoClaroBtn) {
        modoClaroBtn.addEventListener('click', function () {
            const claro = !document.documentElement.classList.contains('light-mode');
            aplicarModo(claro);
            localStorage.setItem('painelModoClaro', claro ? 'true' : 'false');
        });
    }

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosTrocarIdioma) facosTrocarIdioma();
        });
    }

    const sairBtn = document.getElementById('sairBtn');
    if (sairBtn) {
        sairBtn.addEventListener('click', function () {
            if (confirm('Deseja sair do painel profissional?')) {
                fazerLogout();
            }
        });
    }

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', function () {
            alert('Precisa de ajuda? Em breve você poderá falar com nosso suporte por aqui.');
        });
    }
});
