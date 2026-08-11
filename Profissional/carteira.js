/* ============================================================
   FAÇOS - carteira.js
   Carteira do profissional
   ============================================================ */

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== FILTROS DE TRANSAÇÕES ==========
function configurarFiltros() {
    const botoes = document.querySelectorAll('.filtro-btn');
    const itens = document.querySelectorAll('.transacao-item');

    botoes.forEach((btn) => {
        btn.addEventListener('click', function () {
            botoes.forEach((b) => b.classList.remove('active'));
            this.classList.add('active');

            const filtro = this.dataset.filtro;

            itens.forEach((item) => {
                if (filtro === 'todos' || item.dataset.tipo === filtro) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ========== AÇÕES ==========
function configurarAcoes() {
    const sacarBtn = document.getElementById('sacarBtn');
    if (sacarBtn) {
        sacarBtn.addEventListener('click', () => {
            alert('Solicitação de saque enviada! O valor cairá em até 1 dia útil.');
        });
    }

    const pixBtn = document.getElementById('pixBtn');
    if (pixBtn) {
        pixBtn.addEventListener('click', () => {
            alert('Transferência via Pix em breve!');
        });
    }

    const exportarBtn = document.getElementById('exportarBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', () => {
            alert('Exportando histórico de transações...');
        });
    }

    const editarDadosBtn = document.getElementById('editarDadosBtn');
    if (editarDadosBtn) {
        editarDadosBtn.addEventListener('click', () => {
            alert('Edição de dados de pagamento em breve!');
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
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    configurarFiltros();
    configurarAcoes();
    configurarPerfil();
});
