console.log('Faços - cadastro.js carregado');

const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';

let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function testaCNPJ(strCNPJ) {
    const cnpj = (strCNPJ || '').replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho++;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
}

async function buscarDadosCNPJ(cnpj) {
    const statusEl = document.getElementById('cnpjStatus');
    const nomeEmpresaInput = document.getElementById('cadastroEmpresaUsuario');
    const emailInput = document.getElementById('cadastroEmpresaEmail');
    const telefoneInput = document.getElementById('cadastroEmpresaTelefone');

    if (statusEl) {
        statusEl.textContent = 'Buscando dados do CNPJ...';
        statusEl.className = 'cnpj-status carregando';
    }

    try {
        const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);

        if (!resposta.ok) {
            if (statusEl) {
                statusEl.textContent = 'CNPJ não encontrado na Receita Federal. Preencha os dados manualmente.';
                statusEl.className = 'cnpj-status erro';
            }
            return;
        }

        const dados = await resposta.json();

        const nomeEmpresa = dados.nome_fantasia || dados.razao_social || '';
        if (nomeEmpresa && nomeEmpresaInput) {
            nomeEmpresaInput.value = nomeEmpresa;
        }

        if (dados.email && emailInput && !emailInput.value.trim()) {
            emailInput.value = dados.email;
        }

        const dddTelefone = dados.ddd_telefone_1 || '';
        if (dddTelefone && telefoneInput && !telefoneInput.value.trim()) {
            telefoneInput.value = dddTelefone;
            mascararTelefone(telefoneInput);
        }

        if (statusEl) {
            statusEl.textContent = nomeEmpresa
                ? `Empresa identificada: ${nomeEmpresa}`
                : 'CNPJ encontrado, mas sem nome cadastrado na Receita. Preencha manualmente se precisar.';
            statusEl.className = 'cnpj-status sucesso';
        }
    } catch (erro) {
        console.error('Erro ao buscar CNPJ:', erro);
        if (statusEl) {
            statusEl.textContent = 'Não foi possível consultar o CNPJ agora. Preencha os dados manualmente.';
            statusEl.className = 'cnpj-status erro';
        }
    }
}

function testaCPF(strCPF) {
    const cpf = (strCPF || '').replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
}

function mascararTelefone(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    input.value = v;
}

