
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Pontos de reserva (protótipo), usados quando ainda não dá pra saber a
// localização real de alguém — assim a tela continua mostrando algo
// plausível em vez de quebrar. Mesma lógica usada na tela de localização
// da empresa (Localizacao/Mapa.js).
const PONTO_RESERVA_PROFISSIONAL = { lat: -23.5960, lng: -46.6440 };
const PONTO_RESERVA_EMPRESA = { lat: -23.5874, lng: -46.6576 };

// Deslocamento usado pra "inventar" onde fica o cliente perto do
// profissional, já que ainda não temos a localização real do cliente
// salva no banco (só o endereço em texto).
const DESLOCAMENTO_CLIENTE = { lat: 0.015, lng: -0.012 };

let map = null;

function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Auth/login.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
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
}

// Busca, no backend, os pedidos reais do profissional logado e devolve o
// que estiver em andamento agora — é ele que decide se a tela mostra o
// mapa ou fica em branco.
async function buscarPedidoAtivo(email) {
    try {
        const resposta = await fetch(`/api/pedidos-profissional?email=${encodeURIComponent(email)}`);
        if (!resposta.ok) return null;
        const dados = await resposta.json();
        const pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];
        return pedidos.find((p) => p.status === 'em_andamento') || null;
    } catch (err) {
        console.error('Não foi possível buscar o atendimento ativo:', err);
        return null;
    }
}

async function buscarCoordenadasProprias(email) {
    if (!supabaseClient || !email) return null;

    const { data, error } = await supabaseClient
        .from('profissionais')
        .select('latitude, longitude')
        .eq('email', email)
        .limit(1);

    if (error || !data || !data.length) return null;

    const pro = data[0];
    if (pro.latitude == null || pro.longitude == null) return null;

    return { lat: Number(pro.latitude), lng: Number(pro.longitude) };
}

function initMap(pontoVoce, pontoCliente) {
    const mapWrapper = document.getElementById('mapWrapper');
    if (mapWrapper) mapWrapper.style.display = 'block';

    const centro = [
        (pontoVoce.lat + pontoCliente.lat) / 2,
        (pontoVoce.lng + pontoCliente.lng) / 2
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
        [pontoVoce.lat, pontoVoce.lng],
        [pontoCliente.lat, pontoCliente.lng]
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
        .bindPopup(`<strong>${pontoCliente.nome || 'Cliente'}</strong>`);

    const bounds = L.latLngBounds(pontos);
    map.fitBounds(bounds, { padding: [50, 50] });

    // O tamanho do mapa só fica certo depois que ele já está visível na
    // tela — sem isso o Leaflet pode desenhar os ladrilhos torto.
    setTimeout(() => map.invalidateSize(), 50);
}

function navegarPara(ponto) {
    if (!ponto) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ponto.lat},${ponto.lng}`;
    window.open(url, '_blank');
}

// Preenche o cardzinho do cliente, o card de rota e o de estatísticas
// com os dados reais do atendimento em andamento, e liga os botões de
// navegar até a localização do cliente.
function preencherPainel(pedido, pontoCliente, distancia) {
    const distanciaTexto = `${distancia.toFixed(1)} km`;
    const nome = pontoCliente.nome || 'Cliente';

    const lista = document.getElementById('clientesList');
    if (lista) {
        const valorNumero = Number(pedido.valor);
        const valorTexto = Number.isFinite(valorNumero)
            ? valorNumero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : null;

        const item = document.createElement('div');
        item.className = 'cliente-item';
        item.innerHTML = `
            <div class="cliente-topo">
                <span class="cliente-nome">${escapeHtml(nome)}</span>
                <span class="status-badge status-proximo">em andamento</span>
            </div>
            <p class="cliente-servico">${escapeHtml(pedido.titulo || 'Serviço solicitado')}</p>
            <div class="cliente-baixo">
                <div class="cliente-meta">
                    <span class="meta-item">${distanciaTexto}</span>
                </div>
                ${valorTexto ? `<span class="cliente-valor">R$ ${escapeHtml(valorTexto)}</span>` : ''}
            </div>
            <button class="btn-navegar" id="iniciarNavegacaoBtn">Iniciar navegação</button>
        `;
        lista.appendChild(item);

        const btnItem = item.querySelector('.btn-navegar');
        if (btnItem) btnItem.addEventListener('click', () => navegarPara(pontoCliente));
    }

    const rotaCard = document.getElementById('rotaCard');
    if (rotaCard) rotaCard.style.display = 'block';

    const rotaNome = document.getElementById('rotaClienteNome');
    if (rotaNome) rotaNome.textContent = nome;

    const rotaSub = document.getElementById('rotaClienteSub');
    if (rotaSub) rotaSub.textContent = distanciaTexto;

    const statsCard = document.getElementById('statsCard');
    if (statsCard) statsCard.style.display = 'block';

    const statDistancia = document.getElementById('statDistancia');
    if (statDistancia) statDistancia.textContent = distanciaTexto;

    const navegarProximoBtn = document.getElementById('navegarProximoBtn');
    if (navegarProximoBtn) navegarProximoBtn.addEventListener('click', () => navegarPara(pontoCliente));
}

async function carregarAtendimento(profissional) {
    const pedido = await buscarPedidoAtivo(profissional.email);
    if (!pedido) return; // fica com a tela em branco (estado padrão)

    const vazio = document.getElementById('atendimentoVazio');
    if (vazio) vazio.remove();

    const coordenadasReais = await buscarCoordenadasProprias(profissional.email);
    const pontoVoce = coordenadasReais || PONTO_RESERVA_PROFISSIONAL;

    const pontoClienteBase = coordenadasReais
        ? { lat: pontoVoce.lat + DESLOCAMENTO_CLIENTE.lat, lng: pontoVoce.lng + DESLOCAMENTO_CLIENTE.lng }
        : PONTO_RESERVA_EMPRESA;

    const pontoCliente = { ...pontoClienteBase, nome: pedido.usuario_nome || pedido.usuario_email || 'Cliente' };

    const distancia = calcularDistanciaKm(pontoVoce, pontoCliente);

    initMap(pontoVoce, pontoCliente);
    preencherPainel(pedido, pontoCliente, distancia);
}

document.addEventListener('DOMContentLoaded', async () => {
    const profissional = verificarLogin();
    if (profissional && profissional.email) {
        await carregarAtendimento(profissional);
    }

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
        const modoClaroIcone = document.getElementById('modoClaroIcone');
        if (modoClaroIcone) {
            modoClaroIcone.src = claro
                ? '/imagens/icones-escuro/modo-escuro-lua.png'
                : '/imagens/icones-escuro/modo-claro-sol.png';
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
                localStorage.removeItem('profissionalLogado');
                window.location.href = '/index.html';
            }
        });
    }

    // O botão de ajuda já é tratado pelo Buzz (Buzz/buzz.js), que abre
    // o chat de suporte de verdade — não precisa de handler aqui.
});
