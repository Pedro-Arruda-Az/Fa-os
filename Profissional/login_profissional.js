
const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;

if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase inicializado para profissionais');
}

function formatarCNPJ(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    input.value = value;
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

function validarCNPJ(cnpj) {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
    
    let tamanho = cnpjLimpo.length - 2;
    let numeros = cnpjLimpo.substring(0, tamanho);
    const digitos = cnpjLimpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
}

const cnpjInput = document.getElementById('cnpj');
const empresaCnpjInput = document.getElementById('empresaCnpj');
const empresaTelefoneInput = document.getElementById('empresaTelefone');

if (cnpjInput) {
    cnpjInput.addEventListener('input', function() {
        formatarCNPJ(this);
    });
}

if (empresaCnpjInput) {
    empresaCnpjInput.addEventListener('input', function() {
        formatarCNPJ(this);
    });
}

if (empresaTelefoneInput) {
    empresaTelefoneInput.addEventListener('input', function() {
        formatarTelefone(this);
    });
}

const modal = document.getElementById('cadastroModal');
const cadastrarBtn = document.getElementById('cadastrarEmpresaBtn');
const closeModal = document.getElementById('closeModal');
const voltarLogin = document.getElementById('voltarLogin');

function abrirModal() {
    modal.classList.add('open');
}

function fecharModal() {
    modal.classList.remove('open');
}

if (cadastrarBtn) {
    cadastrarBtn.addEventListener('click', function(e) {
        e.preventDefault();
        abrirModal();
    });
}

if (closeModal) {
    closeModal.addEventListener('click', fecharModal);
}

if (voltarLogin) {
    voltarLogin.addEventListener('click', function(e) {
        e.preventDefault();
        fecharModal();
    });
}

modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        fecharModal();
    }
});

const entrarBtn = document.getElementById('entrarBtn');

if (entrarBtn) {
    entrarBtn.onclick = async function() {
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const cnpj = document.getElementById('cnpj').value.replace(/\D/g, '');

        if (!email || !senha || !cnpj) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        if (!validarCNPJ(cnpj)) {
            alert('CNPJ inválido!');
            return;
        }

        if (supabaseClient && window.CryptoJS) {
            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                const cnpjHash = CryptoJS.SHA256(cnpj).toString(CryptoJS.enc.Hex);

                const { data: profissionais, error } = await supabaseClient
                    .from('profissionais')
                    .select('*')
                    .eq('email', email)
                    .eq('cnpj', cnpjHash)
                    .eq('senha', senhaHash);

                if (error) {
                    alert('Erro: ' + error.message);
                    return;
                }

                if (profissionais && profissionais.length > 0) {
                    alert('Login realizado com sucesso!');
                    
                    localStorage.setItem('profissionalLogado', JSON.stringify(profissionais[0]));
                    
                    window.location.href = '/Profissional/dashboard.html';
                    
                    document.getElementById('email').value = '';
                    document.getElementById('senha').value = '';
                    document.getElementById('cnpj').value = '';
                } else {
                    alert('Email, CNPJ ou senha incorretos!');
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao conectar com o servidor!');
            }
        } else {
            alert('Supabase não inicializado. Verifique sua conexão.');
        }
    };
}

const criarEmpresaBtn = document.getElementById('criarEmpresaBtn');

if (criarEmpresaBtn) {
    criarEmpresaBtn.onclick = async function() {
        const nome = document.getElementById('empresaNome').value.trim();
        const email = document.getElementById('empresaEmail').value.trim();
        const cnpj = document.getElementById('empresaCnpj').value.replace(/\D/g, '');
        const telefone = document.getElementById('empresaTelefone').value.replace(/\D/g, '');
        const senha = document.getElementById('empresaSenha').value;
        const confirmarSenha = document.getElementById('empresaConfirmarSenha').value;

        if (!nome || !email || !cnpj || !senha || !confirmarSenha) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        if (!validarCNPJ(cnpj)) {
            alert('CNPJ inválido!');
            return;
        }

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        if (senha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres!');
            return;
        }

        if (supabaseClient && window.CryptoJS) {
            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                
                const { data, error } = await supabaseClient
                    .from('profissionais')
                    .insert([{ 
                        nome_empresa: nome, 
                        email, 
                        cnpj, 
                        telefone, 
                        senha: senhaHash,
                        data_cadastro: new Date().toISOString(),
                        status: 'ativo'
                    }])
                    .select();

                if (error) {
                    if (error.code === '23505') {
                        if (error.message && error.message.toLowerCase().includes('cnpj')) {
                            alert('Este CNPJ já está cadastrado!');
                        } else if (error.message && error.message.toLowerCase().includes('email')) {
                            alert('Este Email já está cadastrado!');
                        } else {
                            alert('Dado já cadastrado (Email ou CNPJ)!');
                        }
                    } else {
                        alert('Erro: ' + error.message);
                    }
                    return;
                }

                alert('Empresa cadastrada com sucesso!');
                fecharModal();
                
                document.getElementById('empresaNome').value = '';
                document.getElementById('empresaEmail').value = '';
                document.getElementById('empresaCnpj').value = '';
                document.getElementById('empresaTelefone').value = '';
                document.getElementById('empresaSenha').value = '';
                document.getElementById('empresaConfirmarSenha').value = '';
                
                document.getElementById('email').value = email;
                document.getElementById('cnpj').value = cnpj;
                document.getElementById('senha').value = '';
                
            } catch (err) {
                console.error(err);
                alert('Erro ao conectar com o servidor!');
            }
        } else {
            alert('Supabase não inicializado. Verifique sua conexão.');
        }
    };
}

