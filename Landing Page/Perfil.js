const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
    return usuarioLogado ? JSON.parse(usuarioLogado) : null;
}

function idiomaAtualPerfil() {
    return window.facosClienteIdiomaAtual ? facosClienteIdiomaAtual() : 'pt';
}

// Atualiza o placeholder do campo telefone conforme idioma + se já existe
// telefone cadastrado. Separado de carregarDadosPerfil() pra poder ser
// chamado de novo quando o usuário só troca o idioma (sem recarregar tudo).
function atualizarPlaceholderTelefone() {
    const telefoneInput = document.getElementById('editTelefone');
    if (!telefoneInput) return;
    const usuarioLogadoRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioLogadoRaw ? JSON.parse(usuarioLogadoRaw) : null;
    telefoneInput.placeholder = (usuario && usuario.telefone)
        ? traduzirCliente('perfil.telefoneCadastrado')
        : '(11) 99999-9999';
}

function carregarDadosPerfil() {
    const usuario = verificarLogin();
    if (!usuario) return;

    const nome = usuario.nome || '';
    const nomeUsuario = usuario.nome_user || usuario.email?.split('@')[0] || 'usuario';
    const endereco = usuario.endereco || traduzirCliente('perfil.enderecoPadrao');
    const sexo = usuario.sexo || 'Prefiro não dizer';

    const iniciais = nome ? nome.substring(0, 2).toUpperCase() : nomeUsuario.substring(0, 2).toUpperCase();

    document.getElementById('avatarIniciais').textContent = iniciais;

    document.getElementById('editNome').value = nome;
    document.getElementById('editTelefone').value = '';
    atualizarPlaceholderTelefone();
    document.getElementById('editSexo').value = sexo;
    document.getElementById('editEndereco').value = endereco;
}

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/index.html';
}

function formatarTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 0) {
        if (valor.length <= 2) {
            valor = `(${valor}`;
        } else if (valor.length <= 7) {
            valor = `(${valor.substring(0, 2)})${valor.substring(2)}`;
        } else if (valor.length <= 11) {
            valor = `(${valor.substring(0, 2)})${valor.substring(2, 7)}-${valor.substring(7, 11)}`;
        }
    }
    input.value = valor;
}

async function salvarAlteracoes() {
    const usuario = verificarLogin();
    if (!usuario) return;

    const nome = document.getElementById('editNome').value;
    const telefone = document.getElementById('editTelefone').value;
    const sexo = document.getElementById('editSexo').value;
    const endereco = document.getElementById('editEndereco').value;
    const novaSenha = document.getElementById('editSenha').value;

    if (!nome) {
        alert(traduzirCliente('perfil.alertaNomeObrigatorio'));
        return;
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const dadosAtualizar = {
        nome: nome,
        sexo: sexo,
        endereco: endereco
    };

    // Endereço mudou? Tenta achar a coordenada de novo, pra tela de
    // localização mostrar o pino certo. Se o endereço não mudou desde a
    // última vez, não precisa geocodificar de novo.
    if (endereco && endereco.trim() !== '' && endereco !== (usuario.endereco || '') && window.geocodificarEndereco) {
        const coordenadas = await geocodificarEndereco(endereco);
        if (coordenadas) {
            dadosAtualizar.latitude = coordenadas.latitude;
            dadosAtualizar.longitude = coordenadas.longitude;
        }
    }

    if (telefone && telefone.trim() !== '') {
        dadosAtualizar.telefone = CryptoJS.SHA256(telefone.replace(/\D/g, '')).toString(CryptoJS.enc.Hex);
    }

    if (novaSenha && novaSenha.trim() !== '') {
        const senhaHash = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Hex);
        dadosAtualizar.senha = senhaHash;
    }

    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .update(dadosAtualizar)
            .eq('id', usuario.id);

        if (error) {
            alert(traduzirCliente('perfil.alertaErroSalvarPrefixo') + error.message);
            return;
        }

        const usuarioAtualizado = { ...usuario, ...dadosAtualizar };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

        alert(traduzirCliente('perfil.alertaSalvoSucesso'));

        carregarDadosPerfil();

        document.getElementById('editSenha').value = '';

    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert(traduzirCliente('perfil.alertaErroServidor'));
    }
}

function trocarFotoPerfil() {
    const input = document.getElementById('fotoInput');
    input.click();

    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert(traduzirCliente('perfil.alertaImagemInvalida'));
            return;
        }

        const usuario = verificarLogin();
        if (!usuario) return;

        try {
            const fotoBase64 = await redimensionarFoto(file);

            const avatarCircle = document.getElementById('avatarCircle');
            avatarCircle.innerHTML = avatarConteudo(fotoBase64, null);

            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { error } = await supabaseClient
                .from('usuarios')
                .update({ foto_perfil: fotoBase64 })
                .eq('id', usuario.id);

            if (error) {
                console.error(error);
                alert(traduzirCliente('perfil.alertaErroFoto'));
                return;
            }

            const usuarioAtualizado = { ...usuario, foto_perfil: fotoBase64 };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
        } catch (err) {
            console.error(err);
            alert(traduzirCliente('perfil.alertaErroFoto'));
        }
    };
}

function carregarFotoSalva() {
    const usuario = verificarLogin();
    if (usuario && usuario.foto_perfil) {
        const avatarCircle = document.getElementById('avatarCircle');
        avatarCircle.innerHTML = avatarConteudo(usuario.foto_perfil, null);
    }
}

function configurarModoEscuro() {
    const modoClaroBtn = document.getElementById('modoClaroBtn');
    const modoClaroLabel = document.getElementById('modoClaroLabel');
    if (!modoClaroBtn) return;

    function aplicarModo(escuro) {
        document.body.classList.toggle('dark-mode', escuro);
        if (modoClaroLabel) {
            modoClaroLabel.setAttribute('data-i18n', escuro ? 'menu.modoClaro' : 'menu.modoEscuro');
            if (window.facosClienteAplicarIdioma) facosClienteAplicarIdioma();
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

// Retraduz pedacinhos da tela que não usam data-i18n (tooltips, título da
// aba, placeholder que depende de dado do usuário) porque não são um
// simples textContent/innerHTML/placeholder fixo.
function atualizarTraducoesExtrasPerfil() {
    const idioma = idiomaAtualPerfil();

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

    const tituloAba = document.getElementById('pageTitleTag');
    if (tituloAba) tituloAba.textContent = idioma === 'en' ? 'Faços - My Profile' : 'Faços - Meu Perfil';

    atualizarPlaceholderTelefone();
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
            atualizarTraducoesExtrasPerfil();
        });
    }
}

function inicializar() {
    verificarLogin();
    carregarDadosPerfil();
    carregarFotoSalva();
    configurarModoEscuro();
    configurarMenuConfiguracoes();
    atualizarTraducoesExtrasPerfil();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', fazerLogout);

    const salvarBtn = document.getElementById('salvarBtn');
    if (salvarBtn) salvarBtn.addEventListener('click', salvarAlteracoes);

    const trocarFotoBtn = document.getElementById('trocarFotoBtn');
    if (trocarFotoBtn) trocarFotoBtn.addEventListener('click', trocarFotoPerfil);

    const telefoneInput = document.getElementById('editTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }
}

document.addEventListener('DOMContentLoaded', inicializar);