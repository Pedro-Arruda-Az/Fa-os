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

// ===== Busca (barra de pesquisa do início) =====

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let buscaSupabaseClient;
if (window.supabase) {
    buscaSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Mesmas 6 categorias do cadastro/profissional, com sinônimos/variações
// (sem acento, no plural, etc.) pra reconhecer o que a pessoa digitar.
const CATEGORIAS_BUSCA = [
    {
        area: 'Limpeza',
        chave: 'servico.limpeza',
        pagina: '/Servicos/Limpeza.html',
        palavras: ['limpeza', 'limpar', 'faxina', 'diarista', 'higienizacao']
    },
    {
        area: 'Eletricista',
        chave: 'servico.eletricista',
        pagina: '/Servicos/Eletricista.html',
        palavras: ['eletricista', 'eletrica', 'eletricidade', 'energia', 'fiacao', 'chuveiro', 'tomada']
    },
    {
        area: 'Casa e instalações',
        chave: 'servico.casaInstalacoes',
        pagina: '/Servicos/CasaInstalacoes.html',
        palavras: ['casa', 'instalacao', 'instalacoes', 'montagem', 'montador', 'reforma', 'marcenaria', 'moveis']
    },
    {
        area: 'Manutenção',
        chave: 'servico.manutencao',
        pagina: '/Servicos/Manutencao.html',
        palavras: ['manutencao', 'reparo', 'conserto', 'consertar', 'reparar']
    },
    {
        area: 'Jardinagem e áreas externas',
        chave: 'servico.jardinagem',
        pagina: '/Servicos/Jardinagem.html',
        palavras: ['jardinagem', 'jardim', 'jardineiro', 'quintal', 'grama', 'area externa', 'paisagismo', 'piscina']
    },
    {
        area: 'Tecnologia e assistência',
        chave: 'servico.tecnologia',
        pagina: '/Servicos/TecnologiaAssistencia.html',
        palavras: ['tecnologia', 'assistencia', 'assistencia tecnica', 'computador', 'notebook', 'celular', 'informatica', 'wifi', 'rede', 'ti']
    }
];

// ===== Textos dinâmicos da busca (i18n) =====
// Pequenas helpers que montam texto com variáveis (query, contagem) e por
// isso não dá pra usar traduzirCliente('chave') puro — olham o idioma atual
// direto e montam a frase certa nos dois idiomas.

function idiomaAtualTelaIni() {
    return window.facosClienteIdiomaAtual ? facosClienteIdiomaAtual() : 'pt';
}

function textoResultadosTitulo(query) {
    return idiomaAtualTelaIni() === 'en' ? `Results for "${query}"` : `Resultados para "${query}"`;
}

function textoContagemEncontrados(n) {
    if (idiomaAtualTelaIni() === 'en') return `${n} professional${n !== 1 ? 's' : ''} found`;
    return `${n} ${n !== 1 ? 'profissionais encontrados' : 'profissional encontrado'}`;
}

function textoSemResultados(query) {
    return idiomaAtualTelaIni() === 'en'
        ? `No results for "${query}". Try terms like cleaning, electrical, maintenance, gardening, home & installations or technology.`
        : `Nenhum resultado para "${query}". Tente termos como limpeza, elétrica, manutenção, jardinagem, casa e instalações ou tecnologia.`;
}

// Retraduz os textos da seção de resultados de busca (título, contagem e
// mensagem de "sem resultados") quando o idioma é trocado sem refazer a
// busca — usa os data-atributos deixados por executarBusca().
function atualizarTextosBuscaIdioma() {
    const tituloEl = document.getElementById('searchResultsTitle');
    if (tituloEl && tituloEl.dataset.query) {
        tituloEl.textContent = textoResultadosTitulo(tituloEl.dataset.query);
    }

    const contagemEl = document.getElementById('searchResultsCount');
    if (contagemEl && contagemEl.dataset.count !== undefined) {
        contagemEl.textContent = textoContagemEncontrados(Number(contagemEl.dataset.count));
    }

    document.querySelectorAll('.search-results-vazio[data-query]').forEach((el) => {
        el.textContent = textoSemResultados(el.dataset.query);
    });
}

// Retraduz pedacinhos da tela que não usam data-i18n (tooltips, alt de
// imagem, título da aba) porque não são simples textContent/innerHTML.
function atualizarTraducoesExtrasTelaIni() {
    const idioma = idiomaAtualTelaIni();

    const linkPerfil = document.getElementById('topbarProfileLink');
    if (linkPerfil) linkPerfil.title = window.traduzirCliente ? traduzirCliente('landingpage.tooltipMeuPerfil') : (idioma === 'en' ? 'My profile' : 'Meu perfil');

    const linkInicio = document.getElementById('topbarInicioLink');
    if (linkInicio) linkInicio.title = window.traduzirCliente ? traduzirCliente('menu.inicio') : (idioma === 'en' ? 'Home' : 'Início');

    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        const rotulo = window.traduzirCliente ? traduzirCliente('menu.configuracoes') : (idioma === 'en' ? 'Settings' : 'Configurações');
        configBtn.title = rotulo;
        configBtn.setAttribute('aria-label', rotulo);
    }

    const heroImg = document.getElementById('heroInicioImg');
    if (heroImg) heroImg.alt = idioma === 'en' ? 'Cozy living room' : 'Sala de estar aconchegante';

    const tituloAba = document.getElementById('pageTitleTag');
    if (tituloAba) tituloAba.textContent = idioma === 'en' ? 'Faços - Find professionals' : 'Faços - Encontre profissionais';

    atualizarTextosBuscaIdioma();
}

