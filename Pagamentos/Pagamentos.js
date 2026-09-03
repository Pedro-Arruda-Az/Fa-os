
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let usuario = null;

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

async function buscarSaldoAtual(email) {
    if (!supabaseClient) return 0;
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('saldo')
        .eq('email', email)
        .single();

    if (error || !data) return 0;
    return Number(data.saldo || 0);
}

async function buscarCreditosAprovados(email) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('usuario_email', email)
        .eq('status', 'aprovado')
        .eq('tipo', 'credito')
        .order('criado_em', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
        titulo: 'Crédito adicionado',
        descricao: formatarFormaPagamento(p.forma_pagamento),
        data: new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''),
        dataOrdenacao: p.criado_em,
        valor: Number(p.valor)
    }));
}

async function buscarGastosAprovados(email) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('usuario_email', email)
        .eq('status', 'aprovado')
        .eq('tipo', 'gasto')
        .order('criado_em', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
        titulo: p.descricao || 'Serviço contratado',
        descricao: formatarFormaPagamento(p.forma_pagamento),
        data: new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''),
        dataOrdenacao: p.criado_em,
        valor: -Number(p.valor)
    }));
}

function formatarFormaPagamento(forma) {
    const mapa = { cartao: 'Cartão de crédito', pix: 'PIX', boleto: 'Boleto', carteira: 'Saldo da carteira' };
    return mapa[forma] || 'Mercado Pago';
}

function renderTransacoes(lista) {
    const container = document.getElementById('transacoesList');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-light);">
                <p>Nenhuma transação encontrada</p>
            </div>
        `;
        return;
    }

    lista.forEach((t) => {
        const card = document.createElement('div');
        card.className = 'transacao-card';

        const valorFormatado = t.valor < 0
            ? `- R$ ${Math.abs(t.valor).toFixed(2).replace('.', ',')}`
            : `+ R$ ${t.valor.toFixed(2).replace('.', ',')}`;

        const valorClass = t.valor < 0 ? 'negativo' : 'positivo';

        card.innerHTML = `
            <div class="transacao-info">
                <div class="transacao-titulo">${t.titulo}</div>
                <div class="transacao-descricao">${t.descricao}</div>
                <div class="transacao-data">${t.data}</div>
            </div>
            <div class="transacao-right">
                <span class="transacao-valor ${valorClass}">${valorFormatado}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

function atualizarResumo(saldo, transacoesGasto) {
    const totalGasto = transacoesGasto
        .filter((t) => t.valor < 0)
        .reduce((soma, t) => soma + Math.abs(t.valor), 0);

    const saldoElement = document.getElementById('saldoValor');
    saldoElement.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
    saldoElement.className = 'saldo-valor positivo';

    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2).replace('.', ',')}`;
}

async function carregarDados() {
    const creditos = await buscarCreditosAprovados(usuario.email);
    const gastosReais = await buscarGastosAprovados(usuario.email);
    const saldo = await buscarSaldoAtual(usuario.email);

    const todas = [...creditos, ...gastosReais].sort(
        (a, b) => new Date(b.dataOrdenacao) - new Date(a.dataOrdenacao)
    );

    renderTransacoes(todas);
    atualizarResumo(saldo, gastosReais);

    return saldo;
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

function configurarModalCredito() {
    const modal = document.getElementById('creditoModal');
    const abrirBtn = document.getElementById('adicionarCreditoBtn');
    const fecharBtn = document.getElementById('modalClose');
    const confirmarBtn = document.getElementById('confirmarPagamentoBtn');
    const valorPersonalizado = document.getElementById('valorPersonalizado');

    abrirBtn.addEventListener('click', () => {
        modal.classList.add('open');
    });

    fecharBtn.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    document.querySelectorAll('.valor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.valor-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            valorPersonalizado.value = btn.dataset.valor;
        });
    });

    confirmarBtn.addEventListener('click', async () => {
        const valor = parseFloat(valorPersonalizado.value);
        if (!valor || valor <= 0) {
            alert('Por favor, insira um valor válido!');
            return;
        }

        const forma = document.getElementById('formaPagamento');
        const formaPagamento = forma.value;

        const textoOriginal = confirmarBtn.textContent;
        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Abrindo Mercado Pago...';

        try {
            const resposta = await fetch('/api/criar-pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: usuario.email,
                    nome: usuario.nome,
                    valor,
                    formaPagamento,
                    origin: window.location.origin
                })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.error || 'Não foi possível iniciar o pagamento.');
            }

            window.location.href = resultado.init_point;
        } catch (err) {
            console.error(err);
            alert(err.message || 'Ocorreu um erro ao iniciar o pagamento. Tente novamente.');
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = textoOriginal;
        }
    });
}

async function verificarRetornoPagamento() {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const externalReference = params.get('external_reference');

    if (!paymentId || !externalReference) return;

    try {
        const resposta = await fetch(
            `/api/verificar-pagamento?payment_id=${encodeURIComponent(paymentId)}&external_reference=${encodeURIComponent(externalReference)}`
        );
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.error || 'Não foi possível confirmar o pagamento.');
        }

        if (resultado.status === 'aprovado' || resultado.status === 'ja_processado') {
            alert(`Pagamento aprovado! Foi creditado R$ ${resultado.valor.toFixed(2).replace('.', ',')} na sua carteira.`);
        } else if (resultado.status === 'pending' || resultado.status === 'in_process') {
            alert('Seu pagamento ainda está sendo processado pelo Mercado Pago. Assim que for aprovado, o valor cai na sua carteira.');
        } else {
            alert('O pagamento não foi aprovado. Tente novamente.');
        }
    } catch (err) {
        console.error(err);
        alert(err.message || 'Ocorreu um erro ao confirmar seu pagamento.');
    } finally {
        window.history.replaceState(null, '', window.location.pathname);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    usuario = verificarLogin();
    if (!usuario) return;

    configurarModoEscuro();
    configurarMenuConfiguracoes();
    configurarModalCredito();

    await verificarRetornoPagamento();
    await carregarDados();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);
});
