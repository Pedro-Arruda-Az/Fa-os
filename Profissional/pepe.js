
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Auth/login.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// Usamos delegação de evento no container da lista (em vez de um listener
// por botão) porque os pedidos salvos localmente são inseridos depois que
// a página carrega, e assim eles ficam clicáveis sem precisar reconfigurar
// nada.
function configurarBotoes() {
    const lista = document.getElementById('pedidosList');
    if (!lista) return;

    lista.addEventListener('click', function (e) {
        const btnDetalhes = e.target.closest('.btn-detalhes');
        if (btnDetalhes) {
            abrirDetalhesPedido(btnDetalhes.closest('.pedido-card'));
            return;
        }

        const btnComprovante = e.target.closest('.btn-comprovante');
        if (btnComprovante) {
            const nome = btnComprovante.closest('.pedido-card').querySelector('.pedido-nome').textContent;
            const idioma = facosIdiomaAtual();
            alert(idioma === 'en' ? `Receipt for the order from ${nome}` : `Comprovante do pedido de ${nome}`);
        }
    });
}

function textoMetaSemIcone(item) {
    if (!item) return '—';
    let texto = '';
    item.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) texto += node.textContent;
    });
    return texto.trim() || '—';
}

function abrirDetalhesPedido(card) {
    if (!card) return;

    const nome = card.querySelector('.pedido-nome')?.textContent.trim() || '—';
    const servico = card.querySelector('.pedido-servico')?.textContent.trim() || '—';
    const metaItems = card.querySelectorAll('.pedido-meta .meta-item');

    document.getElementById('detalhesPedidoNome').textContent = nome;
    document.getElementById('detalhesPedidoServico').textContent = servico;
    document.getElementById('detalhesPedidoData').textContent = textoMetaSemIcone(metaItems[0]);
    document.getElementById('detalhesPedidoHora').textContent = textoMetaSemIcone(metaItems[1]);
    document.getElementById('detalhesPedidoEndereco').textContent = card.dataset.endereco || traduzirProfissional('pepe.naoInformado');
    document.getElementById('detalhesPedidoObs').textContent = card.dataset.observacoes || traduzirProfissional('pepe.semObservacoes');

    document.getElementById('detalhesPedidoModal').classList.add('open');
}

function fecharDetalhesPedido() {
    const modal = document.getElementById('detalhesPedidoModal');
    if (modal) modal.classList.remove('open');
}

function configurarModalDetalhes() {
    const modal = document.getElementById('detalhesPedidoModal');
    const closeBtn = document.getElementById('detalhesPedidoClose');

    if (closeBtn) closeBtn.addEventListener('click', fecharDetalhesPedido);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) fecharDetalhesPedido();
        });
    }
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function formatarStatusPedido(status) {
    if (status === 'concluido') return { classe: 'status-concluido', chave: 'pepe.statusConcluido' };
    if (status === 'cancelado') return { classe: 'status-cancelado', chave: 'pepe.statusCancelado' };
    return { classe: 'status-andamento', chave: 'pepe.statusAndamento' };
}

// Busca os pedidos reais do profissional logado direto no banco de dados
// (tabela "pedidos" no Supabase, via /api/pedidos-profissional) e desenha
// os cardzinhos na lista, do mais recente pro mais antigo. Não tem mais
// pedidos de demonstração — se ainda não tiver nenhum pedido real, fica
// a mensagem de "Nenhum pedido ainda".
async function carregarPedidosReais(email) {
    const lista = document.getElementById('pedidosList');
    const vazio = document.getElementById('pedidosVazio');
    if (!lista || !email) return;

    let pedidos = [];
    try {
        const resposta = await fetch(`/api/pedidos-profissional?email=${encodeURIComponent(email)}`);
        if (!resposta.ok) return;
        const dados = await resposta.json();
        pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
    } catch (err) {
        console.error('Não foi possível buscar os pedidos:', err);
        return;
    }
    if (!pedidos.length) return;

    if (vazio) vazio.remove();

    const fragment = document.createDocumentFragment();

    pedidos.forEach((pedido) => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.dataset.endereco = pedido.endereco || '';
        card.dataset.observacoes = pedido.observacoes || '';

        const { classe, chave } = formatarStatusPedido(pedido.status);
        const texto = traduzirProfissional(chave);
        const criadoEm = pedido.criado_em ? new Date(pedido.criado_em) : null;
        const data = criadoEm ? criadoEm.toLocaleDateString('pt-BR') : '—';
        const hora = criadoEm ? criadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';

        const valorNumero = Number(pedido.valor);
        const valorTexto = Number.isFinite(valorNumero)
            ? valorNumero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : pedido.valor;

        const nome = pedido.usuario_nome || pedido.usuario_email || traduzirProfissional('mapa.cliente');
        const botaoHtml = pedido.status === 'em_andamento'
            ? `<button class="pedido-btn btn-detalhes" data-i18n="pepe.detalhes">${traduzirProfissional('pepe.detalhes')}</button>`
            : `<button class="pedido-btn btn-comprovante" data-i18n="pepe.verComprovante">${traduzirProfissional('pepe.verComprovante')}</button>`;

        card.innerHTML = `
            <div class="pedido-info">
                <div class="pedido-top">
                    <span class="pedido-nome">${escapeHtml(nome)}</span>
                    <span class="status-badge ${classe}" data-i18n="${chave}">${texto}</span>
                </div>
                <p class="pedido-servico">${escapeHtml(pedido.titulo || traduzirProfissional('mapa.servicoSolicitado'))}</p>
                <div class="pedido-meta">
                    <span class="meta-item"><span class="meta-icon">📅</span>${escapeHtml(data)}</span>
                    <span class="meta-item"><span class="meta-icon">🕐</span>${escapeHtml(hora)}</span>
                </div>
            </div>
            <div class="pedido-valor">
                <span class="valor">${valorTexto ? `R$ ${escapeHtml(valorTexto)}` : ''}</span>
                ${botaoHtml}
            </div>
        `;

        fragment.appendChild(card);
    });

    lista.insertBefore(fragment, lista.firstChild);
}

function configurarMenuConfiguracoes() {
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
            if (confirm(traduzirProfissional('pepe.confirmarSair'))) {
                localStorage.removeItem('profissionalLogado');
                window.location.href = '/index.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const profissional = verificarLogin();
    if (profissional && profissional.email) {
        await carregarPedidosReais(profissional.email);
    }
    configurarBotoes();
    configurarModalDetalhes();
    configurarMenuConfiguracoes();
});
