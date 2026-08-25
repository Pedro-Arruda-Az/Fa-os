/* ============================================================
   FAÇOS - carteira.js
   Carteira do profissional (dados reais do Supabase)
   ============================================================ */

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let profissionalAtual = null;
let todasTransacoes = [];

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
        return null;
    }
    return JSON.parse(profissional);
}

// ========== BUSCAR DADOS DO PROFISSIONAL (SALDO, PIX, BANCO) ==========
async function buscarDadosProfissional() {
    if (!supabaseClient || !profissionalAtual) return null;

    const { data, error } = await supabaseClient
        .from('profissionais')
        .select('saldo, chave_pix, banco, cnpj, cpf')
        .eq('email', profissionalAtual.email)
        .single();

    if (error) {
        console.error('Erro ao buscar dados do profissional:', error);
        return null;
    }

    return data;
}

// ========== BUSCAR TRANSAÇÕES (GANHOS) ==========
async function buscarTransacoes() {
    if (!supabaseClient || !profissionalAtual) return [];

    const { data, error } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('profissional_email', profissionalAtual.email)
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('Erro ao buscar transações:', error);
        return [];
    }

    return data || [];
}

// ========== FORMATAR MOEDA ==========
function formatarMoeda(valor) {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

// ========== RENDERIZAR TRANSAÇÕES ==========
function renderizarTransacoes(lista) {
    const container = document.getElementById('transacoesList');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.9rem;">Nenhuma transação ainda. Quando um cliente pagar por um serviço seu, aparece aqui.</p>`;
        return;
    }

    lista.forEach((t) => {
        const positivo = t.tipo === 'ganho';
        const item = document.createElement('div');
        item.className = 'transacao-item';
        item.dataset.tipo = t.tipo === 'ganho' ? 'ganhos' : (t.tipo === 'saque' ? 'saques' : 'taxas');

        const data = new Date(t.criado_em).toLocaleDateString('pt-BR');

        item.innerHTML = `
            <div class="transacao-icon ${positivo ? 'icon-positivo' : 'icon-negativo'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${positivo
                        ? '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'
                        : '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'}
                </svg>
            </div>
            <div class="transacao-info">
                <span class="transacao-nome">${t.descricao || (positivo ? 'Pagamento recebido' : 'Saída')}</span>
                <span class="transacao-data">${data}</span>
            </div>
            <div class="transacao-valor-col">
                <span class="transacao-valor ${positivo ? 'valor-positivo' : 'valor-negativo'}">${positivo ? '+' : ''}${formatarMoeda(t.valor)}</span>
                <span class="status-pago">${t.status === 'aprovado' ? 'pago' : t.status}</span>
            </div>
        `;

        container.appendChild(item);
    });
}

// ========== FILTROS DE TRANSAÇÕES ==========
function configurarFiltros() {
    const botoes = document.querySelectorAll('.filtro-btn');

    botoes.forEach((btn) => {
        btn.addEventListener('click', function () {
            botoes.forEach((b) => b.classList.remove('active'));
            this.classList.add('active');

            const filtro = this.dataset.filtro;
            const itens = document.querySelectorAll('.transacao-item');

            itens.forEach((item) => {
                item.style.display = (filtro === 'todos' || item.dataset.tipo === filtro) ? 'flex' : 'none';
            });
        });
    });
}

// ========== EDITAR DADOS DE PAGAMENTO ==========
function configurarEdicaoDados(dadosAtuais) {
    const modal = document.getElementById('editarDadosModal');
    const abrirBtn = document.getElementById('editarDadosBtn');
    const fecharBtn = document.getElementById('fecharEditarDadosModal');
    const salvarBtn = document.getElementById('salvarDadosBtn');
    const inputChavePix = document.getElementById('inputChavePix');
    const inputBanco = document.getElementById('inputBanco');

    if (abrirBtn) {
        abrirBtn.addEventListener('click', () => {
            inputChavePix.value = (dadosAtuais && dadosAtuais.chave_pix) || '';
            inputBanco.value = (dadosAtuais && dadosAtuais.banco) || '';
            modal.classList.add('open');
        });
    }

    if (fecharBtn) {
        fecharBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    if (salvarBtn) {
        salvarBtn.addEventListener('click', async () => {
            const chave_pix = inputChavePix.value.trim();
            const banco = inputBanco.value.trim();

            const { error } = await supabaseClient
                .from('profissionais')
                .update({ chave_pix, banco })
                .eq('email', profissionalAtual.email);

            if (error) {
                console.error('Erro ao salvar dados:', error);
                alert('Não foi possível salvar. Tente novamente.');
                return;
            }

            document.getElementById('dadoChavePix').textContent = chave_pix || 'Não cadastrada';
            document.getElementById('dadoBanco').textContent = banco || 'Não cadastrado';
            modal.classList.remove('open');
        });
    }
}

// ========== SAQUE / PIX (AINDA NÃO CONECTADOS A UM PROVEDOR REAL) ==========
function configurarAcoes() {
    const sacarBtn = document.getElementById('sacarBtn');
    if (sacarBtn) {
        sacarBtn.addEventListener('click', () => {
            alert('Saque via Mercado Pago em breve! Ainda estamos preparando essa parte.');
        });
    }

    const pixBtn = document.getElementById('pixBtn');
    if (pixBtn) {
        pixBtn.addEventListener('click', () => {
            alert('Transferência via Pix em breve! Ainda estamos preparando essa parte.');
        });
    }

    const exportarBtn = document.getElementById('exportarBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', () => {
            alert('Exportação do histórico em breve!');
        });
    }
}

// ========== PERFIL (LOGOUT) ==========
function configurarPerfil() {
    const perfilBtn = document.getElementById('perfilBtn');
    if (perfilBtn) {
        perfilBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Deseja sair do painel profissional?')) {
                localStorage.removeItem('profissionalLogado');
                window.location.href = '/Profissional/login_profissional.html';
            }
        });
    }
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', async () => {
    profissionalAtual = verificarLogin();
    if (!profissionalAtual) return;

    configurarFiltros();
    configurarAcoes();
    configurarPerfil();

    const dados = await buscarDadosProfissional();

    if (dados) {
        document.getElementById('saldoValor').textContent = formatarMoeda(dados.saldo);
        document.getElementById('dadoChavePix').textContent = dados.chave_pix || 'Não cadastrada';
        document.getElementById('dadoBanco').textContent = dados.banco || 'Não cadastrado';
        document.getElementById('dadoCnpj').textContent = dados.cnpj || dados.cpf || '—';
    }

    configurarEdicaoDados(dados);

    todasTransacoes = await buscarTransacoes();
    renderizarTransacoes(todasTransacoes);
});
