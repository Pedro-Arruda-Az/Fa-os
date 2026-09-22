
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Ponto de reserva (protótipo), usado quando não dá pra saber a localização
// real do profissional (ainda não tem latitude/longitude salva) — assim a
// tela continua mostrando algo plausível em vez de quebrar.
const PONTO_RESERVA_PROFISSIONAL = { lat: -23.5960, lng: -46.6440 };
const PONTO_RESERVA_EMPRESA = { lat: -23.5874, lng: -46.6576 };

// Deslocamento usado pra "inventar" onde fica a empresa perto do
// profissional, já que ainda não temos a localização real da empresa
// salva no banco (só o endereço em texto). Quando isso for ligado a
// coordenadas de verdade, é só trocar esse cálculo pela localização real.
const DESLOCAMENTO_EMPRESA = { lat: 0.015, lng: -0.012 };

let map = null;

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

// Busca o pedido em andamento mais recente da empresa — é ele que decide
// se a tela mostra o mapa ou fica em branco.
async function buscarPedidoAtivo(email) {
    if (!supabaseClient) return null;

    const { data, error } = await supabaseClient
        .from('pedidos')
        .select('profissional, profissional_email, criado_em')
        .eq('usuario_email', email)
        .eq('status', 'em_andamento')
        .order('criado_em', { ascending: false })
        .limit(1);

    if (error || !data || !data.length) return null;
    return data[0];
}

// Só busca a localização (lat/lng) do profissional aqui — o nome mostrado
// na tela vem do próprio pedido (pedido.profissional), que é o nome de
// quando a empresa contratou/pagou o serviço dele, não o cadastro atual.
async function buscarCoordenadasProfissional(email) {
    if (!supabaseClient || !email) return null;

    const { data, error } = await supabaseClient
        .from('profissionais')
        .select('latitude, longitude')
        .eq('email', email)
        .limit(1);

    if (error || !data || !data.length) return null;

    const pro = data[0];
    if (pro.latitude == null || pro.longitude == null) return null;

    return {
        lat: Number(pro.latitude),
        lng: Number(pro.longitude)
    };
}

// Localização real da própria empresa (se ela já tiver latitude/longitude
// salva no cadastro). Ainda não existe uma tela pra empresa definir isso,
// então na prática isso só passa a valer quando esse cadastro existir —
// até lá cai no ponto inventado perto do profissional, como já era.
async function buscarCoordenadasEmpresa(email) {
    if (!supabaseClient || !email) return null;

    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('latitude, longitude')
        .eq('email', email)
        .limit(1);

    if (error || !data || !data.length) return null;

    const usuarioDb = data[0];
    if (usuarioDb.latitude == null || usuarioDb.longitude == null) return null;

    return {
        lat: Number(usuarioDb.latitude),
        lng: Number(usuarioDb.longitude)
    };
}

// Distância em linha reta entre os dois pontos (fórmula de Haversine).
function calcularDistanciaKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function criarIcone(cor) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width:24px; height:24px;
            border-radius:50% 50% 50% 0;
            background:${cor};
            border:2px solid #171717;
            transform: rotate(-45deg);
            box-shadow:0 3px 8px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });
}

function initMap(pontoEmpresa, pontoProfissional) {
    const mapWrapper = document.getElementById('mapWrapper');
    const mapaVazio = document.getElementById('mapaVazio');
    if (mapaVazio) mapaVazio.style.display = 'none';
    if (mapWrapper) mapWrapper.style.display = 'block';

    const centro = [
        (pontoEmpresa.lat + pontoProfissional.lat) / 2,
        (pontoEmpresa.lng + pontoProfissional.lng) / 2
    ];

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

    const pontos = [
        [pontoEmpresa.lat, pontoEmpresa.lng],
        [pontoProfissional.lat, pontoProfissional.lng]
    ];

    L.polyline(pontos, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.85
    }).addTo(map);

    L.marker(pontos[0], { icon: criarIcone('#34D399') })
        .addTo(map)
        .bindPopup('<strong>Você</strong>');

    L.marker(pontos[1], { icon: criarIcone('#FFC700') })
        .addTo(map)
        .bindPopup(`<strong>${pontoProfissional.nome || 'Profissional'}</strong>`);

    const bounds = L.latLngBounds(pontos);
    map.fitBounds(bounds, { padding: [40, 40] });

    // O tamanho do mapa só fica certo depois que ele já está visível na
    // tela — sem isso o Leaflet pode desenhar os ladrilhos torto.
    setTimeout(() => map.invalidateSize(), 50);

    const distancia = calcularDistanciaKm(pontoEmpresa, pontoProfissional);
    const badgeValor = document.getElementById('distanciaBadgeValor');
    if (badgeValor) {
        badgeValor.textContent = `${distancia.toFixed(1)} km`;
    }

    preencherInfoGrid(pontoProfissional, distancia);
}

