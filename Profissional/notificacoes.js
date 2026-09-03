
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let profissionalAtual = null;
let notificacoes = [];
let filtroAtivo = null;

function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
        return null;
    }
    return JSON.parse(profissional);
}

const CONFIG_TIPO = {
    pagamento: {
        dataTipo: 'pagamentos',
        iconeNaoLido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2.2 3 2.5c1.7.3 3 1.1 3 2.5s-1.3 2.5-3 2.5-3-1.1-3-2.5"/></svg>',
        classeIcone: 'icon-pagamento',
        classeIconeLido: 'icon-pagamento-lido',
        classeCard: 'notif-pagamento',
        link: '/Profissional/carteira.html',
        linkTexto: 'Ver detalhes'
    },
    mensagem: {
        dataTipo: 'mensagens',
        iconeNaoLido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
        classeIcone: 'icon-mensagem',
        classeIconeLido: 'icon-mensagem',
        classeCard: 'notif-mensagem',
        link: '/Profissional/mensagens.html',
        linkTexto: 'Ver mensagem'
    },
    sistema: {
        dataTipo: 'lembretes',
        iconeNaoLido: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        classeIcone: 'icon-lembrete',
        classeIconeLido: 'icon-lembrete-lido',
        classeCard: 'notif-lembrete',
        link: null,
        linkTexto: null
    }
};

function formatarTempoRelativo(isoString) {
    const data = new Date(isoString);
    const agora = new Date();
    const diffMin = Math.floor((agora - data) / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias === 1) return 'Ontem';
    return `${diffDias} dias`;
}

async function buscarNotificacoes() {
    if (!supabaseClient || !profissionalAtual) return [];

    const { data, error } = await supabaseClient
        .from('notificacoes_app')
        .select('*')
        .eq('destinatario_email', profissionalAtual.email)
        .eq('destinatario_tipo', 'profissional')
        .order('criado_em', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
    }

    return data || [];
}

function criarCard(notif) {
    const cfg = CONFIG_TIPO[notif.tipo] || CONFIG_TIPO.sistema;

    const card = document.createElement('div');
    card.className = `notif-card${!notif.lida ? ` ${cfg.classeCard} is-unread` : ''}`;
    card.dataset.id = notif.id;
    card.dataset.tipo = cfg.dataTipo;

    const linkHtml = (cfg.link && !notif.lida)
        ? `<a href="${cfg.link}" class="notif-link">${cfg.linkTexto}</a>`
        : '';

    card.innerHTML = `
        <span class="notif-icon ${notif.lida ? cfg.classeIconeLido : cfg.classeIcone}">
            ${cfg.iconeNaoLido}
        </span>
        <div class="notif-corpo">
            <div class="notif-topo">
                <span class="notif-titulo">${notif.titulo}</span>
                <span class="notif-tempo">${formatarTempoRelativo(notif.criado_em)}</span>
            </div>
            <p class="notif-texto">${notif.descricao || ''}</p>
            ${linkHtml}
        </div>
    `;

    return card;
}

function renderNotificacoes(lista) {
    const containerNovas = document.getElementById('notifNovas');
    const containerAnteriores = document.getElementById('notifAnteriores');

    containerNovas.innerHTML = '';
    containerAnteriores.innerHTML = '';

    const naoLidas = lista.filter(n => !n.lida);
    const lidas = lista.filter(n => n.lida);

    if (naoLidas.length === 0) {
        containerNovas.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;padding:0.5rem 0;">Nenhuma notificação nova.</p>`;
    } else {
        naoLidas.forEach(n => containerNovas.appendChild(criarCard(n)));
    }

    if (lidas.length === 0) {
        containerAnteriores.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;padding:0.5rem 0;">Nada por aqui ainda.</p>`;
    } else {
        lidas.slice(0, 20).forEach(n => containerAnteriores.appendChild(criarCard(n)));
    }

    configurarLinksNotif();
    atualizarResumo(lista);
}

function atualizarResumo(lista) {
    const naoLidas = lista.filter(n => !n.lida).length;

    document.getElementById('resumoNovas').textContent = naoLidas;
    document.getElementById('resumoNaoLidas').textContent = naoLidas;
    document.getElementById('resumoTotal').textContent = lista.length;
}

async function marcarTodasComoLidas() {
    const idsNaoLidos = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (idsNaoLidos.length === 0) return;

    notificacoes.forEach(n => { n.lida = true; });
    renderNotificacoes(notificacoes);

    if (supabaseClient) {
        await supabaseClient
            .from('notificacoes_app')
            .update({ lida: true })
            .in('id', idsNaoLidos);
    }
}

function configurarLinksNotif() {
    document.querySelectorAll('.notif-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const card = link.closest('.notif-card');
            if (!card) return;
            const id = card.dataset.id;
            const notif = notificacoes.find(n => n.id === id);
            const destino = link.getAttribute('href');

            if (notif && !notif.lida) {
                notif.lida = true;
                if (supabaseClient) {
                    await supabaseClient.from('notificacoes_app').update({ lida: true }).eq('id', id);
                }
                renderNotificacoes(notificacoes);
            }

            if (destino) window.location.href = destino;
        });
    });
}

function configurarPreferencias() {
    document.querySelectorAll('.pref-check').forEach(check => {
        check.addEventListener('change', () => {
            const tipo = check.dataset.pref;
            const ligado = check.checked;

            document.querySelectorAll(`.notif-card[data-tipo="${tipo}"]`).forEach(card => {
                card.style.display = ligado ? '' : 'none';
            });
        });
    });
}

function aplicarFiltro(filtro) {
    const botoes = document.querySelectorAll('.filtro-rapido-btn');
    const cards = document.querySelectorAll('.notif-card');

    if (filtroAtivo === filtro) {
        filtroAtivo = null;
        botoes.forEach(b => b.classList.remove('active'));
        cards.forEach(c => c.classList.remove('hidden'));
        return;
    }

    filtroAtivo = filtro;
    botoes.forEach(b => b.classList.toggle('active', b.dataset.filtro === filtro));

    cards.forEach(card => {
        let mostrar = true;
        if (filtro === 'nao-lidas') {
            mostrar = card.classList.contains('is-unread');
        } else {
            mostrar = card.dataset.tipo === filtro;
        }
        card.classList.toggle('hidden', !mostrar);
    });
}

function configurarFiltrosRapidos() {
    document.querySelectorAll('.filtro-rapido-btn').forEach(btn => {
        btn.addEventListener('click', () => aplicarFiltro(btn.dataset.filtro));
    });
}

function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/index.html';
}

function escutarNotificacoesEmTempoReal() {
    if (!supabaseClient || !profissionalAtual) return;

    supabaseClient
        .channel(`notificacoes-profissional-${profissionalAtual.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notificacoes_app',
            filter: `destinatario_email=eq.${profissionalAtual.email}`
        }, async () => {
            notificacoes = await buscarNotificacoes();
            renderNotificacoes(notificacoes);
        })
        .subscribe();
}

document.addEventListener('DOMContentLoaded', async () => {
    profissionalAtual = verificarLogin();
    if (!profissionalAtual) return;

    configurarPreferencias();
    configurarFiltrosRapidos();

    const marcarLidasBtn = document.getElementById('marcarLidasBtn');
    if (marcarLidasBtn) {
        marcarLidasBtn.addEventListener('click', marcarTodasComoLidas);
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

    notificacoes = await buscarNotificacoes();
    renderNotificacoes(notificacoes);
    escutarNotificacoesEmTempoReal();
});
