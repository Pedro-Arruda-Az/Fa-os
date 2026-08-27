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
    window.location.href = '/index.html';
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    // Ícone de perfil no header (link real para /Profissional/perfil.html,
    // nada a fazer aqui além de deixar o navegador seguir o link)

    // ===== MENU DA ENGRENAGEM =====
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

    // Modo claro / escuro (funcional)
    const modoClaroBtn = document.getElementById('modoClaroBtn');
    const modoClaroLabel = document.getElementById('modoClaroLabel');

    function aplicarModo(claro) {
        document.documentElement.classList.toggle('light-mode', claro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', claro ? 'menu.modoEscuro' : 'menu.modoClaro');
            if (window.facosAplicarIdioma) facosAplicarIdioma();
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

    // Idioma (PT/EN) — funcional, e fica salvo pras outras telas também
    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosTrocarIdioma) facosTrocarIdioma();
        });
    }

    // Sair
    const sairBtn = document.getElementById('sairBtn');
    if (sairBtn) {
        sairBtn.addEventListener('click', function () {
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
