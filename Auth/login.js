console.log('Faços - login.js carregado');

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function formatarCNPJ(input) {
    let value = input.value.replace(/\D/g, '').slice(0, 14);
    if (value.length > 12) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
    }
    input.value = value;
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
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
}

function formatarCPF(input) {
    let value = input.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
    }
    input.value = value;
}

function validarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpfLimpo.charAt(10));
}

document.addEventListener('DOMContentLoaded', () => {

    const tabEmpresas = document.getElementById('tabEmpresas');
    const tabProfissionais = document.getElementById('tabProfissionais');
    const painelEmpresas = document.getElementById('painelEmpresas');
    const painelProfissionais = document.getElementById('painelProfissionais');

    function ativarAba(aba) {
        const isEmpresas = aba === 'empresas';
        tabEmpresas.classList.toggle('active', isEmpresas);
        tabProfissionais.classList.toggle('active', !isEmpresas);
        painelEmpresas.classList.toggle('active', isEmpresas);
        painelProfissionais.classList.toggle('active', !isEmpresas);
    }

    if (tabEmpresas && tabProfissionais) {
        tabEmpresas.addEventListener('click', () => ativarAba('empresas'));
        tabProfissionais.addEventListener('click', () => ativarAba('profissionais'));
    }

    const empresaCNPJInput = document.getElementById('empresaCNPJ');
    if (empresaCNPJInput) {
        empresaCNPJInput.addEventListener('input', function () { formatarCNPJ(this); });
    }

    const profCPFInput = document.getElementById('profCPF');
    if (profCPFInput) {
        profCPFInput.addEventListener('input', function () { formatarCPF(this); });
    }

    const entrarEmpresaBtn = document.getElementById('entrarEmpresaBtn');
    if (entrarEmpresaBtn) {
        entrarEmpresaBtn.addEventListener('click', async function () {
            const email = document.getElementById('empresaEmail').value.trim();
            const cnpj = document.getElementById('empresaCNPJ').value.replace(/\D/g, '');
            const senha = document.getElementById('empresaSenha').value;

            if (!email || !cnpj || !senha) {
                alert('Preencha email, CNPJ e senha.');
                return;
            }

            if (!validarCNPJ(cnpj)) {
                alert('CNPJ inválido!');
                return;
            }

            if (!supabaseClient || !window.CryptoJS) {
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
                return;
            }

            const textoOriginal = entrarEmpresaBtn.textContent;
            entrarEmpresaBtn.disabled = true;
            entrarEmpresaBtn.textContent = 'Entrando...';

            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                const cnpjHash = CryptoJS.SHA256(cnpj).toString(CryptoJS.enc.Hex);

                const { data: empresas, error } = await supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('email', email)
                    .eq('cnpj', cnpjHash)
                    .eq('senha', senhaHash);

                if (error) throw new Error(error.message);

                if (empresas && empresas.length > 0) {
                    localStorage.setItem('usuarioLogado', JSON.stringify(empresas[0]));
                    window.location.href = '/Landing Page/TelaIni.html';
                    return;
                }

                alert('Email, CNPJ ou senha incorretos.');
            } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao tentar entrar. Tente novamente.');
            } finally {
                entrarEmpresaBtn.disabled = false;
                entrarEmpresaBtn.textContent = textoOriginal;
            }
        });

        document.getElementById('empresaSenha').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') entrarEmpresaBtn.click();
        });
    }

    const entrarProfBtn = document.getElementById('entrarProfBtn');
    if (entrarProfBtn) {
        entrarProfBtn.addEventListener('click', async function () {
            const email = document.getElementById('profEmail').value.trim();
            const cpf = document.getElementById('profCPF').value.replace(/\D/g, '');
            const senha = document.getElementById('profSenha').value;

            if (!email || !cpf || !senha) {
                alert('Preencha email, CPF e senha.');
                return;
            }

            if (!validarCPF(cpf)) {
                alert('CPF inválido!');
                return;
            }

            if (!supabaseClient || !window.CryptoJS) {
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
                return;
            }

            const textoOriginal = entrarProfBtn.textContent;
            entrarProfBtn.disabled = true;
            entrarProfBtn.textContent = 'Entrando...';

            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                const cpfHash = CryptoJS.SHA256(cpf).toString(CryptoJS.enc.Hex);

                const { data: profissionais, error } = await supabaseClient
                    .from('profissionais')
                    .select('*')
                    .eq('email', email)
                    .eq('cpf', cpfHash)
                    .eq('senha', senhaHash);

                if (error) throw new Error(error.message);

                if (profissionais && profissionais.length > 0) {
                    localStorage.setItem('profissionalLogado', JSON.stringify(profissionais[0]));
                    window.location.href = '/Profissional/dashboard.html';
                    return;
                }

                alert('Email, CPF ou senha incorretos.');
            } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao tentar entrar. Tente novamente.');
            } finally {
                entrarProfBtn.disabled = false;
                entrarProfBtn.textContent = textoOriginal;
            }
        });

        document.getElementById('profSenha').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') entrarProfBtn.click();
        });
    }

    const redefinirSenhaModal = document.getElementById('redefinirSenhaModal');
    const closeRedefinir = document.querySelector('.close-redefinir');
    const confirmarNovaSenhaBtn = document.getElementById('confirmarNovaSenhaBtn');

    let emailParaRedefinir = '';
    let tabelaParaRedefinir = '';

    document.querySelectorAll('.esqueci-senha').forEach((link) => {
        link.addEventListener('click', async function (e) {
            e.preventDefault();

            const tipo = this.dataset.tipo;
            const tabela = tipo === 'empresas' ? 'usuarios' : 'profissionais';
            const emailInput = tipo === 'empresas'
                ? document.getElementById('empresaEmail')
                : document.getElementById('profEmail');

            const email = emailInput.value.trim();
            if (!email) {
                alert('Digite seu email no campo acima e clique de novo em "Esqueci minha senha".');
                emailInput.focus();
                return;
            }

            if (!supabaseClient) {
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
                return;
            }

            const textoOriginal = this.textContent;
            this.textContent = 'Verificando...';

            try {
                const { data: contas } = await supabaseClient
                    .from(tabela)
                    .select('*')
                    .eq('email', email);

                if (!contas || contas.length === 0) {
                    alert('Não encontramos nenhuma conta com esse email.');
                    return;
                }

                const conta = contas[0];
                const nome = tabela === 'profissionais' ? (conta.nome_empresa || 'Empresa Faços') : (conta.nome || 'Profissional Faços');

                const senhaTemp = Math.random().toString(36).slice(-8);

                const resposta = await fetch('/api/enviar-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome,
                        email,
                        assunto: 'Recuperação de senha - Faços',
                        mensagem: `Recebemos uma solicitação para redefinir sua senha.\n\nSua nova senha temporária é: ${senhaTemp}\n\nUse essa senha para entrar e, assim que possível, defina uma nova.`
                    })
                });

                const contentType = resposta.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('O envio de email só funciona quando o site está publicado no Netlify.');
                }

                const resultado = await resposta.json();
                if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível enviar o email.');

                const senhaHash = CryptoJS.SHA256(senhaTemp).toString(CryptoJS.enc.Hex);
                await supabaseClient.from(tabela).update({ senha: senhaHash }).eq('email', email);

                alert('Enviamos uma senha temporária para o seu email! Já pode definir a senha que quiser usar a partir de agora:');

                emailParaRedefinir = email;
                tabelaParaRedefinir = tabela;
                redefinirSenhaModal.style.display = 'flex';
            } catch (err) {
                console.error(err);
                alert(err.message || 'Ocorreu um erro ao tentar recuperar sua senha.');
            } finally {
                this.textContent = textoOriginal;
            }
        });
    });

    if (closeRedefinir) {
        closeRedefinir.onclick = () => { redefinirSenhaModal.style.display = 'none'; };
    }

    if (confirmarNovaSenhaBtn) {
        confirmarNovaSenhaBtn.addEventListener('click', async function () {
            const novaSenha = document.getElementById('novaSenhaInput').value;
            const confirmarNovaSenha = document.getElementById('confirmarNovaSenhaInput').value;

            if (!novaSenha || !confirmarNovaSenha) {
                alert('Preencha as duas senhas.');
                return;
            }
            if (novaSenha.length < 4) {
                alert('A senha precisa ter pelo menos 4 caracteres.');
                return;
            }
            if (novaSenha !== confirmarNovaSenha) {
                alert('As senhas não são iguais.');
                return;
            }

            const senhaHash = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Hex);
            const { error } = await supabaseClient
                .from(tabelaParaRedefinir)
                .update({ senha: senhaHash })
                .eq('email', emailParaRedefinir);

            if (error) {
                alert('Erro ao salvar a nova senha: ' + error.message);
                return;
            }

            alert('Senha atualizada! Já pode entrar com a sua nova senha.');
            redefinirSenhaModal.style.display = 'none';
            document.getElementById('novaSenhaInput').value = '';
            document.getElementById('confirmarNovaSenhaInput').value = '';
        });
    }

    window.onclick = (event) => {
        if (event.target === redefinirSenhaModal) redefinirSenhaModal.style.display = 'none';
    };
});
