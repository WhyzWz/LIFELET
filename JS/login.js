/* JS/login.js - Login Lifelet (SISTEMA ORIGINAL) */
(function() {
    'use strict';

    // =============================
    // Seleciona todos os elementos importantes no DOM
    // =============================

    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const userTypeOptions = document.querySelectorAll('.type-option');
    const userTypeInput = document.getElementById('userType');
    const guardianFields = document.getElementById('guardianFields');

    // Campos de senha e seus botões de toggle
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginPasswordInput = document.getElementById('loginPassword');
    const registerPasswordToggle = document.getElementById('registerPasswordToggle');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerPasswordConfirmToggle = document.getElementById('registerPasswordConfirmToggle');
    const registerPasswordConfirmInput = document.getElementById('registerPasswordConfirm');
    const phoneInput = document.getElementById('guardianPhone');

    // =============================
    // Função principal que inicia tudo
    // =============================
    function init() {
        setupEventListeners();   // Configura todos os eventos do sistema
        checkAuthentication();   // Verifica se o usuário já está logado
        if (phoneInput) applyPhoneMask(); // Aplica máscara no telefone se existir
    }

    // Se já houver sessão salva no localStorage, redireciona para index.html
    function checkAuthentication() {
        const currentSession = localStorage.getItem('currentSession');
        if (currentSession) {
            window.location.href = 'index.html';
        }
    }

    // Alterna entre Login ↔ Registro visualmente
    function switchMode(mode) {
        if (mode === 'login') {
            loginToggle?.classList.add('active');
            registerToggle?.classList.remove('active');

            loginFormContainer?.classList.add('active');
            registerFormContainer?.classList.remove('active');
        } else {
            loginToggle?.classList.remove('active');
            registerToggle?.classList.add('active');

            loginFormContainer?.classList.remove('active');
            registerFormContainer?.classList.add('active');
        }
    }

    // Controle dos botões "Usuário" / "Responsável"
    function setupUserTypeSelector() {
        if (!userTypeOptions || userTypeOptions.length === 0 || !userTypeInput) return;

        userTypeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove ativo de todos e marca o clicado
                userTypeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Define o tipo selecionado no hidden
                const userType = option.dataset.type;
                userTypeInput.value = userType;

                // Mostra campos extras apenas para responsáveis
                if (guardianFields) {
                    guardianFields.style.display =
                        userType === 'guardian' ? 'block' : 'none';
                }

                // Se escolheu "Usuário", volta para Login automaticamente
                if (userType === 'user') switchMode('login');
            });
        });
    }

    // Alterna visibilidade da senha (olhinho)
    function togglePasswordVisibility(toggleBtn, inputElement) {
        if (!toggleBtn || !inputElement) return;

        toggleBtn.addEventListener('click', () => {
            const type = inputElement.type === 'password' ? 'text' : 'password';
            inputElement.setAttribute('type', type);

            // Alterna ícones
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Máscara automática no telefone
    function applyPhoneMask() {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                }
                e.target.value = value;
            }
        });
    }

    // Validadores simples
    function validatePassword(password) { return password.length >= 8; }

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Cria sessão no localStorage (SISTEMA ORIGINAL)
    function createSession(user, token) {
        const session = {
            userId: user.id || user.userId || user.UserID,
            name: user.name || user.nomeCompleto || user.nome,
            email: user.email || user.userEmail || user.Email,
            type: user.type || user.Funcao,
            loginTime: new Date().toISOString()
        };

        try { 
            localStorage.setItem('currentSession', JSON.stringify(session)); 
        } catch(e) {
            console.error('Erro ao salvar sessão:', e);
        }
        
        try { 
            if (token) localStorage.setItem('authToken', token); 
        } catch(e) {
            console.error('Erro ao salvar token:', e);
        }
    }

    // Toast de mensagens
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'flex';

        setTimeout(() => toast.style.display = 'none', 3000);
    }

    // =============================
    // Liga todos os eventos de botões e formulários
    // =============================
    function setupEventListeners() {

        // Alternância Login / Registro
        loginToggle?.addEventListener('click', () => switchMode('login'));
        registerToggle?.addEventListener('click', () => switchMode('register'));

        setupUserTypeSelector();

        // Botões de mostrar senha
        togglePasswordVisibility(loginPasswordToggle, loginPasswordInput);
        togglePasswordVisibility(registerPasswordToggle, registerPasswordInput);
        togglePasswordVisibility(registerPasswordConfirmToggle, registerPasswordConfirmInput);

        // ------------------------------
        // LOGIN (SISTEMA ORIGINAL)
        // ------------------------------
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value.trim();

                if (!validateEmail(email)) return showToast('Email inválido', 'error');
                if (!password) return showToast('Informe a senha', 'error');

                if (!window.api?.login) {
                    return showToast('API não carregada', 'error');
                }

                try {
                    // IMPORTANTE: envia exatamente { email, senha }
                    const result = await window.api.login({ email, senha: password });

                    let userObj = null;
                    let token = null;

                    // Normalização da resposta da API, pois ela pode ter campos diferentes
                    if (result.ok && (result.userId || result.userEmail)) {
                        userObj = {
                            id: result.userId,
                            name: result.nomeCompleto,
                            email: result.userEmail,
                            type: result.funcao
                        };
                        token = result.token;
                    } else if (result.user) {
                        userObj = result.user;
                        token = result.token;
                    } else if (result.usuario) {
                        userObj = result.usuario;
                        token = result.token;
                    }

                    if (!userObj) {
                        throw new Error(result.msg || 'Resposta inválida da API');
                    }

                    // Criar sessão (SISTEMA ORIGINAL)
                    createSession(userObj, token);

                    showToast('Login realizado com sucesso!', 'success');
                    setTimeout(() => window.location.href = 'index.html', 900);

                } catch (error) {
                    const message = error.message || 'Falha ao fazer login';
                    showToast(message, 'error');
                    console.error('Erro no login:', error);
                }
            });
        }

        // ------------------------------
        // REGISTRO (SISTEMA ORIGINAL)
        // ------------------------------
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('registerName').value.trim();
                const email = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value;
                const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

                const userType = userTypeInput?.value ?? 'user';
                const acceptTerms = document.getElementById('acceptTerms').checked;

                if (!name) return showToast('O nome é obrigatório', 'error');
                if (!validateEmail(email)) return showToast('Email inválido', 'error');
                if (!validatePassword(password)) return showToast('A senha deve ter no mínimo 8 caracteres', 'error');
                if (password !== passwordConfirm) return showToast('As senhas não coincidem', 'error');
                if (!acceptTerms) return showToast('Você deve aceitar os termos de uso', 'error');

                if (!window.api?.register) {
                    return showToast('API não disponível', 'error');
                }

                try {
                    const payload = {
                        nomeCompleto: name,
                        email: email,
                        telefone: userType === 'guardian' ? (document.getElementById('guardianPhone')?.value ?? '') : '',
                        senha: password,
                        userName: email,
                        funcao: userType === 'guardian' ? 2 : 1,
                        relation: userType === 'guardian' ? (document.getElementById('guardianRelation')?.value ?? '') : ''
                    };

                    const result = await window.api.register(payload);

                    let userFromApi = null;
                    let token = null;

                    if (result.ok && result.userId) {
                        userFromApi = {
                            id: result.userId,
                            name,
                            email,
                            type: payload.funcao
                        };
                        token = result.token;
                    } else if (result.user) {
                        userFromApi = result.user;
                        token = result.token;
                    } else {
                        userFromApi = { id: result.userId || Date.now(), name, email, type: payload.funcao };
                        token = result.token;
                    }

                    createSession(userFromApi, token);
                    showToast('Conta criada com sucesso!', 'success');

                    setTimeout(() => window.location.href = 'index.html', 1200);

                } catch (error) {
                    const message = error.message || 'Falha ao criar conta';
                    showToast(message, 'error');
                    console.error('Erro no registro:', error);
                }
            });
        }
    }

    // Inicializa quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();