const esqueciSenha = document.querySelector('.esqueci-senha');

if (esqueciSenha) {
    esqueciSenha.onclick = async function (e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            alert('Digite o email da empresa no campo acima e clique novamente em "Esqueci minha senha".');
            if (emailInput) emailInput.focus();
            return;
        }

        if (!supabaseClient || !window.CryptoJS) {
            alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
            return;
        }

        const textoOriginal = esqueciSenha.textContent;
        esqueciSenha.textContent = 'Enviando...';

        try {
            const { data: profissionais, error } = await supabaseClient
                .from('profissionais')
                .select('*')
                .eq('email', email);

            if (error) {
                alert('Erro ao buscar sua conta: ' + error.message);
                return;
            }

            if (!profissionais || profissionais.length === 0) {
                alert('Não encontramos nenhuma conta com esse email.');
                return;
            }

            const profissional = profissionais[0];

            const senhaTemp = Math.random().toString(36).slice(-8);

            const resposta = await fetch('/api/enviar-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: profissional.nome_empresa || 'Profissional Faços',
                    email: email,
                    assunto: 'Recuperação de senha - Faços',
                    mensagem: `Recebemos uma solicitação para redefinir a senha do painel profissional.\n\nSua nova senha temporária é: ${senhaTemp}\n\nUse essa senha para entrar e, assim que possível, altere-a novamente.`
                })
            });

            const contentType = resposta.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('O envio de email só funciona quando o site está publicado no Netlify (ou rodando com "netlify dev"). O Live Server local não executa essa função.');
            }

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.error || 'Não foi possível enviar o email.');
            }

            const senhaHash = CryptoJS.SHA256(senhaTemp).toString(CryptoJS.enc.Hex);

            const { error: updateError } = await supabaseClient
                .from('profissionais')
                .update({ senha: senhaHash })
                .eq('email', email);

            if (updateError) {
                alert('O email foi enviado, mas houve um erro ao salvar a nova senha: ' + updateError.message);
                return;
            }

            alert('Enviamos uma nova senha temporária para o seu email! Enquanto isso, você já pode definir a senha que quiser usar a partir de agora:');

            abrirModalRedefinirSenha(email);
        } catch (err) {
            console.error(err);
            alert(err.message || 'Ocorreu um erro ao tentar recuperar sua senha. Tente novamente.');
        } finally {
            esqueciSenha.textContent = textoOriginal;
        }
    };
}

const redefinirSenhaModal = document.getElementById('redefinirSenhaModal');
const closeRedefinirModal = document.getElementById('closeRedefinirModal');
const confirmarNovaSenhaBtn = document.getElementById('confirmarNovaSenhaBtn');

let emailParaRedefinir = '';

function abrirModalRedefinirSenha(email) {
    emailParaRedefinir = email;
    if (redefinirSenhaModal) redefinirSenhaModal.classList.add('open');
}

function fecharModalRedefinirSenha() {
    if (redefinirSenhaModal) redefinirSenhaModal.classList.remove('open');
}

if (closeRedefinirModal) {
    closeRedefinirModal.addEventListener('click', fecharModalRedefinirSenha);
}

if (redefinirSenhaModal) {
    redefinirSenhaModal.addEventListener('click', function (e) {
        if (e.target === redefinirSenhaModal) fecharModalRedefinirSenha();
    });
}

if (confirmarNovaSenhaBtn) {
    confirmarNovaSenhaBtn.addEventListener('click', async function () {
        const novaSenhaInput = document.getElementById('novaSenhaInput');
        const confirmarNovaSenhaInput = document.getElementById('confirmarNovaSenhaInput');

        const novaSenha = novaSenhaInput ? novaSenhaInput.value : '';
        const confirmarNovaSenha = confirmarNovaSenhaInput ? confirmarNovaSenhaInput.value : '';

        if (!novaSenha || !confirmarNovaSenha) {
            alert('Preencha as duas senhas.');
            return;
        }

        if (novaSenha.length < 4) {
            alert('A senha precisa ter pelo menos 4 caracteres.');
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            alert('As senhas não são iguais. Digite a mesma senha nos dois campos.');
            return;
        }

        if (!supabaseClient || !window.CryptoJS) {
            alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
            return;
        }

        const textoOriginal = confirmarNovaSenhaBtn.textContent;
        confirmarNovaSenhaBtn.disabled = true;
        confirmarNovaSenhaBtn.textContent = 'Salvando...';

        try {
            const senhaHash = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Hex);

            const { error } = await supabaseClient
                .from('profissionais')
                .update({ senha: senhaHash })
                .eq('email', emailParaRedefinir);

            if (error) {
                alert('Erro ao salvar a nova senha: ' + error.message);
                return;
            }

            alert('Senha atualizada com sucesso! Já pode entrar com a sua nova senha.');

            novaSenhaInput.value = '';
            confirmarNovaSenhaInput.value = '';
            fecharModalRedefinirSenha();
        } catch (err) {
            console.error(err);
            alert('Ocorreu um erro ao salvar a nova senha. Tente novamente.');
        } finally {
            confirmarNovaSenhaBtn.disabled = false;
            confirmarNovaSenhaBtn.textContent = textoOriginal;
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const modalAberto = modal.classList.contains('open');
        
        if (modalAberto) {
            criarEmpresaBtn.click();
        } else {
            entrarBtn.click();
        }
    }
});

const darkModeToggle = document.getElementById('darkModeToggle');

if (darkModeToggle) {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Modo claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? 'Modo claro' : 'Modo escuro';
    });
}