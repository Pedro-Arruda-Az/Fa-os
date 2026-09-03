
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const CATEGORIAS = [
    { area: 'Limpeza', listaId: 'lista-Limpeza', pagina: '/Servicos/Limpeza.html' },
    { area: 'Eletricista', listaId: 'lista-Eletricista', pagina: '/Servicos/Eletricista.html' },
    { area: 'Casa e instalações', listaId: 'lista-CasaInstalacoes', pagina: '/Servicos/CasaInstalacoes.html' },
    { area: 'Manutenção', listaId: 'lista-Manutencao', pagina: '/Servicos/Manutencao.html' },
    { area: 'Jardinagem e áreas externas', listaId: 'lista-Jardinagem', pagina: '/Servicos/Jardinagem.html' },
    { area: 'Tecnologia e assistência', listaId: 'lista-Tecnologia', pagina: '/Servicos/TecnologiaAssistencia.html' }
];

let todosOsProfissionais = [];

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
}

function gerarIniciais(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

async function buscarProfissionaisPorCategoria(area) {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('profissionais')
        .select('*')
        .eq('area_atuacao', area)
        .eq('status', 'ativo');

    if (error) {
        console.error(`Erro ao buscar profissionais de ${area}:`, error);
        return [];
    }

    return (data || []).map((row, index) => ({
        id: row.id,
        name: row.nome_empresa,
        service: area,
        distance: Number((0.8 + (index % 6) * 0.6).toFixed(1)),
        price: `R$ ${Number(row.preco_servico || 0).toFixed(2).replace('.', ',')}`,
        initials: gerarIniciais(row.nome_empresa)
    }));
}

function renderColuna(listaId, pagina, profissionais) {
    const container = document.getElementById(listaId);
    if (!container) return;

    container.innerHTML = '';

    if (profissionais.length === 0) {
        container.innerHTML = `<p class="categoria-vazio">Nenhum profissional cadastrado ainda.</p>`;
        return;
    }

    profissionais.forEach((pro) => {
        const card = document.createElement('div');
        card.className = 'pro-card';
        card.dataset.id = pro.id;
        card.dataset.nome = pro.name.toLowerCase();

        card.innerHTML = `
            <div class="pro-avatar">${pro.initials}</div>
            <div class="pro-info">
                <div class="pro-name">${pro.name}</div>
                <div class="pro-service">${pro.price}</div>
            </div>
            <div class="pro-dist">${pro.distance} km</div>
        `;

        card.addEventListener('click', () => {
            window.location.href = pagina;
        });

        container.appendChild(card);
    });
}

async function carregarTodasCategorias() {
    const resultados = await Promise.all(
        CATEGORIAS.map(async (cat) => {
            const profissionais = await buscarProfissionaisPorCategoria(cat.area);
            return { ...cat, profissionais };
        })
    );

    todosOsProfissionais = [];

    resultados.forEach(({ listaId, pagina, profissionais, area }) => {
        renderColuna(listaId, pagina, profissionais);
        profissionais.forEach((p) => todosOsProfissionais.push({ ...p, listaId, pagina, area }));
    });
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
    verificarLogin();
    configurarModoEscuro();
    configurarMenuConfiguracoes();

    await carregarTodasCategorias();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', fazerLogout);
});
