
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let usuario = null;
let pedidos = [];
let filtroAtual = 'todos';

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

async function buscarPedidos(email) {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('pedidos')
        .select('*')
        .eq('usuario_email', email)
        .order('criado_em', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        profissional: p.profissional,
        profissionalEmail: p.profissional_email || null,
        data: formatarDataPedido(p.criado_em),
        criadoEmISO: p.criado_em,
        preco: `R$ ${Number(p.valor).toFixed(2).replace('.', ',')}`,
        status: p.status,
        avaliacao: p.avaliacao !== null && p.avaliacao !== undefined ? Number(p.avaliacao) : null
    }));
}

function formatarDataPedido(isoString) {
    const idioma = facosClienteIdiomaAtual();
    const locale = idioma === 'en' ? 'en-US' : 'pt-BR';
    return new Date(isoString).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

function renderPedidos(lista) {
    const container = document.getElementById('pedidosList');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-light);">
                <p style="font-size:1.2rem;" data-i18n="pedidos.nenhumPedido">${traduzirCliente('pedidos.nenhumPedido')}</p>
                <p style="font-size:0.9rem;margin-top:0.5rem;" data-i18n="pedidos.semPedidosCategoria">${traduzirCliente('pedidos.semPedidosCategoria')}</p>
            </div>
        `;
        return;
    }

    lista.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';

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
        } else if (pedido.status === 'concluido') {
            avaliacaoHtml = `
                <div class="pedido-avaliacao">
                    <span class="sem-avaliacao" data-i18n="pedidos.aguardandoAvaliacao">${traduzirCliente('pedidos.aguardandoAvaliacao')}</span>
                    <button type="button" class="btn-avaliar-pedido" data-pedido-id="${pedido.id}" data-i18n="pedidos.avaliar">${traduzirCliente('pedidos.avaliar')}</button>
                </div>
            `;
        } else {
            avaliacaoHtml = '';
        }

        const statusClass = `status-${pedido.status === 'em_andamento' ? 'andamento' : pedido.status}`;
        const statusKey = {
            'concluido': 'pedidos.status.concluido',
            'em_andamento': 'pedidos.status.emAndamento',
            'cancelado': 'pedidos.status.cancelado'
        }[pedido.status];
        const statusLabel = statusKey ? traduzirCliente(statusKey) : pedido.status;

        card.innerHTML = `
            <div class="pedido-info">
                <div class="pedido-titulo">${pedido.titulo}</div>
                <div class="pedido-profissional"><strong>${pedido.profissional}</strong></div>
                <div class="pedido-data">${pedido.data}</div>
                ${avaliacaoHtml}
            </div>
            <div class="pedido-right">
                <div class="pedido-preco">${pedido.preco}</div>
                <span class="pedido-status ${statusClass}"${statusKey ? ` data-i18n="${statusKey}"` : ''}>${statusLabel}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// ===== Modal de avaliação do profissional (estilo Uber) =====

let pedidoEmAvaliacao = null;
let notaEmAvaliacao = 0;
const motivosSelecionados = new Set();

function elementosModalAvaliacao() {
    return {
        overlay: document.getElementById('avaliacaoModalOverlay'),
        nome: document.getElementById('avaliacaoModalNome'),
        estrelas: document.querySelectorAll('#avaliacaoModalEstrelas .avaliacao-estrela'),
        blocoMotivos: document.getElementById('avaliacaoModalMotivos'),
        chips: document.querySelectorAll('#avaliacaoChips .avaliacao-chip'),
        textarea: document.getElementById('avaliacaoOutrosMotivos'),
        btnEnviar: document.getElementById('avaliacaoModalEnviar')
    };
}

function abrirModalAvaliacao(pedido) {
    pedidoEmAvaliacao = pedido;
    notaEmAvaliacao = 0;
    motivosSelecionados.clear();

    const el = elementosModalAvaliacao();
    el.nome.textContent = pedido.profissional;
    el.textarea.value = '';
    el.blocoMotivos.hidden = true;
    el.chips.forEach((chip) => chip.classList.remove('selecionado'));
    atualizarEstrelasVisual(0);
    el.btnEnviar.disabled = true;

    el.overlay.classList.add('open');
}

function fecharModalAvaliacao() {
    const el = elementosModalAvaliacao();
    el.overlay.classList.remove('open');
    pedidoEmAvaliacao = null;
}

function atualizarEstrelasVisual(nota) {
    const el = elementosModalAvaliacao();
    el.estrelas.forEach((estrela) => {
        const valor = Number(estrela.dataset.valor);
        estrela.classList.toggle('selecionada', valor <= nota);
    });
}

function escolherNota(nota) {
    notaEmAvaliacao = nota;
    atualizarEstrelasVisual(nota);

    const el = elementosModalAvaliacao();
    el.blocoMotivos.hidden = nota > 3 || nota === 0;
    el.btnEnviar.disabled = false;
}

async function enviarAvaliacao() {
    if (!pedidoEmAvaliacao || notaEmAvaliacao === 0 || !usuario) return;

    const el = elementosModalAvaliacao();
    const textoOriginal = el.btnEnviar.textContent;
    el.btnEnviar.disabled = true;
    el.btnEnviar.textContent = traduzirCliente('pedidos.enviandoAvaliacao');

    try {
        const resposta = await fetch('/api/avaliar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pedidoId: pedidoEmAvaliacao.id,
                usuarioEmail: usuario.email,
                nota: notaEmAvaliacao,
                motivos: Array.from(motivosSelecionados),
                comentario: el.textarea.value
            })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            alert(resultado.error || traduzirCliente('pedidos.erroAvaliacao'));
            return;
        }

        const pedidoAtualizado = pedidos.find((p) => p.id === pedidoEmAvaliacao.id);
        if (pedidoAtualizado) pedidoAtualizado.avaliacao = notaEmAvaliacao;

        fecharModalAvaliacao();
        filtrarPedidos(filtroAtual);
    } catch (err) {
        console.error(err);
        alert(traduzirCliente('pedidos.erroAvaliacao'));
    } finally {
        el.btnEnviar.disabled = false;
        el.btnEnviar.textContent = textoOriginal;
    }
}