// Preenche o card de rota e o card de estatísticas embaixo do mapa, e
// liga o botão de navegar até a localização real do profissional.
function preencherInfoGrid(pontoProfissional, distancia) {
    const infoGrid = document.getElementById('infoGrid');
    if (infoGrid) infoGrid.style.display = 'grid';

    const nome = pontoProfissional.nome || 'Profissional';
    const distanciaTexto = `${distancia.toFixed(1)} km`;

    const rotaNome = document.getElementById('rotaProfissionalNome');
    if (rotaNome) rotaNome.textContent = nome;

    const rotaSub = document.getElementById('rotaProfissionalSub');
    if (rotaSub) rotaSub.textContent = `${distanciaTexto} · a caminho`;

    const statDistancia = document.getElementById('statDistancia');
    if (statDistancia) statDistancia.textContent = distanciaTexto;

    const navegarBtn = document.getElementById('navegarBtn');
    if (navegarBtn) {
        navegarBtn.onclick = () => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${pontoProfissional.lat},${pontoProfissional.lng}`;
            window.open(url, '_blank');
        };
    }
}

async function carregarLocalizacao(usuario) {
    const pedido = await buscarPedidoAtivo(usuario.email);
    if (!pedido) return; // fica com a tela em branco (estado padrão)

    const [coordenadasProfissional, coordenadasEmpresa] = await Promise.all([
        buscarCoordenadasProfissional(pedido.profissional_email),
        buscarCoordenadasEmpresa(usuario.email)
    ]);

    // O nome é sempre o que está salvo no pedido (o nome do profissional
    // no momento em que a empresa contratou/pagou o serviço dele).
    const pontoProfissional = {
        nome: pedido.profissional,
        ...(coordenadasProfissional || PONTO_RESERVA_PROFISSIONAL)
    };

    const pontoEmpresa = coordenadasEmpresa || (coordenadasProfissional
        ? { lat: pontoProfissional.lat + DESLOCAMENTO_EMPRESA.lat, lng: pontoProfissional.lng + DESLOCAMENTO_EMPRESA.lng }
        : PONTO_RESERVA_EMPRESA);

    initMap(pontoEmpresa, pontoProfissional);
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
        const modoClaroIcone = document.getElementById('modoClaroIcone');
        if (modoClaroIcone) {
            modoClaroIcone.src = escuro
                ? '/imagens/icones-escuro/modo-claro-sol.png'
                : '/imagens/icones-escuro/modo-escuro-lua.png';
        }

        const logo = document.querySelector('img[src*="upscalemedia-transformed"], img[src*="facos-logo-completo"]');
        if (logo) {
            logo.src = escuro
                ? '/imagens/facos-logo-completo.png'
                : '/imagens/upscalemedia-transformed.png';
        }

        document.querySelectorAll('img[src*="/imagens/icones-claro/"], img[src*="/imagens/icones-escuro/"]').forEach((img) => {
            if (img.id === 'modoClaroIcone') return;
            img.src = escuro
                ? img.src.replace('/icones-claro/', '/icones-escuro/')
                : img.src.replace('/icones-escuro/', '/icones-claro/');
        });
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

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = verificarLogin();
    if (!usuario) return;

    configurarModoEscuro();
    configurarMenuConfiguracoes();
    await carregarLocalizacao(usuario);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', fazerLogout);

    // O botão de ajuda já é tratado pelo Buzz (Buzz/buzz.js), que abre
    // o chat de suporte de verdade — não precisa de handler aqui.
});
