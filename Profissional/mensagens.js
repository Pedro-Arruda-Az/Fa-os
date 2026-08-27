/* ============================================================
   FAÇOS - mensagens.js
   Mensagens com clientes (painel do profissional, dados reais)
   ============================================================ */

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let profissionalAtual = null;
let conversas = [];
let conversaAtivaId = null;
let mensagensChannel = null;
let conversasChannel = null;
let mensagensRenderizadas = new Set();

// ========== VERIFICAR LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
        return null;
    }
    return JSON.parse(profissional);
}

// ========== BUSCAR CONVERSAS REAIS ==========
async function buscarConversas() {
    if (!supabaseClient || !profissionalAtual) return [];

    const { data, error } = await supabaseClient
        .from('conversas')
        .select('*')
        .eq('profissional_email', profissionalAtual.email)
        .order('ultima_mensagem_em', { ascending: false });

    if (error) {
        console.error('Erro ao buscar conversas:', error);
        return [];
    }

    return data || [];
}

// ========== BUSCAR MENSAGENS DE UMA CONVERSA ==========
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

    return data || [];
}

// ========== FORMATAR HORA/DATA ==========
function formatarQuando(isoString) {
    const data = new Date(isoString);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);

    const mesmoDia = (a, b) => a.toDateString() === b.toDateString();

    if (mesmoDia(data, hoje)) {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (mesmoDia(data, ontem)) {
        return 'Ontem';
    }
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ========== ELEMENTOS ==========
const conversasList = document.getElementById('conversasList');
const chatMensagens = document.getElementById('chatMensagens');
const chatContatoNome = document.getElementById('chatContatoNome');
const chatInput = document.getElementById('chatInput');
const enviarBtn = document.getElementById('enviarBtn');

// ========== RENDERIZAR LISTA DE CONVERSAS ==========
function renderizarLista() {
    conversasList.innerHTML = '';

    if (conversas.length === 0) {
        conversasList.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2rem 1rem;font-size:0.9rem;">Nenhuma conversa ainda. Quando um cliente contrata seu serviço, a conversa aparece aqui.</p>`;
        return;
    }

    conversas.forEach((c) => {
        const btn = document.createElement('button');
        btn.className = `conversa-item${conversaAtivaId === c.id ? ' active' : ''}`;
        btn.dataset.id = c.id;

        btn.innerHTML = `
            <div class="conversa-top">
                <span class="conversa-nome">${c.usuario_nome || c.usuario_email}</span>
                <span class="conversa-hora">${formatarQuando(c.ultima_mensagem_em)}</span>
            </div>
            <p class="conversa-preview">${c.ultima_mensagem || ''}</p>
        `;

        conversasList.appendChild(btn);
    });
}

// ========== RENDERIZAR MENSAGENS ==========
function renderizarMensagens(mensagens) {
    chatMensagens.innerHTML = '';

    if (mensagens.length === 0) {
        chatMensagens.innerHTML = `<p class="chat-vazio-aviso" style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.9rem;">Nenhuma mensagem ainda.</p>`;
        return;
    }

    mensagens.forEach((msg) => {
        const bubble = document.createElement('div');
        const enviada = msg.remetente === 'profissional';
        bubble.className = `msg-bubble ${enviada ? 'msg-enviada' : 'msg-recebida'}`;

        const texto = document.createElement('p');
        texto.className = 'msg-texto';
        texto.textContent = msg.texto;

        const hora = document.createElement('span');
        hora.className = 'msg-hora';
        hora.textContent = new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(texto);
        bubble.appendChild(hora);
        chatMensagens.appendChild(bubble);
    });

    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

// ========== ABRIR CONVERSA ==========
async function abrirConversa(id) {
    const conversa = conversas.find((c) => c.id === id);
    if (!conversa) return;

    conversaAtivaId = id;
    chatContatoNome.textContent = conversa.usuario_nome || conversa.usuario_email;

    document.querySelectorAll('.conversa-item').forEach((el) => el.classList.remove('active'));
    const item = document.querySelector(`.conversa-item[data-id="${id}"]`);
    if (item) item.classList.add('active');

    mensagensRenderizadas = new Set();
    const mensagens = await buscarMensagens(id);
    renderizarMensagens(mensagens);
    mensagens.forEach((m) => m.id && mensagensRenderizadas.add(m.id));

    escutarMensagensEmTempoReal(id);
}

// ========== TEMPO REAL: NOVAS MENSAGENS NESSA CONVERSA ==========
function escutarMensagensEmTempoReal(conversaId) {
    if (!supabaseClient) return;

    if (mensagensChannel) {
        supabaseClient.removeChannel(mensagensChannel);
        mensagensChannel = null;
    }

    mensagensChannel = supabaseClient
        .channel(`mensagens-profissional-${conversaId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens_chat',
            filter: `conversa_id=eq.${conversaId}`
        }, (payload) => {
            adicionarMensagemNaTela(payload.new);
        })
        .subscribe();
}

function adicionarMensagemNaTela(msg) {
    if (mensagensRenderizadas.has(msg.id)) return;
    mensagensRenderizadas.add(msg.id);

    const vazio = chatMensagens.querySelector('.chat-vazio-aviso');
    if (vazio) vazio.remove();

    const bubble = document.createElement('div');
    const enviada = msg.remetente === 'profissional';
    bubble.className = `msg-bubble ${enviada ? 'msg-enviada' : 'msg-recebida'}`;

    const texto = document.createElement('p');
    texto.className = 'msg-texto';
    texto.textContent = msg.texto;

    const hora = document.createElement('span');
    hora.className = 'msg-hora';
    hora.textContent = new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    bubble.appendChild(texto);
    bubble.appendChild(hora);
    chatMensagens.appendChild(bubble);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

// ========== TEMPO REAL: LISTA DE CONVERSAS ==========
function escutarConversasEmTempoReal() {
    if (!supabaseClient || !profissionalAtual) return;

    conversasChannel = supabaseClient
        .channel(`conversas-profissional-${profissionalAtual.email}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversas',
            filter: `profissional_email=eq.${profissionalAtual.email}`
        }, async () => {
            conversas = await buscarConversas();
            renderizarLista();
            if (conversaAtivaId) {
                const item = document.querySelector(`.conversa-item[data-id="${conversaAtivaId}"]`);
                if (item) item.classList.add('active');
            }
        })
        .subscribe();
}

// ========== TROCAR CONVERSA AO CLICAR ==========
if (conversasList) {
    conversasList.addEventListener('click', function (e) {
        const item = e.target.closest('.conversa-item');
        if (!item) return;
        abrirConversa(item.dataset.id);
    });
}

// ========== ENVIAR MENSAGEM ==========
async function enviarMensagem() {
    const texto = chatInput.value.trim();
    if (!texto || !conversaAtivaId || !supabaseClient) return;

    chatInput.value = '';

    const { error: erroMsg } = await supabaseClient
        .from('mensagens_chat')
        .insert([{
            conversa_id: conversaAtivaId,
            remetente: 'profissional',
            texto
        }]);

    if (erroMsg) {
        console.error('Erro ao enviar mensagem:', erroMsg);
        alert('Não foi possível enviar a mensagem. Tente novamente.');
        return;
    }

    // A própria mensagem aparece na tela via tempo real (evento INSERT).
    await supabaseClient
        .from('conversas')
        .update({ ultima_mensagem: texto, ultima_mensagem_em: new Date().toISOString() })
        .eq('id', conversaAtivaId);
}

if (enviarBtn) {
    enviarBtn.addEventListener('click', enviarMensagem);
}

if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') enviarMensagem();
    });
}

// ========== MENU DE CONFIGURAÇÕES (ENGRENAGEM) ==========
function configurarMenuConfiguracoes() {
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
                localStorage.removeItem('profissionalLogado');
                window.location.href = '/index.html';
            }
        });
    }
}

configurarMenuConfiguracoes();

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', async () => {
    profissionalAtual = verificarLogin();
    if (!profissionalAtual) return;

    conversas = await buscarConversas();
    renderizarLista();
    escutarConversasEmTempoReal();

    if (conversas.length > 0) {
        abrirConversa(conversas[0].id);
    }
});
