function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

verificarLogin();

document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

// MODO ESCURO para TelaIni
const darkModeToggleIni = document.getElementById('darkModeToggleIni');
if (darkModeToggleIni) {
    // Verificar preferência salva
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggleIni.textContent = 'Modo claro';
    }

    darkModeToggleIni.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggleIni.textContent = isDark ? 'Modo claro' : 'Modo escuro';
    });
}