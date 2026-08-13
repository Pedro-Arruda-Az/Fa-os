/* ============================================================
   FAÇOS - limpeza.js
   Tela de busca de profissionais com mapa (Leaflet)
   ============================================================ */

const ACCESS_TOKEN = 'APP_USR-2991875109649887-061020-07b3ac464f9a25e0272cd8ba40bf2321-3466462896';

const professionals = [
    {
        id: 1,
        name: 'LimpaMais Servicos',
        service: 'Limpeza residencial',
        rating: 4.8,
        distance: 1.2,
        lat: -23.5590,
        lng: -46.6530,
        services: 'Limpeza completa, pos-obra',
        price: 'R$ 120 - R$ 250',
        initials: 'LM'
    },
    {
        id: 2,
        name: 'Clean House Pro',
        service: 'Limpeza residencial',
        rating: 4.9,
        distance: 2.5,
        lat: -23.5620,
        lng: -46.6560,
        services: 'Limpeza completa, passagem',
        price: 'R$ 150 - R$ 300',
        initials: 'CH'
    },
    {
        id: 3,
        name: 'Joao Silva - Faxineiro',
        service: 'Limpeza residencial',
        rating: 4.7,
        distance: 3.1,
        lat: -23.5555,
        lng: -46.6600,
        services: 'Faxina, janelas, piso',
        price: 'R$ 100 - R$ 200',
        initials: 'JS'
    },
    {
        id: 4,
        name: 'Brilho Total',
        service: 'Limpeza residencial',
        rating: 4.6,
        distance: 4.0,
        lat: -23.5650,
        lng: -46.6490,
        services: 'Limpeza completa, lavagem',
        price: 'R$ 130 - R$ 270',
        initials: 'BT'
    }
];

let map = null;
let markers = {};
let activePro = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    initMap();
    renderCards(professionals);
    bindEvents();
});

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
                width:38px; height:38px;
                display:flex; align-items:center; justify-content:center;
                font-weight:700; font-size:0.7rem;
                color:#5A3A1A;
                box-shadow:0 3px 8px rgba(0,0,0,0.2);
                font-family:'Sora',sans-serif;
                cursor:pointer;
            ">${pro.initials}</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        const marker = L.marker([pro.lat, pro.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-name">${pro.name}</div>
                <div class="popup-service">${pro.service}</div>
                <div class="popup-dist">📍 ${pro.distance} km • ⭐ ${pro.rating}</div>
            `, { offset: [0, -10] });

        marker.on('click', () => selectPro(pro.id));
        markers[pro.id] = marker;
    });
}

function renderCards(list) {
    const container = document.getElementById('professionalsList');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `${list.length} profissional${list.length !== 1 ? 'is' : ''} encontrado${list.length !== 1 ? 's' : ''}`;
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
                <div class="pro-meta">
                    <span class="pro-dist">${pro.distance} km</span>
                    <div class="pro-rating-wrap">
                        <div class="stars">${buildStars(pro.rating)}</div>
                        <span class="pro-score">${pro.rating}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => selectPro(pro.id));
        container.appendChild(card);
    });
}

function buildStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star${i <= Math.round(rating) ? '' : ' empty'}">★</span>`;
    }
    return html;
}

function buildModalStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="modal-star${i <= Math.round(rating) ? '' : ' empty'}">★</span>`;
    }
    return html;
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

function openModal(pro) {
    document.getElementById('modalAvatar').textContent = pro.initials;
    document.getElementById('modalName').textContent = pro.name;
    document.getElementById('modalService').textContent = pro.service;
    document.getElementById('modalStars').innerHTML = buildModalStars(pro.rating);
    document.getElementById('modalDist').textContent = `${pro.distance} km`;
    document.getElementById('modalRating').textContent = `${pro.rating} / 5.0`;
    document.getElementById('modalServices').textContent = pro.services;
    document.getElementById('modalPrice').textContent = pro.price;
    document.getElementById('profileModal').classList.add('open');
}

function closeModal() {
    document.getElementById('profileModal').classList.remove('open');
}

async function iniciarPagamento(pro) {
    const btn = document.getElementById('solicitarBtn');
    const textoOriginal = btn.textContent;

    btn.textContent = 'Aguarde...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                items: [
                    {
                        title: `Servico de Limpeza - ${pro.name}`,
                        quantity: 1,
                        currency_id: 'BRL',
                        unit_price: 120.00
                    }
                ],
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 1
                },
                external_reference: `FACO-${Date.now()}`
            })
        });

        const data = await response.json();
        console.log('Resposta MP:', data);

        if (data.init_point) {
            window.open(data.init_point, '_blank');
        } else if (data.sandbox_init_point) {
            window.open(data.sandbox_init_point, '_blank');
        } else {
            throw new Error(data.message || 'Link de pagamento nao retornado');
        }

    } catch (err) {
        console.error('Erro ao iniciar pagamento:', err);
        alert('Erro ao conectar com o Mercado Pago.\nVerifique o console para mais detalhes.');
    }

    btn.textContent = textoOriginal;
    btn.disabled = false;
    btn.style.opacity = '1';
}

function bindEvents() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '/index.html';
    });

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const filtered = professionals.filter(p => {
            const q = searchInput.value.toLowerCase().trim();
            return !q || p.name.toLowerCase().includes(q) || p.service.toLowerCase().includes(q);
        });
        renderCards(filtered);
    });

    document.getElementById('professionalsList').addEventListener('dblclick', (e) => {
        const card = e.target.closest('.pro-card');
        if (card) {
            const id = parseInt(card.dataset.id);
            const pro = professionals.find(p => p.id === id);
            if (pro) openModal(pro);
        }
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('profileModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('profileModal')) closeModal();
    });

    document.getElementById('solicitarBtn').addEventListener('click', () => {
        if (activePro) iniciarPagamento(activePro);
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    sidebarToggle.addEventListener('click', () => {
        const pinned = sidebar.classList.toggle('pinned');
        sidebarToggle.textContent = pinned ? '‹' : '›';
        setTimeout(() => map && map.invalidateSize(), 320);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}
// MODO ESCURO
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    // Verificar preferência salva
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Modo claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? 'Modo claro' : 'Modo escuro';
        // Atualizar tamanho do mapa após mudança de estilo (opcional)
        if (map) setTimeout(() => map.invalidateSize(), 100);
    });
}
