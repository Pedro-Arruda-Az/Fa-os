/* ============================================================
   FAÇOS - agenda.js
   Agenda do profissional
   ============================================================ */

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== BOTÕES DOS COMPROMISSOS ==========
function configurarBotoes() {
    document.querySelectorAll('.agenda-btn:not([disabled])').forEach((btn) => {
        btn.addEventListener('click', function () {
            const card = this.closest('.compromisso-card');
            const nome = card.querySelector('.compromisso-nome').textContent;

            if (this.textContent.trim() === 'Confirmar') {
                const badge = card.querySelector('.status-badge');
                badge.textContent = 'Confirmado';
                badge.className = 'status-badge status-confirmado';
                this.textContent = 'Detalhes';
                alert(`Compromisso de ${nome} confirmado!`);
            } else {
                alert(`Detalhes do compromisso de ${nome}`);
            }
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
