
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let conversations = [];
let activeChatId = null;
let currentUser = null;
let mensagensChannel = null;
let conversasChannel = null;
let mensagensRenderizadas = new Set();

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(usuarioLogado);
}

function gerarIniciais(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatarQuando(isoString) {
    const data = new Date(isoString);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);

    const mesmoDay = (a, b) => a.toDateString() === b.toDateString();

    if (mesmoDay(data, hoje)) {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (mesmoDay(data, ontem)) {
        return 'Ontem';
    }
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

async function buscarConversas() {
    if (!supabaseClient || !currentUser) return [];

    const { data, error } = await supabaseClient
        .from('conversas')
        .select('*')
        .eq('usuario_email', currentUser.email)
        .order('ultima_mensagem_em', { ascending: false });

    if (error) {
        console.error('Erro ao buscar conversas:', error);
        return [];
    }

    return (data || []).map((c) => ({
        id: c.id,
        name: c.profissional_nome || c.profissional_email,
        initials: gerarIniciais(c.profissional_nome),
        lastMessage: c.ultima_mensagem || '',
        time: formatarQuando(c.ultima_mensagem_em),
        profissionalEmail: c.profissional_email
    }));
}

async function buscarMensagens(conversaId) {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('mensagens_chat')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('criado_em', { ascending: true });

    if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return [];
    }

    return (data || []).map((m) => ({
        from: m.remetente === 'cliente' ? 'user' : 'pro',
        text: m.texto,
        time: new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }));
}

function renderConversations(list) {
    const container = document.getElementById('conversationsList');
    const countEl = document.getElementById('chatCount');

    countEl.textContent = `${list.length} conversa${list.length !== 1 ? 's' : ''}`;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:var(--text-light);padding:2rem;font-size:0.95rem;">Nenhuma conversa ainda. Quando você contrata um serviço, a conversa com o profissional aparece aqui.</p>`;
        return;
    }

    list.forEach(conv => {
        const card = document.createElement('div');
        card.className = `conv-card${activeChatId === conv.id ? ' active' : ''}`;
        card.dataset.id = conv.id;

        card.innerHTML = `
            <div class="conv-avatar">${conv.initials}</div>
            <div class="conv-info">
                <div class="conv-name">${conv.name}</div>
                <div class="conv-last-msg">${conv.lastMessage}</div>
            </div>
            <div class="conv-time">${conv.time}</div>
        `;

        card.addEventListener('click', () => openChat(conv.id));
        container.appendChild(card);
    });
}

async function openChat(chatId) {
    const conv = conversations.find(c => c.id === chatId);
    if (!conv) return;

    activeChatId = chatId;

    document.querySelectorAll('.conv-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.conv-card[data-id="${chatId}"]`);
    if (card) card.classList.add('active');

    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('chatActive').style.display = 'flex';

    document.getElementById('chatAvatar').textContent = conv.initials;
    document.getElementById('chatContactName').textContent = conv.name;
    document.getElementById('chatContactStatus').textContent = '';

    mensagensRenderizadas = new Set();
    const mensagens = await buscarMensagens(chatId);
    renderMessages(mensagens);
    mensagens.forEach(m => m.id && mensagensRenderizadas.add(m.id));
    scrollToBottom();

    escutarMensagensEmTempoReal(chatId);
}

function escutarMensagensEmTempoReal(chatId) {
    if (!supabaseClient) return;

    if (mensagensChannel) {
        supabaseClient.removeChannel(mensagensChannel);
        mensagensChannel = null;
    }

    mensagensChannel = supabaseClient
        .channel(`mensagens-cliente-${chatId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens_chat',
            filter: `conversa_id=eq.${chatId}`
        }, (payload) => {
            adicionarMensagemNaTela(payload.new);
        })
        .subscribe();
}

function adicionarMensagemNaTela(msg) {
    if (mensagensRenderizadas.has(msg.id)) return;
    mensagensRenderizadas.add(msg.id);

    const container = document.getElementById('chatMessages');
    const vazio = container.querySelector('.chat-vazio-aviso');
    if (vazio) vazio.remove();

    const div = document.createElement('div');
    div.className = msg.remetente === 'cliente' ? 'msg-sent' : 'msg-received';
    div.innerHTML = `
        ${msg.texto}
        <span class="msg-time">${new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    container.appendChild(div);
    scrollToBottom();
}

function escutarConversasEmTempoReal() {
    if (!supabaseClient || !currentUser) return;

    conversasChannel = supabaseClient
        .channel(`conversas-cliente-${currentUser.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversas',
            filter: `usuario_email=eq.${currentUser.email}`
        }, async () => {
            conversations = await buscarConversas();
            renderConversations(conversations);
            if (activeChatId) {
                const card = document.querySelector(`.conv-card[data-id="${activeChatId}"]`);
                if (card) card.classList.add('active');
            }
        })
        .subscribe();
}

function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = `<p class="chat-vazio-aviso" style="text-align:center;color:var(--text-light);padding:2rem;font-size:0.9rem;">Nenhuma mensagem ainda. Diga oi pro profissional!</p>`;
        return;
    }

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = msg.from === 'user' ? 'msg-sent' : 'msg-received';
        div.innerHTML = `
            ${msg.text}
            <span class="msg-time">${msg.time}</span>
        `;
        container.appendChild(div);
    });
}

async function sendMessage() {
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    if (!text || activeChatId === null || !supabaseClient) return;

    const conv = conversations.find(c => c.id === activeChatId);
    if (!conv) return;

    input.value = '';

    const { error: erroMsg } = await supabaseClient
        .from('mensagens_chat')
        .insert([{
            conversa_id: activeChatId,
            remetente: 'cliente',
            texto: text
        }]);

    if (erroMsg) {
        console.error('Erro ao enviar mensagem:', erroMsg);
        alert('Não foi possível enviar a mensagem. Tente novamente.');
        return;
    }

    await supabaseClient
        .from('conversas')
        .update({ ultima_mensagem: text, ultima_mensagem_em: new Date().toISOString() })
        .eq('id', activeChatId);

    await supabaseClient
        .from('notificacoes_app')
        .insert([{
            destinatario_tipo: 'profissional',
            destinatario_email: conv.profissionalEmail,
            tipo: 'mensagem',
            titulo: 'Nova mensagem',
            descricao: `${currentUser.nome || currentUser.email} enviou uma mensagem`
        }]);
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
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

function configurarBackButton() {
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('chatPlaceholder').style.display = 'flex';
            document.getElementById('chatActive').style.display = 'none';
            activeChatId = null;
            document.querySelectorAll('.conv-card').forEach(c => c.classList.remove('active'));
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = verificarLogin();
    if (!currentUser) return;

    configurarModoEscuro();
    configurarMenuConfiguracoes();
    configurarBackButton();

    conversations = await buscarConversas();
    renderConversations(conversations);
    escutarConversasEmTempoReal();

    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);

    const input = document.getElementById('chatMessageInput');
    const sendBtn = document.getElementById('chatSendBtn');

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    sendBtn.addEventListener('click', sendMessage);

    const searchInput = document.getElementById('searchChat');
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        const filtered = conversations.filter(c =>
            !q || c.name.toLowerCase().includes(q)
        );
        renderConversations(filtered);
    });

    if (conversations.length > 0) {
        openChat(conversations[0].id);
    }
});
