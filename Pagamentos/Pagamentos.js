/* ============================================================
   FAÇOS - Pagamentos.js
   Página de pagamentos e transações
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const transacoes = [
    {
        id: 1,
        titulo: 'Limpeza completa',
        descricao: 'LimpaMais Serviços',
        data: '20 Abr 2026',
        valor: -150.00,
        tipo: 'servico'
    },
    {
        id: 2,
        titulo: 'Reparo elétrico',
        descricao: 'Eletro Fix',
        data: '18 Abr 2026',
        valor: -200.00,
        tipo: 'servico'
    },
    {
        id: 3,
        titulo: 'Crédito adicionado',
        descricao: 'Cartão de crédito',
        data: '17 Abr 2026',
        valor: 300.00,
        tipo: 'credito'
    },
    {
        id: 4,
        titulo: 'Montagem de móveis',
        descricao: 'Montagem Express',
        data: '15 Abr 2026',
        valor: -180.00,
        tipo: 'servico'
    },
    {
        id: 5,
        titulo: 'Limpeza pós-obra',
        descricao: 'Clean House Pro',
        data: '12 Abr 2026',
        valor: -350.00,
        tipo: 'servico'
    },
    {
        id: 6,
        titulo: 'Crédito adicionado',
        descricao: 'PIX',
        data: '10 Abr 2026',
        valor: 300.00,
        tipo: 'credito'
    }
];

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

// ========== CALCULAR TOTAIS ==========
function calcularTotais() {
    let totalGasto = 0;
    let totalRecebido = 0;

    transacoes.forEach(t => {
        if (t.valor < 0) {
            totalGasto += Math.abs(t.valor);
        } else {
            totalRecebido += t.valor;
        }
    });

    // Saldo sempre positivo para exemplo (R$ 280,00)
    const saldo = 280.00;

    return { totalGasto, totalRecebido, saldo };
}

// ========== RENDERIZAR TRANSAÇÕES ==========
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

    lista.forEach(t => {
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

// ========== ATUALIZAR RESUMO ==========
function atualizarResumo() {
    const { totalGasto, saldo } = calcularTotais();

    const saldoElement = document.getElementById('saldoValor');
    // Saldo sempre positivo e em verde
    saldoElement.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
    saldoElement.className = 'saldo-valor positivo'; // Adiciona classe verde

    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2).replace('.', ',')}`;
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
        darkModeToggle.textContent = '☀️ Modo claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? '☀️ Modo claro' : '🌙 Modo escuro';
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

// ========== MODAL ADICIONAR CRÉDITO ==========
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

    document.querySelectorAll('.valor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.valor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            valorPersonalizado.value = btn.dataset.valor;
        });
    });

    confirmarBtn.addEventListener('click', () => {
        const valor = parseFloat(valorPersonalizado.value);
        if (!valor || valor <= 0) {
            alert('Por favor, insira um valor válido!');
            return;
        }

        const forma = document.getElementById('formaPagamento');
        const formaTexto = forma.options[forma.selectedIndex].text;

        const novaTransacao = {
            id: transacoes.length + 1,
            titulo: 'Crédito adicionado',
            descricao: formaTexto,
            data: new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            }).replace('.', ''),
            valor: valor,
            tipo: 'credito'
        };

        transacoes.push(novaTransacao);
        
        renderTransacoes(transacoes);
        atualizarResumo();

        modal.classList.remove('open');
        valorPersonalizado.value = '';
        document.querySelectorAll('.valor-btn').forEach(b => b.classList.remove('active'));

        alert(`Crédito de R$ ${valor.toFixed(2).replace('.', ',')} adicionado com sucesso!`);
    });
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    renderTransacoes(transacoes);
    atualizarResumo();
    configurarModoEscuro();
    configurarSidebar();
    configurarModalCredito();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);
});