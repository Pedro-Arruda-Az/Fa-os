/* ============================================================
   FAÇOS - dashboard.js
   Painel do profissional
   ============================================================ */

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== CARREGAR DADOS ==========
function carregarDados() {
    const profissional = verificarLogin();
    if (!profissional) return;

    const nomeElement = document.getElementById('empresaNome');
    if (nomeElement) {
        nomeElement.textContent = profissional.nome_empresa || 'Profissional';
    }
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/Profissional/login_profissional.html';
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Ícone de perfil no header: opção de sair do painel
    const perfilBtn = document.getElementById('perfilBtn');
    if (perfilBtn) {
        perfilBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Deseja sair do painel profissional?')) {
                fazerLogout();
            }
        });
    }

    // Botão de ajuda/suporte
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', function () {
            alert('Precisa de ajuda? Em breve você poderá falar com nosso suporte por aqui.');
        });
    }
});