function normalizarTextoBusca(texto) {
    return (texto || '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // remove acentos
        .toLowerCase()
        .trim();
}

function gerarIniciaisBusca(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function categoriasQueBatem(queryNormalizada) {
    if (!queryNormalizada) return [];
    return CATEGORIAS_BUSCA.filter((cat) => {
        const areaNormalizada = normalizarTextoBusca(cat.area);
        if (areaNormalizada.includes(queryNormalizada) || queryNormalizada.includes(areaNormalizada)) return true;
        return cat.palavras.some((p) => queryNormalizada.includes(p) || p.includes(queryNormalizada));
    });
}

async function buscarProfissionaisPorNome(queryOriginal) {
    if (!buscaSupabaseClient || !queryOriginal) return [];
    const { data, error } = await buscaSupabaseClient
        .from('profissionais')
        .select('*')
        .eq('status', 'ativo')
        .ilike('nome_empresa', `%${queryOriginal}%`);

    if (error) {
        console.error('Erro ao buscar profissionais por nome:', error);
        return [];
    }
    return data || [];
}

function mapearParaCard(row, area, index) {
    return {
        id: row.id,
        name: row.nome_empresa,
        service: area,
        rating: row.avaliacao !== null && row.avaliacao !== undefined ? Number(row.avaliacao) : 0,
        totalAvaliacoes: Number(row.total_avaliacoes || 0),
        distance: Number((0.8 + (index % 6) * 0.6).toFixed(1)),
        initials: gerarIniciaisBusca(row.nome_empresa),
        foto: row.foto_perfil || null
    };
}

function buildStarsBusca(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star${i <= Math.round(rating) ? '' : ' empty'}">★</span>`;
    }
    return html;
}

async function executarBusca(queryOriginal) {
    const queryLimpa = (queryOriginal || '').trim();

    if (!queryLimpa) {
        limparBusca();
        return;
    }

    const queryNormalizada = normalizarTextoBusca(queryLimpa);
    const categoriasEncontradas = categoriasQueBatem(queryNormalizada);

    // Se o que a pessoa digitou já bate com um serviço (limpeza,
    // manutenção, jardinagem...), manda direto pra tela daquele serviço
    // — sem precisar mostrar uma lista intermediária aqui.
    if (categoriasEncontradas.length > 0) {
        window.location.href = categoriasEncontradas[0].pagina;
        return;
    }

    const secaoResultados = document.getElementById('searchResultsSection');
    const secaoServicos = document.getElementById('defaultSectionServicos');
    const secaoStats = document.getElementById('defaultSectionStats');
    const listaEl = document.getElementById('searchResultsList');
    const contagemEl = document.getElementById('searchResultsCount');
    const tituloEl = document.getElementById('searchResultsTitle');

    tituloEl.textContent = textoResultadosTitulo(queryLimpa);
    tituloEl.dataset.query = queryLimpa;
    listaEl.innerHTML = `<p class="search-results-vazio">${traduzirCliente('telaini.buscando')}</p>`;
    contagemEl.textContent = '';
    delete contagemEl.dataset.count;
    secaoResultados.style.display = '';
    secaoServicos.style.display = 'none';
    secaoStats.style.display = 'none';

    // Não bateu com nenhuma categoria — tenta achar pelo nome do
    // profissional. Se achar só um, manda direto pra tela dele também;
    // se achar mais de um (ou nenhum), aí sim mostra a lista pra escolher.
    if (queryLimpa.length < 2) {
        listaEl.innerHTML = `<p class="search-results-vazio" data-query="${queryLimpa}">${textoSemResultados(queryLimpa)}</p>`;
        contagemEl.textContent = textoContagemEncontrados(0);
        contagemEl.dataset.count = '0';
        return;
    }

    const rowsPorNome = await buscarProfissionaisPorNome(queryLimpa);

    if (rowsPorNome.length === 1) {
        const row = rowsPorNome[0];
        const catDoProfissional = CATEGORIAS_BUSCA.find((c) => c.area === row.area_atuacao);
        window.location.href = catDoProfissional ? catDoProfissional.pagina : '/Localizacao/Localizacao.html';
        return;
    }

    contagemEl.textContent = textoContagemEncontrados(rowsPorNome.length);
    contagemEl.dataset.count = String(rowsPorNome.length);
    listaEl.innerHTML = '';

    if (rowsPorNome.length === 0) {
        listaEl.innerHTML = `<p class="search-results-vazio" data-query="${queryLimpa}">${textoSemResultados(queryLimpa)}</p>`;
        return;
    }

    rowsPorNome.forEach((row, index) => {
        const catDoProfissional = CATEGORIAS_BUSCA.find((c) => c.area === row.area_atuacao);
        const areaChave = catDoProfissional ? catDoProfissional.chave : null;
        const areaLabel = areaChave
            ? traduzirCliente(areaChave)
            : (row.area_atuacao || traduzirCliente('telaini.servicoGenerico'));
        const pagina = catDoProfissional ? catDoProfissional.pagina : '/Localizacao/Localizacao.html';
        const pro = { ...mapearParaCard(row, areaLabel, index), pagina };
        // Só usamos data-i18n aqui quando o serviço bateu com uma categoria
        // conhecida (chave existe no dicionário) — nome vindo direto do
        // banco (row.area_atuacao) é dado do profissional, não traduzimos.
        const atributoServico = areaChave ? ` data-i18n="${areaChave}"` : '';

        const card = document.createElement('div');
        card.className = 'pro-card';
        card.innerHTML = `
            <div class="pro-avatar">${avatarConteudo(pro.foto, pro.initials)}</div>
            <div class="pro-info">
                <div class="pro-name">${pro.name}</div>
                <div class="pro-service"${atributoServico}>${pro.service}</div>
                <div class="pro-meta">
                    <span class="pro-dist">${pro.distance} km</span>
                    <div class="pro-rating-wrap">
                        ${pro.totalAvaliacoes > 0
                            ? `<div class="stars">${buildStarsBusca(pro.rating)}</div><span class="pro-score">${pro.rating.toFixed(1)}</span>`
                            : `<span class="pro-score pro-score-novo">${traduzirCliente('servicosPag.semAvaliacoesLabel')}</span>`}
                    </div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = pro.pagina;
        });
        listaEl.appendChild(card);
    });
}

function limparBusca() {
    const buscaInicioInput = document.getElementById('buscaInicioInput');
    if (buscaInicioInput) buscaInicioInput.value = '';

    document.getElementById('searchResultsSection').style.display = 'none';
    document.getElementById('defaultSectionServicos').style.display = '';
    document.getElementById('defaultSectionStats').style.display = '';
}

document.addEventListener('DOMContentLoaded', () => {
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

    if (modoClaroBtn) {
        modoClaroBtn.addEventListener('click', function () {
            const escuro = !document.body.classList.contains('dark-mode');
            aplicarModo(escuro);
            localStorage.setItem('darkMode', escuro ? 'enabled' : 'disabled');
        });
    }

    atualizarTraducoesExtrasTelaIni();

    const idiomaBtn = document.getElementById('idiomaBtn');
    if (idiomaBtn) {
        idiomaBtn.addEventListener('click', function () {
            if (window.facosClienteTrocarIdioma) facosClienteTrocarIdioma();
            atualizarTraducoesExtrasTelaIni();
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', fazerLogout);
    }

    const buscaInicioInput = document.getElementById('buscaInicioInput');
    const buscaInicioBtn = document.getElementById('buscaInicioBtn');
    const searchResultsClear = document.getElementById('searchResultsClear');

    if (buscaInicioBtn && buscaInicioInput) {
        buscaInicioBtn.addEventListener('click', () => {
            executarBusca(buscaInicioInput.value);
        });
        buscaInicioInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executarBusca(buscaInicioInput.value);
            }
        });
    }

    if (searchResultsClear) {
        searchResultsClear.addEventListener('click', limparBusca);
    }
});