function configurarModalAvaliacao() {
    const el = elementosModalAvaliacao();

    document.getElementById('pedidosList').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-avaliar-pedido');
        if (!btn) return;
        const pedido = pedidos.find((p) => p.id === btn.dataset.pedidoId);
        if (pedido) abrirModalAvaliacao(pedido);
    });

    el.estrelas.forEach((estrela) => {
        estrela.addEventListener('click', () => escolherNota(Number(estrela.dataset.valor)));
        estrela.addEventListener('mouseenter', () => atualizarEstrelasVisual(Number(estrela.dataset.valor)));
    });
    document.getElementById('avaliacaoModalEstrelas').addEventListener('mouseleave', () => {
        atualizarEstrelasVisual(notaEmAvaliacao);
    });

    el.chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const motivo = chip.dataset.motivo;
            if (motivosSelecionados.has(motivo)) {
                motivosSelecionados.delete(motivo);
                chip.classList.remove('selecionado');
            } else {
                motivosSelecionados.add(motivo);
                chip.classList.add('selecionado');
            }
        });
    });

    document.getElementById('avaliacaoModalClose').addEventListener('click', fecharModalAvaliacao);
    el.overlay.addEventListener('click', (e) => {
        if (e.target === el.overlay) fecharModalAvaliacao();
    });
    el.btnEnviar.addEventListener('click', enviarAvaliacao);
}

// ===== Conclusão automática de pedidos "em andamento" após 30s =====
// (assim a empresa consegue avaliar o profissional sem precisar
// esperar ele marcar o serviço como concluído manualmente)

const TEMPO_PARA_CONCLUIR_MS = 30_000;

async function concluirPedidoAutomaticamente(pedido) {
    if (!usuario || pedido.status !== 'em_andamento') return;

    try {
        const resposta = await fetch('/api/concluir-pedido-automatico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedidoId: pedido.id, usuarioEmail: usuario.email })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (resposta.ok && resultado.ok) {
            pedido.status = 'concluido';
            filtrarPedidos(filtroAtual);
        }
    } catch (err) {
        console.error('Erro ao concluir pedido automaticamente:', err);
    }
}

function agendarConclusoesAutomaticas() {
    pedidos.forEach((pedido) => {
        if (pedido.status !== 'em_andamento' || !pedido.criadoEmISO) return;

        const decorrido = Date.now() - new Date(pedido.criadoEmISO).getTime();
        const restante = Math.max(TEMPO_PARA_CONCLUIR_MS - decorrido, 0);

        setTimeout(() => concluirPedidoAutomaticamente(pedido), restante);
    });
}

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

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filtro === filtro);
    });
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
        const modoClaroIcone = document.getElementById('modoClaroIcone');
        if (modoClaroIcone) {
            modoClaroIcone.src = escuro
                ? '/imagens/icones-escuro/modo-claro-sol.png'
                : '/imagens/icones-escuro/modo-escuro-lua.png';
        }

        const logo = document.querySelector('img[src*="upscalemedia-transformed"], img[src*="facos-logo-completo"]');
        if (logo) {
            logo.src = escuro
                ? '/imagens/facos-logo-completo.png'
                : '/imagens/upscalemedia-transformed.png';
        }

        document.querySelectorAll('img[src*="/imagens/icones-claro/"], img[src*="/imagens/icones-escuro/"]').forEach((img) => {
            if (img.id === 'modoClaroIcone') return;
            img.src = escuro
                ? img.src.replace('/icones-claro/', '/icones-escuro/')
                : img.src.replace('/icones-escuro/', '/icones-claro/');
        });
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

document.addEventListener('DOMContentLoaded', async () => {
    usuario = verificarLogin();
    if (!usuario) return;

    configurarModoEscuro();
    configurarMenuConfiguracoes();
    configurarModalAvaliacao();

    pedidos = await buscarPedidos(usuario.email);
    filtrarPedidos('todos');
    agendarConclusoesAutomaticas();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrarPedidos(btn.dataset.filtro);
        });
    });
});
