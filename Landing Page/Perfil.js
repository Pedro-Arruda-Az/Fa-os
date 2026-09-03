const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '/index.html';
    }
    return usuarioLogado ? JSON.parse(usuarioLogado) : null;
}

function carregarDadosPerfil() {
    const usuario = verificarLogin();
    if (!usuario) return;

    const nome = usuario.nome || '';
    const nomeUsuario = usuario.nome_user || usuario.email?.split('@')[0] || 'usuario';
    const telefone = usuario.telefone || '(00) 00000-0000';
    const endereco = usuario.endereco || 'Rua XXXXX, 000 - Cidade, Estado';
    const sexo = usuario.sexo || 'Prefiro não dizer';

    const iniciais = nome ? nome.substring(0, 2).toUpperCase() : nomeUsuario.substring(0, 2).toUpperCase();

    document.getElementById('avatarIniciais').textContent = iniciais;

    document.getElementById('editNome').value = nome;
    document.getElementById('editTelefone').value = telefone;
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
        alert('Por favor, preencha o nome!');
        return;
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const dadosAtualizar = {
        nome: nome,
        telefone: telefone,
        sexo: sexo,
        endereco: endereco
    };

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
            alert('Erro ao salvar: ' + error.message);
            return;
        }

        const usuarioAtualizado = { ...usuario, ...dadosAtualizar };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

        alert('Alterações salvas com sucesso!');
        
        carregarDadosPerfil();
        
        document.getElementById('editSenha').value = '';
        
    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('Erro ao conectar com o servidor!');
    }
}

function trocarFotoPerfil() {
    const input = document.getElementById('fotoInput');
    input.click();

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const avatarCircle = document.getElementById('avatarCircle');
                avatarCircle.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                localStorage.setItem('fotoPerfil', event.target.result);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('Por favor, selecione uma imagem válida!');
        }
    };
}

function carregarFotoSalva() {
    const fotoSalva = localStorage.getItem('fotoPerfil');
    if (fotoSalva) {
        const avatarCircle = document.getElementById('avatarCircle');
        avatarCircle.innerHTML = `<img src="${fotoSalva}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
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

function inicializar() {
    verificarLogin();
    carregarDadosPerfil();
    carregarFotoSalva();
    configurarModoEscuro();
    configurarMenuConfiguracoes();

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