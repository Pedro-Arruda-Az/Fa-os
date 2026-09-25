
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
        window.location.href = '/Auth/login.html';
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
    const idioma = facosIdiomaAtual();
    const data = new Date(isoString);
    const diffMin = Math.floor((new Date() - data) / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return idioma === 'en' ? 'Now' : 'Agora';
    if (diffMin < 60) return idioma === 'en' ? `${diffMin} min ago` : `${diffMin} min atrás`;
    if (diffHoras < 24) return idioma === 'en' ? `${diffHoras}h ago` : `${diffHoras}h atrás`;
    if (diffDias === 1) return idioma === 'en' ? 'Yesterday' : 'Ontem';
    return idioma === 'en' ? `${diffDias} days ago` : `${diffDias} dias atrás`;
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
        grid.innerHTML = `<p class="notif-linha-vazio" data-i18n="dashboard.semNotificacoes">${traduzirProfissional('dashboard.semNotificacoes')}</p>`;
        return;
    }

    lista.forEach((notif) => {
        const icone = ICONE_POR_TIPO[notif.tipo] || ICONE_POR_TIPO.sistema;
        const link = LINK_POR_TIPO[notif.tipo];

        const linha = document.createElement('div');
        linha.className = `atendimento-linha notif-linha${!notif.lida ? ' nao-lida' : ''}`;
        linha.dataset.id = notif.id;
        linha.style.cursor = 'pointer';

        linha.innerHTML = `
            <span class="card-icone-circulo notif-icone-linha">${icone}</span>
            <div class="atendimento-info">
                <strong>${notif.titulo}</strong>
                <span>${notif.descricao || ''}</span>
            </div>
            <span class="notif-tempo-linha">${formatarTempoRelativo(notif.criado_em)}</span>
        `;

        linha.addEventListener('click', async () => {
            if (!notif.lida && supabaseClient) {
                await supabaseClient
                    .from('notificacoes_app')
                    .update({ lida: true })
                    .eq('id', notif.id);
            }
            if (link) {
                window.location.href = link;
            }
        });

        grid.appendChild(linha);
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

function ehHoje(dataIso) {
    if (!dataIso) return false;
    const data = new Date(dataIso);
    const hoje = new Date();
    return data.getFullYear() === hoje.getFullYear()
        && data.getMonth() === hoje.getMonth()
        && data.getDate() === hoje.getDate();
}

// Busca os pedidos reais do profissional (mesmo endpoint usado na tela de
// Pedidos) e soma os de hoje pra preencher o card "Resumo do dia" — nada
// de número fixo: conforme mais gente contrata e paga o serviço dele ao
// longo do dia, o total de atendimentos e a previsão de ganhos crescem.
// Pedidos cancelados não entram na conta.
async function carregarResumoDoDia() {
    const elAtendimentos = document.getElementById('resumoAtendimentos');
    const elValor = document.getElementById('resumoValor');
    if ((!elAtendimentos && !elValor) || !profissionalAtual || !profissionalAtual.email) return;

    let pedidos = [];
    try {
        const resposta = await fetch(`/api/pedidos-profissional?email=${encodeURIComponent(profissionalAtual.email)}`);
        if (!resposta.ok) return;
        const dados = await resposta.json();
        pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
    } catch (err) {
        console.error('Não foi possível carregar o resumo do dia:', err);
        return;
    }

    const pedidosDeHoje = pedidos.filter((p) => p.status !== 'cancelado' && ehHoje(p.criado_em));
    const totalGanhos = pedidosDeHoje.reduce((soma, p) => soma + (Number(p.valor) || 0), 0);

    if (elAtendimentos) elAtendimentos.textContent = String(pedidosDeHoje.length);
    if (elValor) {
        elValor.textContent = `R$ ${totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
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
        carregarResumoDoDia();
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
        document.querySelectorAll('img[src*="/imagens/icones-claro/"], img[src*="/imagens/icones-escuro/"]').forEach((img) => {
            if (img.id === 'modoClaroIcone' || img.id === 'avatarIconeHeader') return;
            img.src = claro
                ? img.src.replace('/icones-escuro/', '/icones-claro/')
                : img.src.replace('/icones-claro/', '/icones-escuro/');
        });
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
            if (confirm(traduzirProfissional('dashboard.confirmarSair'))) {
                fazerLogout();
            }
        });
    }

    // O botão de ajuda já é tratado pelo Buzz (Buzz/buzz.js), que abre
    // o chat de suporte de verdade — não precisa de handler aqui.
});
