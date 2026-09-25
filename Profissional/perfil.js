
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Auth/login.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

function formatarTelefone(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    input.value = v;
}

function carregarDadosPerfil() {
    const profissional = verificarLogin();
    if (!profissional) return;

    const nomeEmpresa = profissional.nome_empresa || 'Profissional';
    const telefone = profissional.telefone || '-';
    const endereco = profissional.endereco || '-';
    const areaAtuacao = profissional.area_atuacao || '';
    const sobre = profissional.sobre || '';

    const iniciais = nomeEmpresa.trim().substring(0, 2).toUpperCase();
    document.getElementById('avatarCircle').innerHTML = avatarConteudo(profissional.foto_perfil, iniciais);

    document.getElementById('editNome').value = nomeEmpresa;
    document.getElementById('editTelefone').value = '';
    document.getElementById('editTelefone').placeholder = telefone !== '-'
        ? traduzirProfissional('perfil.telefoneCadastradoPlaceholder')
        : '(11) 99999-9999';
    document.getElementById('editEndereco').value = endereco !== '-' ? endereco : '';
    document.getElementById('editSobre').value = sobre;

    const areaSelect = document.getElementById('editAreaAtuacao');
    if (areaAtuacao) areaSelect.value = areaAtuacao;
}

function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/Auth/login.html';
}

async function salvarAlteracoes() {
    const profissional = verificarLogin();
    if (!profissional) return;

    const nome_empresa = document.getElementById('editNome').value.trim();
    const telefone = document.getElementById('editTelefone').value.trim();
    const endereco = document.getElementById('editEndereco').value.trim();
    const area_atuacao = document.getElementById('editAreaAtuacao').value;
    const sobre = document.getElementById('editSobre').value.trim();
    const novaSenha = document.getElementById('editSenha').value;

    if (!nome_empresa) {
        alert(traduzirProfissional('perfil.alertPreencherNome'));
        return;
    }

    if (!window.supabase) {
        alert(traduzirProfissional('perfil.alertSemConexao'));
        return;
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const dadosAtualizar = {
        nome_empresa,
        endereco,
        area_atuacao,
        sobre
    };

    if (telefone) {
        dadosAtualizar.telefone = CryptoJS.SHA256(telefone.replace(/\D/g, '')).toString(CryptoJS.enc.Hex);
    }

    if (novaSenha && novaSenha.trim() !== '') {
        if (novaSenha.length < 6) {
            alert(traduzirProfissional('perfil.alertSenhaCurta'));
            return;
        }
        dadosAtualizar.senha = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Hex);
    }

    const salvarBtn = document.getElementById('salvarBtn');
    const textoOriginal = salvarBtn.textContent;
    salvarBtn.disabled = true;
    salvarBtn.textContent = traduzirProfissional('perfil.salvando');

    // Endereço mudou? Tenta achar a coordenada de novo, pra tela de
    // localização (tanto a do profissional quanto a da empresa que
    // contratou) mostrar o pino certo. Se não mudou, não precisa
    // geocodificar de novo.
    if (endereco && endereco !== (profissional.endereco || '') && window.geocodificarEndereco) {
        const coordenadas = await geocodificarEndereco(endereco);
        if (coordenadas) {
            dadosAtualizar.latitude = coordenadas.latitude;
            dadosAtualizar.longitude = coordenadas.longitude;
        }
    }

    try {
        const { error } = await supabaseClient
            .from('profissionais')
            .update(dadosAtualizar)
            .eq('id', profissional.id);

        if (error) {
            const idioma = facosIdiomaAtual();
            alert((idioma === 'en' ? 'Error saving: ' : 'Erro ao salvar: ') + error.message);
            return;
        }

        const profissionalAtualizado = { ...profissional, ...dadosAtualizar };
        localStorage.setItem('profissionalLogado', JSON.stringify(profissionalAtualizado));

        alert(traduzirProfissional('perfil.alertSalvoComSucesso'));
        carregarDadosPerfil();
        document.getElementById('editSenha').value = '';
    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert(traduzirProfissional('perfil.alertErroConexaoServidor'));
    } finally {
        salvarBtn.disabled = false;
        salvarBtn.textContent = textoOriginal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosPerfil();

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
        sairBtn.addEventListener('click', () => {
            if (confirm(traduzirProfissional('perfil.confirmarSair'))) {
                fazerLogout();
            }
        });
    }

    const salvarBtn = document.getElementById('salvarBtn');
    if (salvarBtn) salvarBtn.addEventListener('click', salvarAlteracoes);

    const trocarFotoBtn = document.getElementById('trocarFotoBtn');
    if (trocarFotoBtn) {
        trocarFotoBtn.addEventListener('click', () => {
            const input = document.getElementById('fotoInput');
            input.click();

            input.onchange = async function (e) {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    alert(traduzirProfissional('perfil.alertaImagemInvalida'));
                    return;
                }

                const profissional = verificarLogin();
                if (!profissional) return;

                try {
                    const fotoBase64 = await redimensionarFoto(file);

                    document.getElementById('avatarCircle').innerHTML = avatarConteudo(fotoBase64, null);

                    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    const { error } = await supabaseClient
                        .from('profissionais')
                        .update({ foto_perfil: fotoBase64 })
                        .eq('id', profissional.id);

                    if (error) {
                        console.error(error);
                        alert(traduzirProfissional('perfil.alertaErroFoto'));
                        return;
                    }

                    const profissionalAtualizado = { ...profissional, foto_perfil: fotoBase64 };
                    localStorage.setItem('profissionalLogado', JSON.stringify(profissionalAtualizado));
                } catch (err) {
                    console.error(err);
                    alert(traduzirProfissional('perfil.alertaErroFoto'));
                }
            };
        });
    }

    const telefoneInput = document.getElementById('editTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function () {
            formatarTelefone(this);
        });
    }

    // O botão de ajuda já é tratado pelo Buzz (Buzz/buzz.js), que abre
    // o chat de suporte de verdade — não precisa de handler aqui.
});
