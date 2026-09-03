
const ACCESS_TOKEN = 'APP_USR-2991875109649887-061020-07b3ac464f9a25e0272cd8ba40bf2321-3466462896';

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let professionals = [];

const CENTRO_SP = { lat: -23.5874, lng: -46.6576 };

function gerarIniciais(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

async function buscarProfissionais() {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('profissionais')
        .select('*')
        .eq('area_atuacao', 'Tecnologia e assistência')
        .eq('status', 'ativo');

    if (error) {
        console.error('Erro ao buscar profissionais:', error);
        return [];
    }

    return (data || []).map((row, index) => {
        const jitter = (index % 6) * 0.006 - 0.015;

        return {
            id: row.id,
            name: row.nome_empresa,
            email: row.email,
            service: 'Tecnologia e assistência',
            rating: 5.0,
            distance: Number((1 + (index % 5) * 0.7).toFixed(1)),
            lat: row.latitude != null ? Number(row.latitude) : CENTRO_SP.lat + jitter,
            lng: row.longitude != null ? Number(row.longitude) : CENTRO_SP.lng + jitter,
            services: row.descricao || 'Suporte técnico e assistência em equipamentos',
            price: `R$ ${Number(row.preco_servico || 0).toFixed(2).replace('.', ',')}`,
            priceValue: Number(row.preco_servico || 0),
            initials: gerarIniciais(row.nome_empresa)
        };
    });
}

let activePro = null;
let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
    usuarioAtual = verificarLogin();
    professionals = await buscarProfissionais();
    renderCards(professionals);
    bindEvents();
});

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

function renderCards(list) {
    const container = document.getElementById('professionalsList');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `${list.length} ${list.length !== 1 ? 'profissionais' : 'profissional'} encontrado${list.length !== 1 ? 's' : ''}`;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#A0826D;padding:2rem;font-size:0.95rem;">Nenhum profissional de tecnologia e assistência disponível ainda. Assim que um profissional se cadastrar nessa área, ele aparece aqui.</p>`;
        return;
    }

    list.forEach(pro => {
        const card = document.createElement('div');
        card.className = 'pro-card';
        card.dataset.id = pro.id;

        card.innerHTML = `
            <div class="pro-avatar">${pro.initials}</div>
            <div class="pro-info">
                <div class="pro-name">${pro.name}</div>
                <div class="pro-service">${pro.service}</div>
                <div class="pro-meta">
                    <span class="pro-dist">${pro.distance} km</span>
                    <div class="pro-rating-wrap">
                        <div class="stars">${buildStars(pro.rating)}</div>
                        <span class="pro-score">${pro.rating}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => selectPro(pro.id));
        container.appendChild(card);
    });
}

function buildStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star${i <= Math.round(rating) ? '' : ' empty'}">★</span>`;
    }
    return html;
}

function buildModalStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="modal-star${i <= Math.round(rating) ? '' : ' empty'}">★</span>`;
    }
    return html;
}

function selectPro(id) {
    const pro = professionals.find(p => p.id === id);
    if (!pro) return;

    document.querySelectorAll('.pro-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.pro-card[data-id="${id}"]`);
    if (card) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    activePro = pro;
    openModal(pro);
}

function openModal(pro) {
    document.getElementById('modalAvatar').textContent = pro.initials;
    document.getElementById('modalName').textContent = pro.name;
    document.getElementById('modalService').textContent = pro.service;
    document.getElementById('modalStars').innerHTML = buildModalStars(pro.rating);
    document.getElementById('modalDist').textContent = `${pro.distance} km`;
    document.getElementById('modalRating').textContent = `${pro.rating} / 5.0`;
    document.getElementById('modalServices').textContent = pro.services;
    document.getElementById('modalPrice').textContent = pro.price;

    document.getElementById('detailEmpty').style.display = 'none';
    document.getElementById('detailContent').classList.add('open');
}

function closeModal() {
    document.getElementById('detailContent').classList.remove('open');
    document.getElementById('detailEmpty').style.display = 'flex';
}

let metodoSelecionado = null;
let saldoAtualCarteira = 0;

