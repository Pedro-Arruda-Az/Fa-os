
const FACOS_I18N = {
    'menu.modoClaro': { pt: 'Modo claro', en: 'Light mode' },
    'menu.modoEscuro': { pt: 'Modo escuro', en: 'Dark mode' },
    'menu.idioma': { pt: 'Idioma: PT', en: 'Language: EN' },
    'menu.sair': { pt: 'Sair', en: 'Log out' },

    'painel.titulo': { pt: 'Painel profissional', en: 'Professional dashboard' },
    'painel.resumoDoDia': { pt: 'Resumo do dia', en: "Today's summary" },
    'painel.confirmados': { pt: 'confirmados', en: 'confirmed' },
    'painel.pendente': { pt: 'pendente', en: 'pending' },
    'painel.previstos': { pt: 'previstos', en: 'expected' },
    'painel.atendimentos': { pt: 'atendimentos', en: 'appointments' },
    'painel.mensagens': { pt: 'Mensagens', en: 'Messages' },
    'painel.pedidos': { pt: 'Pedidos', en: 'Orders' },
    'painel.ultimasNotificacoes': { pt: 'Últimas notificações', en: 'Latest notifications' },
    'painel.verTodas': { pt: 'Ver todas', en: 'See all' },
    'painel.notificacoes': { pt: 'Notificações', en: 'Notifications' },
    'painel.localizacao': { pt: 'Localização', en: 'Location' },
    'painel.carteira': { pt: 'Carteira', en: 'Wallet' },
    'painel.ajudaSuporte': { pt: 'Ajuda e suporte', en: 'Help and support' },

    'titulo.mensagens': { pt: 'mensagens com clientes', en: 'messages with clients' },
    'titulo.pedidos': { pt: 'Meus pedidos', en: 'My orders' },
    'titulo.carteira': { pt: 'carteira', en: 'wallet' },
    'titulo.mapa': { pt: 'Seus atendimentos', en: 'Your appointments' },
    'titulo.notificacoes': { pt: 'notificações', en: 'notifications' }
};

function facosAplicarIdioma() {
    const idioma = localStorage.getItem('painelIdioma') || 'pt';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const chave = el.getAttribute('data-i18n');
        const entrada = FACOS_I18N[chave];
        if (entrada && entrada[idioma]) {
            el.textContent = entrada[idioma];
        }
    });

    document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR';
    return idioma;
}

function facosTrocarIdioma() {
    const atual = localStorage.getItem('painelIdioma') || 'pt';
    const novo = atual === 'pt' ? 'en' : 'pt';
    localStorage.setItem('painelIdioma', novo);
    return facosAplicarIdioma();
}

document.addEventListener('DOMContentLoaded', facosAplicarIdioma);
