/* ============================================================
   FAÇOS - mapa.js
   Painel do profissional - Mapa de atendimentos
   ============================================================ */

// ========== DADOS DE EXEMPLO ==========
const atendimentos = [
    {
        id: 1,
        nome: 'João Silva',
        status: 'atendido',
        distancia: 2.3,
        lat: -23.5874,
        lng: -46.6576
    },
    {
        id: 2,
        nome: 'Mariana Costa',
        status: 'proximo',
        distancia: 3.8,
        lat: -23.5960,
        lng: -46.6440
    }
];

let map = null;

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== INICIALIZAR MAPA ==========
function initMap() {
    const centro = [-23.592, -46.65];

    map = L.map('map', {
        center: centro,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    // Linha da rota entre os atendimentos
    const pontosRota = atendimentos.map(a => [a.lat, a.lng]);
    L.polyline(pontosRota, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.85
    }).addTo(map);

    // Marcadores
    atendimentos.forEach(a => {
        const cor = a.status === 'atendido' ? '#34D399' : '#FFC700';
        const icon = L.divIcon({
            className: '',
            html: `<div style="
                width:26px; height:26px;
                border-radius:50% 50% 50% 0;
                background:${cor};
                border:2px solid #171717;
                transform: rotate(-45deg);
                box-shadow:0 3px 8px rgba(0,0,0,0.35);
            "></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 26]
        });

        L.marker([a.lat, a.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <strong>${a.nome}</strong><br>
                ${a.distancia} km · ${a.status === 'atendido' ? 'Concluído' : 'Próximo cliente'}
            `);
    });

    const bounds = L.latLngBounds(pontosRota);
    map.fitBounds(bounds, { padding: [50, 50] });
}

// ========== NAVEGAÇÃO (abre Google Maps) ==========
function navegarPara(atendimento) {
    if (!atendimento) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${atendimento.lat},${atendimento.lng}`;
    window.open(url, '_blank');
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/index.html';
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    initMap();

    const proximoCliente = atendimentos.find(a => a.status === 'proximo');

    const btnNavegarProximo = document.getElementById('navegarProximoBtn');
    if (btnNavegarProximo) {
        btnNavegarProximo.addEventListener('click', () => navegarPara(proximoCliente));
    }

    const btnIniciarNavegacao = document.getElementById('iniciarNavegacaoBtn');
    if (btnIniciarNavegacao) {
        btnIniciarNavegacao.addEventListener('click', () => navegarPara(proximoCliente));
    }

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

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosTrocarIdioma) facosTrocarIdioma();
        });
    }

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
