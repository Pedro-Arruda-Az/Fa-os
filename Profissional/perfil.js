/* ============================================================
   FAÇOS - Profissional/perfil.js
   Perfil do profissional (visualizar e editar dados)
   ============================================================ */

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

// ========== VERIFICAÇÃO DE LOGIN ==========
function verificarLogin() {
    const profissional = localStorage.getItem('profissionalLogado');
    if (!profissional) {
        window.location.href = '/Profissional/login_profissional.html';
    }
    return profissional ? JSON.parse(profissional) : null;
}

// ========== MÁSCARA DE TELEFONE ==========
function formatarTelefone(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    input.value = v;
}

// ========== CARREGAR DADOS DO PERFIL ==========
function carregarDadosPerfil() {
    const profissional = verificarLogin();
    if (!profissional) return;

    const nomeEmpresa = profissional.nome_empresa || 'Profissional';
    const telefone = profissional.telefone || '-';
    const endereco = profissional.endereco || '-';
    const areaAtuacao = profissional.area_atuacao || '';
    const sobre = profissional.sobre || '';

    // Cartão de resumo
    const iniciais = nomeEmpresa.trim().substring(0, 2).toUpperCase();
    document.getElementById('avatarIniciais').textContent = iniciais;
    document.getElementById('perfilNomeEmpresa').textContent = nomeEmpresa;
    document.getElementById('perfilArea').textContent = areaAtuacao || 'Área não definida';

    // Formulário de edição
    document.getElementById('editNome').value = nomeEmpresa;
    document.getElementById('editTelefone').value = telefone !== '-' ? telefone : '';
    document.getElementById('editEndereco').value = endereco !== '-' ? endereco : '';
    document.getElementById('editSobre').value = sobre;

    const areaSelect = document.getElementById('editAreaAtuacao');
    if (areaAtuacao) areaSelect.value = areaAtuacao;
}

// ========== LOGOUT ==========
function fazerLogout() {
    localStorage.removeItem('profissionalLogado');
    window.location.href = '/Profissional/login_profissional.html';
}

// ========== SALVAR ALTERAÇÕES ==========
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
        alert('Por favor, preencha o nome da empresa!');
        return;
    }

    if (!window.supabase) {
        alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        return;
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const dadosAtualizar = {
        nome_empresa,
        telefone,
        endereco,
        area_atuacao,
        sobre
    };

    if (novaSenha && novaSenha.trim() !== '') {
        if (novaSenha.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres!');
            return;
        }
        dadosAtualizar.senha = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Hex);
    }

    const salvarBtn = document.getElementById('salvarBtn');
    const textoOriginal = salvarBtn.textContent;
    salvarBtn.disabled = true;
    salvarBtn.textContent = 'Salvando...';

    try {
        const { error } = await supabaseClient
            .from('profissionais')
            .update(dadosAtualizar)
            .eq('id', profissional.id);

        if (error) {
            alert('Erro ao salvar: ' + error.message);
            return;
        }

        const profissionalAtualizado = { ...profissional, ...dadosAtualizar };
        localStorage.setItem('profissionalLogado', JSON.stringify(profissionalAtualizado));

        alert('Alterações salvas com sucesso!');
        carregarDadosPerfil();
        document.getElementById('editSenha').value = '';
    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('Erro ao conectar com o servidor!');
    } finally {
        salvarBtn.disabled = false;
        salvarBtn.textContent = textoOriginal;
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosPerfil();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Deseja sair do painel profissional?')) {
                fazerLogout();
            }
        });
    }

    const salvarBtn = document.getElementById('salvarBtn');
    if (salvarBtn) salvarBtn.addEventListener('click', salvarAlteracoes);

    const telefoneInput = document.getElementById('editTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function () {
            formatarTelefone(this);
        });
    }

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('Precisa de ajuda? Em breve você poderá falar com nosso suporte por aqui.');
        });
    }
});
