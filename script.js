console.log('Arquivo script.js carregado!');

/* =========================================================
   CONTEÚDO DAS ABAS (SOBRE / DIFERENCIAL / FUNCIONAMENTO / SERVIÇOS)
   ========================================================= */
const conteudoAbas = {
    sobre: {
        label: 'SOBRE',
        html: `
            <h3>Sobre a Faços</h3>
            <p>A Faços é uma plataforma que conecta você a profissionais de serviços domésticos e manutenção de forma rápida e prática. Nosso objetivo é facilitar o seu dia a dia, eliminando a demora e a burocracia na hora de encontrar ajuda.</p>
            <p>Com poucos cliques, você encontra profissionais qualificados próximos de você, prontos para atender sua necessidade no momento em que ela surge.</p>
            <p>Seja para uma emergência ou uma tarefa do dia a dia, a Faços resolve.</p>
        `
    },
    diferencial: {
        label: 'DIFERENCIAL',
        html: `
            <h3>Nosso diferencial</h3>
            <p>Diferente dos serviços tradicionais, a Faços foi criada para atender demandas imediatas.</p>
            <p>Nada de esperar dias por um agendamento. Nossa plataforma conecta você a profissionais disponíveis em tempo real, permitindo que o serviço seja realizado o mais rápido possível.</p>
            <p>Além disso, garantimos mais segurança e confiança através de avaliações, perfis verificados e acompanhamento do serviço.</p>
            <p>Atendimento rápido, prático e no momento em que você precisa.</p>
        `
    },
    funcionamento: {
        label: 'FUNCIONAMENTO',
        html: `
            <h3>Como funciona</h3>
            <p>Usar a Faços é simples e rápido:</p>
            <ul class="steps-list">
                <li class="step-item">
                    <span class="step-number">1</span>
                    <div class="step-text">
                        <strong>Escolha o serviço</strong>
                        <span>Selecione o tipo de ajuda que você precisa.</span>
                    </div>
                </li>
                <li class="step-item">
                    <span class="step-number">2</span>
                    <div class="step-text">
                        <strong>Veja profissionais disponíveis</strong>
                        <span>Encontre prestadores próximos e disponíveis naquele momento.</span>
                    </div>
                </li>
                <li class="step-item">
                    <span class="step-number">3</span>
                    <div class="step-text">
                        <strong>Solicite o atendimento</strong>
                        <span>Escolha um profissional e confirme o chamado.</span>
                    </div>
                </li>
                <li class="step-item">
                    <span class="step-number">4</span>
                    <div class="step-text">
                        <strong>Acompanhe em tempo real</strong>
                        <span>Veja o status e o tempo estimado de chegada.</span>
                    </div>
                </li>
                <li class="step-item">
                    <span class="step-number">5</span>
                    <div class="step-text">
                        <strong>Finalize e avalie</strong>
                        <span>Após o serviço, você pode avaliar a experiência.</span>
                    </div>
                </li>
            </ul>
        `
    },
    servicos: {
        label: 'SERVIÇOS',
        html: `
            <h3>Serviços disponíveis</h3>
            <p>Na Faços, você encontra diversos serviços para resolver problemas do dia a dia, como:</p>
            <ul class="servicos-lista">
                <li>Limpeza residencial</li>
                <li>Eletricista</li>
                <li>Encanador</li>
                <li>Montagem de móveis</li>
                <li>Pequenos reparos</li>
                <li>Jardinagem</li>
                <li>Serviços gerais</li>
            </ul>
            <p>Estamos sempre ampliando nossa rede de profissionais para oferecer cada vez mais opções para você.</p>
        `
    }
};

function renderAba(chave) {
    const dados = conteudoAbas[chave];
    if (!dados) return;

    const infoContent = document.getElementById('infoContent');
    const infoScroll = document.getElementById('infoScroll');
    if (!infoContent) return;

    infoContent.innerHTML = `
        <div class="info-tag">${dados.label}</div>
        ${dados.html}
    `;

    if (infoScroll) infoScroll.scrollTop = 0;

    document.querySelectorAll('.nav-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === chave);
    });
}

function initAbas() {
    const pills = document.querySelectorAll('.nav-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            renderAba(pill.dataset.tab);
        });
    });

    // Renderiza a aba "sobre" por padrão ao carregar a página
    renderAba('sobre');
}

/* =========================================================
   RESTANTE DA LÓGICA (LOGIN / CADASTRO / SUPABASE)
   ========================================================= */
window.onload = function() {
    console.log('Página completamente carregada!');

    initAbas();

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

    const esqueciSenha = document.querySelector('.esqueci-senha');
    if (esqueciSenha) {
        esqueciSenha.onclick = async function(e) {
            e.preventDefault();

            const emailInput = document.getElementById('loginEmail');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                alert('Digite seu email no campo acima e clique novamente em "Esqueci minha senha".');
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
                const { data: usuarios, error } = await supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('email', email);

                if (error) {
                    alert('Erro ao buscar sua conta: ' + error.message);
                    return;
                }

                if (!usuarios || usuarios.length === 0) {
                    alert('Não encontramos nenhuma conta com esse email.');
                    return;
                }

                const usuario = usuarios[0];

                // Gera uma senha temporária (só é salva no banco DEPOIS que o email for enviado com sucesso)
                const senhaTemp = Math.random().toString(36).slice(-8);

                // Envia a senha temporária por email usando a função enviar-email
                const resposta = await fetch('/api/enviar-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome: usuario.nome || 'Cliente Faços',
                        email: email,
                        assunto: 'Recuperação de senha - Faços',
                        mensagem: `Recebemos uma solicitação para redefinir sua senha.\n\nSua nova senha temporária é: ${senhaTemp}\n\nUse essa senha para entrar e, assim que possível, altere-a novamente pelo seu perfil.`
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

                // Email confirmado: agora sim salva o hash da nova senha no Supabase
                const senhaHash = CryptoJS.SHA256(senhaTemp).toString(CryptoJS.enc.Hex);

                const { error: updateError } = await supabaseClient
                    .from('usuarios')
                    .update({ senha: senhaHash })
                    .eq('email', email);

                if (updateError) {
                    alert('O email foi enviado, mas houve um erro ao salvar a nova senha: ' + updateError.message);
                    return;
                }

                alert('Enviamos uma nova senha temporária para o seu email!');
            } catch (err) {
                console.error(err);
                alert(err.message || 'Ocorreu um erro ao tentar recuperar sua senha. Tente novamente.');
            } finally {
                esqueciSenha.textContent = textoOriginal;
            }
        };
    }

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
