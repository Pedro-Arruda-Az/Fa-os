const professionals = [
    {
        id: 1,
        name: 'LimpaMais Serviços',
        service: 'Limpeza',
        distance: 0.8,
        lat: -23.5590,
        lng: -46.6530,
        initials: 'LM'
    },
    {
        id: 2,
        name: 'Eletro Fix',
        service: 'Eletricista',
        distance: 1.2,
        lat: -23.5620,
        lng: -46.6560,
        initials: 'EF'
    },
    {
        id: 3,
        name: 'Hidro Pro',
        service: 'Encanador',
        distance: 2.0,
        lat: -23.5555,
        lng: -46.6600,
        initials: 'HP'
    },
    {
        id: 4,
        name: 'Montagem Express',
        service: 'Montagem de móveis',
        distance: 2.8,
        lat: -23.5650,
        lng: -46.6490,
        initials: 'ME'
    },
    {
        id: 5,
        name: 'Verde Jardins',
        service: 'Jardinagem',
        distance: 3.5,
        lat: -23.5700,
        lng: -46.6450,
        initials: 'VJ'
    }
];

let map = null;
let markers = {};
let activePro = null;

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

function initMap() {
    const center = [-23.5874, -46.6576];

    map = L.map('map', {
        center,
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    professionals.forEach(pro => {
        const icon = L.divIcon({
            className: '',
            html: `<div style="
                background:#ffc70b;
                border:2px solid #8B4513;
                border-radius:50%;
                width:34px; height:34px;
                display:flex; align-items:center; justify-content:center;
                font-weight:700; font-size:0.65rem;
                color:#5A3A1A;
                box-shadow:0 3px 8px rgba(0,0,0,0.2);
                font-family:'Sora',sans-serif;
                cursor:pointer;
            ">${pro.initials}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        const marker = L.marker([pro.lat, pro.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-name">${pro.name}</div>
                <div class="popup-service">${pro.service}</div>
                <div class="popup-dist">${pro.distance} km</div>
            `, { offset: [0, -10] });

        marker.on('click', () => selectPro(pro.id));
        markers[pro.id] = marker;
    });
}

function renderCards(list) {
    const container = document.getElementById('professionalsList');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `${list.length} ${list.length !== 1 ? 'profissionais' : 'profissional'} encontrado${list.length !== 1 ? 's' : ''}`;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#A0826D;padding:2rem;font-size:0.95rem;">Nenhum profissional encontrado.</p>`;
        return;
    }

    list.forEach(pro => {
        const card = document.createElement('div');
        card.className = 'pro-card';
        card.dataset.id = pro.id;

        card.innerHTML = `
            <div class="pro-avatar">${pro.initials}</div>
            <div class="pro-info">
                <div class="pro-name">${pro.name}</div>
                <div class="pro-service">${pro.service}</div>
            </div>
            <div class="pro-dist">${pro.distance} km</div>
        `;

        card.addEventListener('click', () => selectPro(pro.id));
        container.appendChild(card);
    });
}

function selectPro(id) {
    const pro = professionals.find(p => p.id === id);
    if (!pro) return;

    document.querySelectorAll('.pro-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.pro-card[data-id="${id}"]`);
    if (card) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (map) {
        map.setView([pro.lat, pro.lng], 15, { animate: true });
        markers[id].openPopup();
    }

    activePro = pro;
}

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

function configurarModoEscuro() {
    const modoClaroBtn = document.getElementById('modoClaroBtn');
    const modoClaroLabel = document.getElementById('modoClaroLabel');
    if (!modoClaroBtn) return;

    function aplicarModo(escuro) {
        document.body.classList.toggle('dark-mode', escuro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', escuro ? 'menu.modoClaro' : 'menu.modoEscuro');
            if (window.facosClienteAplicarIdioma) window.facosClienteAplicarIdioma();
        }
        if (map) setTimeout(() => map.invalidateSize(), 100);
    }

    if (localStorage.getItem('darkMode') === 'enabled') {
        aplicarModo(true);
    }

    modoClaroBtn.addEventListener('click', () => {
        const escuro = !document.body.classList.contains('dark-mode');
        aplicarModo(escuro);
        localStorage.setItem('darkMode', escuro ? 'enabled' : 'disabled');
    });
}

function configurarMenuConfiguracoes() {
    const configBtn = document.getElementById('configBtn');
    const configMenu = document.getElementById('configMenu');
    if (!configBtn || !configMenu) return;

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

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosClienteTrocarIdioma) facosClienteTrocarIdioma();
        });
    }
}

function configurarBusca() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const filtered = professionals.filter(p => {
            const q = searchInput.value.toLowerCase().trim();
            return !q || p.name.toLowerCase().includes(q) || p.service.toLowerCase().includes(q);
        });
        renderCards(filtered);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    initMap();
    renderCards(professionals);
    configurarModoEscuro();
    configurarMenuConfiguracoes();
    configurarBusca();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);
});