/* ============================================================
   FAÇOS - notificacoes.js
   Painel do profissional - Notificações
   ============================================================ */

let filtroAtivo = null;

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== ATUALIZAR RESUMO ==========
function atualizarResumo() {
    const todas = document.querySelectorAll('.notif-card');
    const novas = document.querySelectorAll('#notifNovas .notif-card');
    const naoLidas = document.querySelectorAll('.notif-card.is-unread');

    document.getElementById('resumoTotal').textContent = todas.length;
    document.getElementById('resumoNovas').textContent = novas.length;
    document.getElementById('resumoNaoLidas').textContent = naoLidas.length;
}

// ========== MARCAR TODAS COMO LIDAS ==========
function marcarTodasComoLidas() {
    document.querySelectorAll('.notif-card.is-unread').forEach(card => {
        card.classList.remove('is-unread');
    });
    atualizarResumo();
}

// ========== MARCAR UMA COMO LIDA (ao clicar no link) ==========
function configurarLinksNotif() {
    document.querySelectorAll('.notif-link').forEach(link => {
        link.addEventListener('click', () => {
            const card = link.closest('.notif-card');
            if (card) {
                card.classList.remove('is-unread');
                atualizarResumo();
            }
        });
    });
}

// ========== PREFERÊNCIAS (mostrar/ocultar tipos) ==========
function configurarPreferencias() {
    document.querySelectorAll('.pref-check').forEach(check => {
        check.addEventListener('change', () => {
            const tipo = check.dataset.pref;
            const ligado = check.checked;

            document.querySelectorAll(`.notif-card[data-tipo="${tipo}"]`).forEach(card => {
                card.style.display = ligado ? '' : 'none';
            });
        });
    });
}

// ========== FILTROS RÁPIDOS ==========
function aplicarFiltro(filtro) {
    const botoes = document.querySelectorAll('.filtro-rapido-btn');
    const cards = document.querySelectorAll('.notif-card');

    // Se clicar no filtro já ativo, desativa (mostra tudo)
    if (filtroAtivo === filtro) {
        filtroAtivo = null;
        botoes.forEach(b => b.classList.remove('active'));
        cards.forEach(c => c.classList.remove('hidden'));
        return;
    }

    filtroAtivo = filtro;
    botoes.forEach(b => b.classList.toggle('active', b.dataset.filtro === filtro));

    cards.forEach(card => {
        let mostrar = true;
        if (filtro === 'nao-lidas') {
            mostrar = card.classList.contains('is-unread');
        } else {
            mostrar = card.dataset.tipo === filtro;
        }
        card.classList.toggle('hidden', !mostrar);
    });
}

function configurarFiltrosRapidos() {
    document.querySelectorAll('.filtro-rapido-btn').forEach(btn => {
        btn.addEventListener('click', () => aplicarFiltro(btn.dataset.filtro));
    });
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/Profissional/login_profissional.html';
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    atualizarResumo();
    configurarLinksNotif();
    configurarPreferencias();
    configurarFiltrosRapidos();

    const marcarLidasBtn = document.getElementById('marcarLidasBtn');
    if (marcarLidasBtn) {
        marcarLidasBtn.addEventListener('click', marcarTodasComoLidas);
    }

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
