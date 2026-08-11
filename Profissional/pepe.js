/* ============================================================
   FAÇOS - pepe.js
   Meus pedidos (painel do profissional)
   ============================================================ */

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== BOTÕES DOS PEDIDOS ==========
function configurarBotoes() {
    document.querySelectorAll('.btn-detalhes').forEach((btn) => {
        btn.addEventListener('click', function () {
            const nome = this.closest('.pedido-card').querySelector('.pedido-nome').textContent;
            alert(`Detalhes do pedido de ${nome}`);
        });
    });

    document.querySelectorAll('.btn-comprovante').forEach((btn) => {
        btn.addEventListener('click', function () {
            const nome = this.closest('.pedido-card').querySelector('.pedido-nome').textContent;
            alert(`Comprovante do pedido de ${nome}`);
        });
    });
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
    configurarBotoes();
    configurarPerfil();
});