function mascararCNPJ(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 14);
    if (v.length > 12) v = `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
    else if (v.length > 8) v = `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
    else if (v.length > 5) v = `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
    else if (v.length > 2) v = `${v.slice(0, 2)}.${v.slice(2)}`;
    input.value = v;
}

function mascararCPF(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    else if (v.length > 6) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    else if (v.length > 3) v = `${v.slice(0, 3)}.${v.slice(3)}`;
    input.value = v;
}

document.addEventListener('DOMContentLoaded', () => {
    const authHero = document.querySelector('.auth-hero');
    const escolhaPerfil = document.getElementById('escolhaPerfil');
    const escolhaTroca = document.getElementById('escolhaTroca');
    const formEmpresa = document.getElementById('formEmpresa');
    const formProfissional = document.getElementById('formProfissional');

    const escolhaCards = document.querySelectorAll('.escolha-card');
    const botoesVoltar = document.querySelectorAll('.voltarEscolha');

    const formsPorPerfil = {
        empresa: formEmpresa,
        profissional: formProfissional
    };

    function mostrarFormulario(form) {
        authHero.style.display = 'none';
        escolhaPerfil.style.display = 'none';
        escolhaTroca.style.display = 'none';
        form.style.display = 'flex';
    }

    function voltarParaEscolha() {
        formEmpresa.style.display = 'none';
        formProfissional.style.display = 'none';
        authHero.style.display = 'flex';
        escolhaPerfil.style.display = 'flex';
        escolhaTroca.style.display = 'block';
        escolhaCards.forEach((c) => c.classList.remove('ativo'));
    }

    escolhaCards.forEach((card) => {
        const perfil = card.dataset.perfil;

        card.addEventListener('mouseenter', () => {
            escolhaCards.forEach((c) => c.classList.remove('ativo'));
            card.classList.add('ativo');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('ativo');
        });

        card.addEventListener('click', () => {
            const form = formsPorPerfil[perfil];
            if (form) mostrarFormulario(form);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        card.addEventListener('touchstart', () => {
            escolhaCards.forEach((c) => c.classList.remove('ativo'));
            card.classList.add('ativo');
        }, { passive: true });
    });

    botoesVoltar.forEach((botao) => {
        botao.addEventListener('click', voltarParaEscolha);
    });

    const empresaTelefoneInput = document.getElementById('cadastroEmpresaTelefone');
    const empresaCNPJInput = document.getElementById('cadastroEmpresaCNPJ');
    const profTelefoneInput = document.getElementById('cadastroTelefone');
    const profCPFInput = document.getElementById('cadastroCPF');
    const profPrecoInput = document.getElementById('cadastroPreco');

    if (empresaTelefoneInput) empresaTelefoneInput.addEventListener('input', function () { mascararTelefone(this); });
    if (empresaCNPJInput) {
        empresaCNPJInput.addEventListener('input', function () {
            mascararCNPJ(this);
            const digitos = this.value.replace(/\D/g, '');
            if (digitos.length === 14) {
                buscarDadosCNPJ(digitos);
            }
        });
    }
    if (profTelefoneInput) profTelefoneInput.addEventListener('input', function () { mascararTelefone(this); });
    if (profCPFInput) profCPFInput.addEventListener('input', function () { mascararCPF(this); });

    if (profPrecoInput) {
        profPrecoInput.addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '');
            if (!v) { this.value = ''; return; }
            v = (parseInt(v, 10) / 100).toFixed(2);
            this.value = v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d)\,)/g, '.');
        });
    }

    const criarContaEmpresaBtn = document.getElementById('criarContaEmpresaBtn');

    if (criarContaEmpresaBtn) {
        criarContaEmpresaBtn.addEventListener('click', async function () {
            const nome = document.getElementById('cadastroEmpresaNome').value.trim();
            const nome_user = document.getElementById('cadastroEmpresaUsuario').value.trim();
            const cnpj = document.getElementById('cadastroEmpresaCNPJ').value.replace(/\D/g, '');
            const email = document.getElementById('cadastroEmpresaEmail').value.trim();
            const telefone = document.getElementById('cadastroEmpresaTelefone').value.replace(/\D/g, '');
            const endereco = document.getElementById('cadastroEmpresaEndereco').value.trim();
            const senha = document.getElementById('cadastroEmpresaSenha').value;
            const senha2 = document.getElementById('cadastroEmpresaSenha2').value;

            if (!nome || !nome_user || !cnpj || !email || !telefone || !endereco || !senha || !senha2) {
                alert('Preencha todos os campos!');
                return;
            }

            if (!testaCNPJ(cnpj)) {
                alert('CNPJ inválido!');
                return;
            }

            if (senha !== senha2) {
                alert('As senhas não coincidem!');
                return;
            }

            if (senha.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres!');
                return;
            }

            if (!supabaseClient || !window.CryptoJS) {
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
                return;
            }

            const textoOriginal = criarContaEmpresaBtn.textContent;
            criarContaEmpresaBtn.disabled = true;
            criarContaEmpresaBtn.textContent = 'Criando conta...';

            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                const cnpjHash = CryptoJS.SHA256(cnpj).toString(CryptoJS.enc.Hex);
                const telefoneHash = CryptoJS.SHA256(telefone).toString(CryptoJS.enc.Hex);

                const { error } = await supabaseClient
                    .from('usuarios')
                    .insert([{ nome, nome_user, cnpj: cnpjHash, email, telefone: telefoneHash, endereco, senha: senhaHash }])
                    .select();

                if (error) {
                    if (error.code === '23505') {
                        const msg = (error.message || '').toLowerCase();
                        if (msg.includes('email')) alert('Este email já está cadastrado!');
                        else if (msg.includes('cnpj')) alert('Este CNPJ já está cadastrado!');
                        else alert('Dado já cadastrado (email, usuário ou CNPJ)!');
                    } else {
                        alert('Erro: ' + error.message);
                    }
                    return;
                }

                alert('Conta criada com sucesso! Agora é só entrar.');
                window.location.href = 'login.html';
            } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao criar a conta. Tente novamente.');
            } finally {
                criarContaEmpresaBtn.disabled = false;
                criarContaEmpresaBtn.textContent = textoOriginal;
            }
        });
    }

    const criarContaBtn = document.getElementById('criarContaBtn');

    if (criarContaBtn) {
        criarContaBtn.addEventListener('click', async function () {
            const nome_empresa = document.getElementById('cadastroNome').value.trim();
            const email = document.getElementById('cadastroEmail').value.trim();
            const telefone = document.getElementById('cadastroTelefone').value.replace(/\D/g, '');
            const endereco = document.getElementById('cadastroEndereco').value.trim();
            const cpf = document.getElementById('cadastroCPF').value.replace(/\D/g, '');
            const area_atuacao = document.getElementById('cadastroAreaAtuacao').value;
            const precoTexto = document.getElementById('cadastroPreco').value.trim();
            const senha = document.getElementById('cadastroSenha').value;
            const senha2 = document.getElementById('cadastroSenha2').value;

            if (!nome_empresa || !email || !telefone || !endereco || !cpf || !area_atuacao || !precoTexto || !senha || !senha2) {
                alert('Preencha todos os campos!');
                return;
            }

            const preco_servico = parseFloat(precoTexto.replace(/\./g, '').replace(',', '.'));

            if (isNaN(preco_servico) || preco_servico <= 0) {
                alert('Digite um valor válido para o seu serviço (ex: 150,00).');
                return;
            }

            if (!testaCPF(cpf)) {
                alert('CPF inválido!');
                return;
            }

            if (senha !== senha2) {
                alert('As senhas não coincidem!');
                return;
            }

            if (senha.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres!');
                return;
            }

            if (!supabaseClient || !window.CryptoJS) {
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
                return;
            }

            const textoOriginal = criarContaBtn.textContent;
            criarContaBtn.disabled = true;
            criarContaBtn.textContent = 'Criando conta...';

            try {
                const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                const cpfHash = CryptoJS.SHA256(cpf).toString(CryptoJS.enc.Hex);
                const telefoneHash = CryptoJS.SHA256(telefone).toString(CryptoJS.enc.Hex);

                const { error } = await supabaseClient
                    .from('profissionais')
                    .insert([{
                        nome_empresa,
                        email,
                        telefone: telefoneHash,
                        endereco,
                        cpf: cpfHash,
                        area_atuacao,
                        preco_servico,
                        senha: senhaHash,
                        data_cadastro: new Date().toISOString(),
                        status: 'ativo'
                    }])
                    .select();

                if (error) {
                    if (error.code === '23505') {
                        const msg = (error.message || '').toLowerCase();
                        if (msg.includes('cpf')) alert('Este CPF já está cadastrado!');
                        else if (msg.includes('email')) alert('Este email já está cadastrado!');
                        else alert('Dado já cadastrado (email ou CPF)!');
                    } else {
                        alert('Erro: ' + error.message);
                    }
                    return;
                }

                alert('Conta criada com sucesso! Agora é só entrar.');
                window.location.href = 'login.html';
            } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao criar a conta. Tente novamente.');
            } finally {
                criarContaBtn.disabled = false;
                criarContaBtn.textContent = textoOriginal;
            }
        });
    }
});
