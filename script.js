console.log('Arquivo script.js carregado!');

window.onload = function() {
    console.log('Página completamente carregada!');

    const loginBtn = document.getElementById('loginBtn');
    const cadastroBtn = document.getElementById('cadastroBtn');
    const loginModal = document.getElementById('loginModal');
    const cadastroModal = document.getElementById('cadastroModal');
    const closeLogin = document.querySelector('.close-login');
    const closeCadastro = document.querySelector('.close-cadastro');

    console.log('Elementos encontrados:', {
        loginBtn: !!loginBtn,
        cadastroBtn: !!cadastroBtn,
        loginModal: !!loginModal,
        cadastroModal: !!cadastroModal
    });

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('>>> BOTÃO LOGIN CLICADO!');
            if (loginModal) {
                loginModal.style.display = 'flex';
                console.log('Modal login exibido');
            }
        });
    }

    if (cadastroBtn) {
        cadastroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('>>> BOTÃO CADASTRO CLICADO!');
            if (cadastroModal) {
                cadastroModal.style.display = 'flex';
                console.log('Modal cadastro exibido');
            }
        });
    }

    if (closeLogin) {
        closeLogin.onclick = function() {
            loginModal.style.display = 'none';
        };
    }

    if (closeCadastro) {
        closeCadastro.onclick = function() {
            cadastroModal.style.display = 'none';
        };
    }

    window.onclick = function(event) {
        if (event.target == loginModal) loginModal.style.display = 'none';
        if (event.target == cadastroModal) cadastroModal.style.display = 'none';
    };

    const telefoneLogin = document.getElementById('loginTelefone');
    const telefoneCadastro = document.getElementById('cadastroTelefone');
    const cpfLogin = document.getElementById('loginCPF');
    const cpfCadastro = document.getElementById('cadastroCPF');

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

    if (telefoneLogin) {
        telefoneLogin.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }

    if (telefoneCadastro) {
        telefoneCadastro.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }

    function formatarCPF(input) {
        let value = input.value.replace(/\D/g, ''); // remove tudo que não é número

        // Aplica a máscara
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        input.value = value;
    }

    function TestaCPF(strCPF) {
        var Soma;
        var Resto;
        Soma = 0;
        if (!strCPF || strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false;

        for (let i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
        Resto = (Soma * 10) % 11;

        if ((Resto == 10) || (Resto == 11))  Resto = 0;
        if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;

        Soma = 0;
        for (let i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
        Resto = (Soma * 10) % 11;

        if ((Resto == 10) || (Resto == 11))  Resto = 0;
        if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
        return true;
    }

    if (cpfLogin) {
        cpfLogin.addEventListener('input', function(e) {
            formatarCPF(e.target);
        });
    }

    if (cpfCadastro) {
        cpfCadastro.addEventListener('input', function(e) {
            formatarCPF(e.target);
        });
    }

    document.querySelectorAll('.switch-to-cadastro').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            loginModal.style.display = 'none';
            cadastroModal.style.display = 'flex';
        };
    });

    document.querySelectorAll('.switch-to-login').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            cadastroModal.style.display = 'none';
            loginModal.style.display = 'flex';
        };
    });

    document.querySelector('.esqueci-senha').onclick = function(e) {
        e.preventDefault();
        alert('Instruções enviadas para seu email!');
    };

    const SUPABASE_URL = 'https://fbgnvpcqwpvbwqtmqpzj.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ252cGNxd3B2YndxdG1xcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODIwNjcsImV4cCI6MjA5MzY1ODA2N30.SYpNeZzHsR4zXYW_IuPe_mx9aH7B3YqmLiebw_UHcXc';
    
    let supabaseClient;

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado');
    }

    const entrarBtn = document.getElementById('entrarBtn');
    const successOverlay = document.getElementById('successOverlay');

    if (entrarBtn) {
        entrarBtn.onclick = async function() {
            const email = document.getElementById('loginEmail').value;
            const cpf = document.getElementById('loginCPF').value.replace(/\D/g, '');
            const senha = document.getElementById('loginSenha').value;

            if (!email || !cpf || !senha) {
                alert('Por favor, preencha email, CPF e senha!');
                return;
            }

            if (!TestaCPF(cpf)) {
                alert('CPF inválido!');
                return;
            }

            if (supabaseClient && window.CryptoJS) {
                try {
                    const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                    
                    const { data: usuarios, error } = await supabaseClient
                        .from('usuarios')
                        .select('*')
                        .eq('email', email)
                        .eq('cpf', cpf)
                        .eq('senha', senhaHash);

                    if (error) {
                        alert('Erro: ' + error.message);
                        return;
                    }

                    if (usuarios && usuarios.length > 0) {
                        successOverlay.style.display = 'flex';
                        loginModal.style.display = 'none';
                        document.getElementById('loginEmail').value = '';
                        document.getElementById('loginCPF').value = '';
                        document.getElementById('loginSenha').value = '';
                        document.getElementById('loginTelefone').value = '';
                        
                        localStorage.setItem('usuarioLogado', JSON.stringify(usuarios[0]));
                        
                        setTimeout(() => {
                            window.location.href = '/Landing Page/TelaIni.html';
                        }, 2000);
                    } else {
                        alert('Email ou senha incorretos!');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Erro ao conectar!');
                }
            }
        };
    }

    const criarBtn = document.querySelector('.criar-btn');

    if (criarBtn) {
        criarBtn.onclick = async function() {
            const nome = document.getElementById('cadastroNome').value;
            const email = document.getElementById('cadastroEmail').value;
            const nome_user = document.getElementById('cadastroUsuario').value;
            const telefone = document.getElementById('cadastroTelefone').value.replace(/\D/g, '');
            const cpf = document.getElementById('cadastroCPF').value.replace(/\D/g, '');
            const senha = document.getElementById('cadastroSenha').value;
            
            if (nome && email && nome_user && cpf && senha) {
                if (!TestaCPF(cpf)) {
                    alert('CPF inválido!');
                    return;
                }
                
                if (supabaseClient && window.CryptoJS) {
                    try {
                        const senhaHash = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);
                        
                        const { data, error } = await supabaseClient
                            .from('usuarios')
                            .insert([{ nome, email, nome_user, telefone, cpf, senha: senhaHash }])
                            .select();

                        if (error) {
                            if (error.code === '23505') {
                                if (error.message && error.message.toLowerCase().includes('cpf')) {
                                    alert('Este CPF já está cadastrado!');
                                } else if (error.message && error.message.toLowerCase().includes('email')) {
                                    alert('Este Email já está cadastrado!');
                                } else {
                                    alert('Dado já cadastrado (Email, CPF ou Usuário)!');
                                }
                            } else {
                                alert('Erro: ' + error.message);
                            }
                            return;
                        }

                        alert('Conta criada com sucesso!');
                        cadastroModal.style.display = 'none';
                        loginModal.style.display = 'flex';
                        document.getElementById('cadastroNome').value = '';
                        document.getElementById('cadastroEmail').value = '';
                        document.getElementById('cadastroUsuario').value = '';
                        document.getElementById('cadastroTelefone').value = '';
                        document.getElementById('cadastroCPF').value = '';
                        document.getElementById('cadastroSenha').value = '';
                    } catch (err) {
                        console.error(err);
                        alert('Erro ao conectar!');
                    }
                }
            } else {
                alert('Preencha todos os campos!');
            }
        };
    }
};