async function abrirModalPagamento(pro) {
    document.getElementById('pagamentoSubtitle').textContent = `Serviço com ${pro.name}`;
    document.getElementById('pagamentoValor').textContent = formatarMoeda(pro.priceValue);

    metodoSelecionado = null;
    document.querySelectorAll('.pagamento-opcao').forEach((el) => el.classList.remove('active'));
    document.getElementById('confirmarPagamentoBtn').disabled = true;

    closeModal();
    document.getElementById('paymentModal').classList.add('open');

    const saldoTexto = document.getElementById('saldoDisponivelTexto');
    saldoTexto.textContent = 'Carregando saldo...';

    saldoAtualCarteira = await buscarSaldoCarteira();
    saldoTexto.textContent = `Saldo disponível: ${formatarMoeda(saldoAtualCarteira)}`;

    const opcaoCarteira = document.querySelector('.pagamento-opcao[data-metodo="carteira"]');
    if (saldoAtualCarteira < pro.priceValue) {
        opcaoCarteira.disabled = true;
        saldoTexto.textContent += ' (insuficiente)';
    } else {
        opcaoCarteira.disabled = false;
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('open');
}

function formatarMoeda(valor) {
    return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

async function buscarSaldoCarteira() {
    if (!supabaseClient || !usuarioAtual) return 0;

    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('saldo')
        .eq('email', usuarioAtual.email)
        .single();

    if (error || !data) return 0;
    return Number(data.saldo || 0);
}

async function registrarPedido(pro, formaPagamento) {
    if (!supabaseClient || !usuarioAtual) return;

    const { error } = await supabaseClient
        .from('pedidos')
        .insert([{
            usuario_email: usuarioAtual.email,
            titulo: pro.service,
            profissional: pro.name,
            valor: pro.priceValue,
            status: 'em_andamento',
            forma_pagamento: formaPagamento
        }]);

    if (error) {
        console.error('Erro ao registrar o pedido:', error);
    }
}

async function creditarProfissional(pro) {
    if (!supabaseClient || !pro.email) return;

    const { data: profissional, error: erroBusca } = await supabaseClient
        .from('profissionais')
        .select('saldo')
        .eq('email', pro.email)
        .single();

    if (erroBusca) {
        console.error('Erro ao buscar saldo do profissional:', erroBusca);
        return;
    }

    const novoSaldo = Math.round((Number(profissional.saldo || 0) + pro.priceValue) * 100) / 100;

    const { error: erroUpdate } = await supabaseClient
        .from('profissionais')
        .update({ saldo: novoSaldo })
        .eq('email', pro.email);

    if (erroUpdate) {
        console.error('Erro ao creditar o profissional:', erroUpdate);
        return;
    }

    const { error: erroPagamento } = await supabaseClient
        .from('pagamentos')
        .insert([{
            usuario_email: usuarioAtual.email,
            profissional_email: pro.email,
            valor: pro.priceValue,
            forma_pagamento: 'carteira',
            status: 'aprovado',
            tipo: 'ganho',
            descricao: `${pro.service} - ${usuarioAtual.nome || usuarioAtual.email}`
        }]);

    if (erroPagamento) {
        console.error('Erro ao registrar o ganho do profissional:', erroPagamento);
    }

    await supabaseClient
        .from('notificacoes_app')
        .insert([{
            destinatario_tipo: 'profissional',
            destinatario_email: pro.email,
            tipo: 'pagamento',
            titulo: 'Pagamento recebido',
            descricao: `${pro.price} de ${usuarioAtual.nome || usuarioAtual.email} - ${pro.service}`
        }]);
}

async function criarConversa(pro) {
    if (!supabaseClient || !usuarioAtual || !pro.email) return;

    const { data: existente } = await supabaseClient
        .from('conversas')
        .select('id')
        .eq('usuario_email', usuarioAtual.email)
        .eq('profissional_email', pro.email)
        .maybeSingle();

    if (existente) return;

    const { error } = await supabaseClient
        .from('conversas')
        .insert([{
            usuario_email: usuarioAtual.email,
            usuario_nome: usuarioAtual.nome || usuarioAtual.email,
            profissional_email: pro.email,
            profissional_nome: pro.name,
            servico: pro.service,
            ultima_mensagem: 'Conversa iniciada após contratação do serviço.',
        }]);

    if (error) {
        console.error('Erro ao criar a conversa:', error);
    }
}

async function pagarComCarteira(pro) {
    const confirmarBtn = document.getElementById('confirmarPagamentoBtn');
    const textoOriginal = confirmarBtn.textContent;
    confirmarBtn.disabled = true;
    confirmarBtn.textContent = 'Processando...';

    try {
        if (saldoAtualCarteira < pro.priceValue) {
            alert('Saldo insuficiente. Adicione crédito na carteira ou escolha o Mercado Pago.');
            return;
        }

        const novoSaldo = Math.round((saldoAtualCarteira - pro.priceValue) * 100) / 100;

        const { error } = await supabaseClient
            .from('usuarios')
            .update({ saldo: novoSaldo })
            .eq('email', usuarioAtual.email);

        if (error) {
            alert('Erro ao debitar o saldo: ' + error.message);
            return;
        }

        const { error: registroError } = await supabaseClient
            .from('pagamentos')
            .insert([{
                usuario_email: usuarioAtual.email,
                valor: pro.priceValue,
                forma_pagamento: 'carteira',
                status: 'aprovado',
                tipo: 'gasto',
                descricao: `${pro.service} - ${pro.name}`,
                external_reference: `GASTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            }]);

        if (registroError) {
            console.error('Erro ao registrar o gasto:', registroError);
        }

        await registrarPedido(pro, 'carteira');

        await criarConversa(pro);

        await creditarProfissional(pro);

        alert(`Pagamento realizado com o saldo da carteira!\nServiço solicitado com ${pro.name}.`);
        closePaymentModal();
    } catch (err) {
        console.error(err);
        alert('Ocorreu um erro ao processar o pagamento com a carteira.');
    } finally {
        confirmarBtn.disabled = false;
        confirmarBtn.textContent = textoOriginal;
    }
}

async function iniciarPagamento(pro) {
    const confirmarBtn = document.getElementById('confirmarPagamentoBtn');
    const textoOriginal = confirmarBtn.textContent;

    confirmarBtn.textContent = 'Aguarde...';
    confirmarBtn.disabled = true;

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                items: [
                    {
                        title: `Serviço - ${pro.service} - ${pro.name}`,
                        quantity: 1,
                        currency_id: 'BRL',
                        unit_price: pro.priceValue
                    }
                ],
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 1
                },
                external_reference: `FACO-${Date.now()}`
            })
        });

        const data = await response.json();
        console.log('Resposta MP:', data);

        if (data.init_point) {
            await registrarPedido(pro, 'mercadopago');
            await criarConversa(pro);
            await creditarProfissional(pro);
            window.open(data.init_point, '_blank');
            closePaymentModal();
        } else if (data.sandbox_init_point) {
            await registrarPedido(pro, 'mercadopago');
            await criarConversa(pro);
            await creditarProfissional(pro);
            window.open(data.sandbox_init_point, '_blank');
            closePaymentModal();
        } else {
            throw new Error(data.message || 'Link de pagamento não retornado');
        }

    } catch (err) {
        console.error('Erro ao iniciar pagamento:', err);
        alert('Erro ao conectar com o Mercado Pago.\nVerifique o console para mais detalhes.');
    }

    confirmarBtn.textContent = textoOriginal;
    confirmarBtn.disabled = false;
}

function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const filtered = professionals.filter(p => {
            const q = searchInput.value.toLowerCase().trim();
            return !q || p.name.toLowerCase().includes(q) || p.service.toLowerCase().includes(q);
        });
        renderCards(filtered);
    });

    document.getElementById('solicitarBtn').addEventListener('click', () => {
        if (activePro) abrirModalPagamento(activePro);
    });

    document.getElementById('paymentModalClose').addEventListener('click', closePaymentModal);
    document.getElementById('paymentModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('paymentModal')) closePaymentModal();
    });

    document.querySelectorAll('.pagamento-opcao').forEach((opcao) => {
        opcao.addEventListener('click', () => {
            if (opcao.disabled) return;
            document.querySelectorAll('.pagamento-opcao').forEach((el) => el.classList.remove('active'));
            opcao.classList.add('active');
            metodoSelecionado = opcao.dataset.metodo;
            document.getElementById('confirmarPagamentoBtn').disabled = false;
        });
    });

    document.getElementById('confirmarPagamentoBtn').addEventListener('click', () => {
        if (!activePro || !metodoSelecionado) return;

        if (metodoSelecionado === 'carteira') {
            pagarComCarteira(activePro);
        } else if (metodoSelecionado === 'mercadopago') {
            iniciarPagamento(activePro);
        }
    });

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

    function aplicarModo(escuro) {
        document.body.classList.toggle('dark-mode', escuro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', escuro ? 'menu.modoClaro' : 'menu.modoEscuro');
            if (window.facosClienteAplicarIdioma) facosClienteAplicarIdioma();
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

    if (modoClaroBtn) {
        modoClaroBtn.addEventListener('click', () => {
            const escuro = !document.body.classList.contains('dark-mode');
            aplicarModo(escuro);
            localStorage.setItem('darkMode', escuro ? 'enabled' : 'disabled');
        });
    }

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', () => {
            if (window.facosClienteTrocarIdioma) facosClienteTrocarIdioma();
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '/index.html';
    });
}

