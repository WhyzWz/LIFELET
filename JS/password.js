/* ============================================================
Sistema de recuperação de senha
O que faz: gerencia solicitação e redefinição de senha.
Como faz: manipula DOM, valida entradas e usa localStorage.
============================================================ */
(function() {
    'use strict';

    /* ========================================================
    BLOCO 1: Elementos e estado compartilhado
    O que faz: referencia botões, formulários e campos usados.
    Como faz: busca por IDs/classes logo no carregamento.
    ======================================================== */
    const requestFormContainer = document.getElementById('requestFormContainer');
    const resetFormContainer = document.getElementById('resetFormContainer');
    const successMessage = document.getElementById('successMessage');
    const requestForm = document.getElementById('requestForm');
    const resetForm = document.getElementById('resetForm');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const resetPassword = document.getElementById('resetPassword');
    const resetPasswordConfirm = document.getElementById('resetPasswordConfirm');
    const resetPasswordToggle = document.getElementById('resetPasswordToggle');
    const resetPasswordConfirmToggle = document.getElementById('resetPasswordConfirmToggle');
    const resendLink = document.getElementById('resendLink');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');

    /* ========================================================
    BLOCO 2: Inicialização
    O que faz: configura eventos e verifica token de reset.
    Como faz: chamada única ao carregar DOM (init()).
    ======================================================== */
    function init() {
        checkResetToken();
        setupEventListeners();
    }

    /* ========================================================
    BLOCO 3: Verificação de token de reset
    O que faz: verifica se há token válido na URL para redefinição.
    Como faz: consulta parâmetros da URL e alterna formulários.
    ======================================================== */
    function checkResetToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            // Verificar se o token é válido (em produção, validar no backend)
            const savedToken = localStorage.getItem('resetToken');
            if (savedToken === token) {
                showResetForm();
            } else {
                showToast('Token inválido ou expirado', 'error');
                setTimeout(() => {
                    window.location.href = 'password.html';
                }, 2000);
            }
        }
    }

    /* ========================================================
    BLOCO 4: Alternância de formulários
    O que faz: mostra/oculta formulários conforme etapa.
    Como faz: adiciona/remove classes active e display.
    ======================================================== */
    function showRequestForm() {
        requestFormContainer.classList.add('active');
        resetFormContainer.classList.remove('active');
        successMessage.style.display = 'none';
    }

    function showResetForm() {
        requestFormContainer.classList.remove('active');
        resetFormContainer.classList.add('active');
        successMessage.style.display = 'none';
    }

    function showSuccessMessage() {
        requestFormContainer.classList.remove('active');
        resetFormContainer.classList.remove('active');
        successMessage.style.display = 'block';
    }

    /* ========================================================
    BLOCO 5: Exibição de senha
    O que faz: alterna tipo password/text e troca ícones.
    Como faz: escuta clique no botão e troca classes do ícone.
    ======================================================== */
    function togglePasswordVisibility(toggleBtn, inputElement) {
        toggleBtn.addEventListener('click', () => {
            const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
            inputElement.setAttribute('type', type);
            
            const icon = toggleBtn.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    /* ========================================================
    BLOCO 6: Validação de força da senha
    O que faz: analisa complexidade e exibe indicador visual.
    Como faz: verifica comprimento, caracteres e atualiza UI.
    ======================================================== */
    function checkPasswordStrength(password) {
        if (!password) {
            strengthFill.className = 'strength-fill';
            strengthFill.style.width = '0%';
            strengthText.textContent = 'Digite uma senha';
            strengthText.className = 'strength-text';
            return 'none';
        }

        let strength = 0;
        let feedback = [];

        // Comprimento mínimo
        if (password.length >= 8) strength++;
        else feedback.push('Mínimo 8 caracteres');

        // Letra maiúscula
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Adicione uma letra maiúscula');

        // Letra minúscula
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Adicione uma letra minúscula');

        // Número
        if (/\d/.test(password)) strength++;
        else feedback.push('Adicione um número');

        // Caractere especial
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else feedback.push('Adicione um caractere especial');

        // Atualizar UI
        if (strength <= 2) {
            strengthFill.className = 'strength-fill weak';
            strengthText.textContent = 'Senha fraca';
            strengthText.className = 'strength-text weak';
        } else if (strength <= 4) {
            strengthFill.className = 'strength-fill medium';
            strengthText.textContent = 'Senha média';
            strengthText.className = 'strength-text medium';
        } else {
            strengthFill.className = 'strength-fill strong';
            strengthText.textContent = 'Senha forte';
            strengthText.className = 'strength-text strong';
        }

        return strength >= 4 ? 'strong' : strength >= 2 ? 'medium' : 'weak';
    }

    /* ========================================================
    BLOCO 7: Validação de correspondência de senhas
    O que faz: verifica se senha e confirmação coincidem.
    Como faz: compara valores e atualiza feedback visual.
    ======================================================== */
    function checkPasswordMatch() {
        const password = resetPassword.value;
        const confirm = resetPasswordConfirm.value;

        if (!confirm) {
            passwordMatch.innerHTML = '';
            return false;
        }

        if (password === confirm) {
            passwordMatch.innerHTML = '<i class="fas fa-check-circle"></i> As senhas coincidem';
            passwordMatch.className = 'password-match match';
            return true;
        } else {
            passwordMatch.innerHTML = '<i class="fas fa-times-circle"></i> As senhas não coincidem';
            passwordMatch.className = 'password-match no-match';
            return false;
        }
    }

    /* ========================================================
    BLOCO 8: Validações
    O que faz: valida email e senha.
    Como faz: usa regex e verificações de formato.
    ======================================================== */
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    /* ========================================================
    BLOCO 9: Persistência local
    O que faz: salva/recupera tokens e usuários.
    Como faz: utiliza localStorage com chaves dedicadas.
    ======================================================== */
    function loadUsers() {
        const users = localStorage.getItem('lifelet_users');
        return users ? JSON.parse(users) : [];
    }

    function saveUsers(users) {
        localStorage.setItem('lifelet_users', JSON.stringify(users));
    }

    function generateResetToken() {
        // Gerar token simples (em produção, usar método mais seguro)
        const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('resetToken', token);
        // Token expira em 1 hora (em produção, usar timestamp)
        localStorage.setItem('resetTokenExpiry', Date.now() + 3600000);
        return token;
    }

    function isValidToken(token) {
        const savedToken = localStorage.getItem('resetToken');
        const expiry = localStorage.getItem('resetTokenExpiry');
        
        if (!savedToken || savedToken !== token) return false;
        if (expiry && Date.now() > parseInt(expiry)) {
            localStorage.removeItem('resetToken');
            localStorage.removeItem('resetTokenExpiry');
            return false;
        }
        return true;
    }

    /* ========================================================
    BLOCO 10: Toast de feedback
    O que faz: apresenta mensagens temporárias de status.
    Como faz: ajusta classes, mostra elemento e esconde após timeout.
    ======================================================== */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'flex';
        
        // Atualizar ícone
        const icon = toast.querySelector('i');
        if (icon) {
            icon.className = type === 'success' ? 'fas fa-check-circle' : 
                           type === 'error' ? 'fas fa-exclamation-circle' : 
                           'fas fa-info-circle';
        }
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    /* ========================================================
    BLOCO 11: Listeners principais
    O que faz: conecta ações de UI com a lógica aplicada.
    Como faz: registra eventos de clique e submit nos botões/forms.
    ======================================================== */
    function setupEventListeners() {
        // Toggle de senha
        togglePasswordVisibility(resetPasswordToggle, resetPassword);
        togglePasswordVisibility(resetPasswordConfirmToggle, resetPasswordConfirm);

        // Validação de força da senha em tempo real
        resetPassword.addEventListener('input', () => {
            checkPasswordStrength(resetPassword.value);
            checkPasswordMatch();
        });

        // Validação de correspondência em tempo real
        resetPasswordConfirm.addEventListener('input', () => {
            checkPasswordMatch();
        });

        // Form de solicitação
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = recoveryEmail.value.trim();

            // Validação
            if (!validateEmail(email)) {
                showToast('Email inválido', 'error');
                return;
            }

            // Verificar se o email existe
            const users = loadUsers();
            const user = users.find(u => u.email === email);

            if (user) {
                // Gerar token e simular envio de email
                const token = generateResetToken();
                localStorage.setItem('resetEmail', email);
                
                // Em produção, enviar email com link: password.html?token=TOKEN
                // Por enquanto, apenas simular
                showToast('Link de recuperação enviado! Verifique seu email.', 'success');
                
                // Simular sucesso após 1 segundo
                setTimeout(() => {
                    showSuccessMessage();
                }, 1500);
            } else {
                showToast('Email não encontrado em nossa base de dados', 'error');
            }
        });

        // Form de redefinição
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = resetPassword.value;
            const passwordConfirm = resetPasswordConfirm.value;

            // Validações
            if (!validatePassword(password)) {
                showToast('A senha deve ter no mínimo 8 caracteres', 'error');
                return;
            }

            const strength = checkPasswordStrength(password);
            if (strength === 'weak') {
                showToast('A senha é muito fraca. Use uma senha mais forte.', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                showToast('As senhas não coincidem', 'error');
                return;
            }

            // Obter email do token (em produção, buscar do backend)
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token || !isValidToken(token)) {
                showToast('Token inválido ou expirado', 'error');
                setTimeout(() => {
                    window.location.href = 'password.html';
                }, 2000);
                return;
            }

            // Buscar usuário pelo email salvo no token (em produção, buscar do backend)
            const resetEmail = localStorage.getItem('resetEmail');
            if (!resetEmail) {
                showToast('Erro ao processar redefinição', 'error');
                return;
            }

            // Atualizar senha
            const users = loadUsers();
            const userIndex = users.findIndex(u => u.email === resetEmail);
            
            if (userIndex !== -1) {
                users[userIndex].password = password; // Em produção, usar hash!
                
                saveUsers(users);
                
                // Limpar token
                localStorage.removeItem('resetToken');
                localStorage.removeItem('resetTokenExpiry');
                localStorage.removeItem('resetEmail');
                
                showToast('Senha redefinida com sucesso!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showToast('Erro ao atualizar senha', 'error');
            }
        });

        // Reenviar link
        resendLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = recoveryEmail.value.trim();
            
            if (!email || !validateEmail(email)) {
                showToast('Digite um email válido primeiro', 'error');
                return;
            }

            const users = loadUsers();
            const user = users.find(u => u.email === email);

            if (user) {
                const token = generateResetToken();
                localStorage.setItem('resetEmail', email);
                showToast('Link reenviado com sucesso!', 'success');
            } else {
                showToast('Email não encontrado', 'error');
            }
        });
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

