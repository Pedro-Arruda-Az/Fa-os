const FACOS_I18N_CLIENTE = {
    'menu.modoClaro': { pt: 'Modo claro', en: 'Light mode' },
    'menu.modoEscuro': { pt: 'Modo escuro', en: 'Dark mode' },
    'menu.idioma': { pt: 'Idioma: PT', en: 'Language: EN' },
    'menu.sair': { pt: 'Sair', en: 'Log out' },
    'menu.inicio': { pt: 'Início', en: 'Home' },
    'menu.notificacoes': { pt: 'Notificações', en: 'Notifications' },
    'menu.mensagens': { pt: 'Mensagens', en: 'Messages' },
    'menu.pedidos': { pt: 'Pedidos', en: 'Orders' },
    'menu.localizacao': { pt: 'Localização', en: 'Location' },
    'menu.servicos': { pt: 'Serviços', en: 'Services' },
    'menu.carteira': { pt: 'Carteira', en: 'Wallet' },
    'menu.configuracoes': { pt: 'Configurações', en: 'Settings' },

    'tela.titulo': { pt: 'Encontre profissionais disponíveis<br>perto de você!', en: 'Find available professionals<br>near you!' },
    'tela.tituloHero': { pt: 'Encontre profissionais <span class="accent">disponíveis</span> perto de você', en: 'Find <span class="accent">available</span> professionals near you' },
    'tela.subHero': { pt: 'Serviços de manutenção, limpeza, instalações e muito mais, de forma rápida, segura e prática.', en: 'Maintenance, cleaning, installation services and much more, fast, safe and practical.' },
    'tela.buscar': { pt: 'Buscar', en: 'Search' },
    'tela.buscaPlaceholder': { pt: 'Buscar por serviço ou profissional...', en: 'Search for a service or professional...' },
    'tela.servicosMaisProcurados': { pt: 'Serviços mais procurados', en: 'Most sought-after services' },
    'tela.estatisticas': { pt: 'Estatísticas da plataforma', en: 'Platform statistics' },
    'tela.profissionaisAtivos': { pt: 'Profissionais cadastrados', en: 'Registered professionals' },
    'tela.servicosRealizados': { pt: 'Serviços concluídos', en: 'Completed services' },
    'tela.avaliacaoMedia': { pt: 'Avaliação média', en: 'Average rating' },
    'tela.satisfacao': { pt: 'Satisfação dos clientes', en: 'Customer satisfaction' },
    'tela.sejaProfissional': { pt: 'Seja um Profissional', en: 'Become a Professional' },
    'tela.ajudaSuporte': { pt: 'Ajuda / Suporte', en: 'Help / Support' },

    'servico.limpeza': { pt: 'Limpeza', en: 'Cleaning' },
    'servico.eletricista': { pt: 'Eletricista', en: 'Electrician' },
    'servico.casaInstalacoes': { pt: 'Casa e instalações', en: 'Home & installations' },
    'servico.manutencao': { pt: 'Manutenção', en: 'Maintenance' },
    'servico.jardinagem': { pt: 'Jardinagem e áreas externas', en: 'Gardening & outdoor areas' },
    'servico.tecnologia': { pt: 'Tecnologia e assistência', en: 'Tech & assistance' }
};

function facosClienteAplicarIdioma() {
    const idioma = localStorage.getItem('painelIdiomaCliente') || 'pt';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const chave = el.getAttribute('data-i18n');
        const entrada = FACOS_I18N_CLIENTE[chave];
        if (entrada && entrada[idioma]) {
            el.textContent = entrada[idioma];
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const chave = el.getAttribute('data-i18n-html');
        const entrada = FACOS_I18N_CLIENTE[chave];
        if (entrada && entrada[idioma]) {
            el.innerHTML = entrada[idioma];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const chave = el.getAttribute('data-i18n-placeholder');
        const entrada = FACOS_I18N_CLIENTE[chave];
        if (entrada && entrada[idioma]) {
            el.setAttribute('placeholder', entrada[idioma]);
        }
    });

    document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR';
    return idioma;
}

function facosClienteTrocarIdioma() {
    const atual = localStorage.getItem('painelIdiomaCliente') || 'pt';
    const novo = atual === 'pt' ? 'en' : 'pt';
    localStorage.setItem('painelIdiomaCliente', novo);
    return facosClienteAplicarIdioma();
}

document.addEventListener('DOMContentLoaded', facosClienteAplicarIdioma);
