/* ============================================================
Sistema de gerenciamento de perfil
O que faz: gerencia edição de perfil, upload de foto e preferências.
Como faz: manipula DOM, valida entradas e usa localStorage.
============================================================ */
(function() {
    'use strict';

    /* ========================================================
    BLOCO 1: Elementos e estado compartilhado
    O que faz: referencia botões, formulários e campos usados.
    Como faz: busca por IDs/classes logo no carregamento.
    ======================================================== */
    const profileForm = document.getElementById('profileForm');
    const profilePhoto = document.getElementById('profilePhoto');
    const profilePhotoPlaceholder = document.getElementById('profilePhotoPlaceholder');
    const photoEditBtn = document.getElementById('photoEditBtn');
    const photoInput = document.getElementById('photoInput');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileBirthDate = document.getElementById('profileBirthDate');
    const profileType = document.getElementById('profileType');
    const profileBio = document.getElementById('profileBio');
    const notificationsEnabled = document.getElementById('notificationsEnabled');
    const weeklyReportsEnabled = document.getElementById('weeklyReportsEnabled');
    const totalReadings = document.getElementById('totalReadings');
    const daysActive = document.getElementById('daysActive');

    let currentUser = null;

    /* ========================================================
    BLOCO 2: Inicialização
    O que faz: configura eventos, carrega dados do usuário e aplica máscaras.
    Como faz: chamada única ao carregar DOM (init()).
    ======================================================== */
    function init() {
        checkAuthentication();
        loadUserData();
        setupEventListeners();
        applyPhoneMask();
        loadUserStats();
    }

    /* ========================================================
    BLOCO 3: Verificação de autenticação
    O que faz: impede acesso ao perfil se não estiver logado.
    Como faz: verifica localStorage e redireciona ao login.
    ======================================================== */
    function checkAuthentication() {
        const session = localStorage.getItem('currentSession');
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const sessionData = JSON.parse(session);
            if (sessionData) {
                currentUser = sessionData;
                return;
            }
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
        }
        
        window.location.href = 'login.html';
    }

    /* ========================================================
    BLOCO 4: Carregamento de dados do usuário
    O que faz: busca informações do usuário e preenche formulário.
    Como faz: consulta localStorage e popula campos.
    ======================================================== */
    function loadUserData() {
        const users = loadUsers();
        const user = users.find(u => u.id === currentUser.userId);
        
        if (user) {
            // Preencher formulário
            profileName.value = user.name || '';
            profileEmail.value = user.email || '';
            profilePhone.value = user.phone || '';
            profileBirthDate.value = user.birthDate || '';
            profileType.value = user.type || 'user';
            profileBio.value = user.bio || '';
            
            // Carregar foto se existir
            if (user.photo) {
                profilePhoto.src = user.photo;
                profilePhoto.style.display = 'block';
                profilePhotoPlaceholder.style.display = 'none';
            } else {
                profilePhoto.style.display = 'none';
                profilePhotoPlaceholder.style.display = 'flex';
            }
            
            // Carregar preferências
            if (user.preferences) {
                notificationsEnabled.checked = user.preferences.notifications !== false;
                weeklyReportsEnabled.checked = user.preferences.weeklyReports === true;
            }
        }
    }

    /* ========================================================
    BLOCO 5: Estatísticas do usuário
    O que faz: calcula e exibe leituras e dias ativos.
    Como faz: consulta dados de batimentos e calcula métricas.
    ======================================================== */
    function loadUserStats() {
        // Simular dados - em produção, buscar do backend
        const readings = localStorage.getItem(`readings_${currentUser.userId}`);
        const readingsData = readings ? JSON.parse(readings) : [];
        
        totalReadings.textContent = readingsData.length || 0;
        
        // Calcular dias ativos
        if (readingsData.length > 0) {
            const firstReading = new Date(readingsData[0].timestamp);
            const now = new Date();
            const daysDiff = Math.floor((now - firstReading) / (1000 * 60 * 60 * 24));
            daysActive.textContent = daysDiff || 1;
        } else {
            daysActive.textContent = 0;
        }
    }

    /* ========================================================
    BLOCO 6: Upload de foto de perfil
    O que faz: permite selecionar e visualizar nova foto.
    Como faz: escuta mudança no input file e atualiza preview.
    ======================================================== */
    function setupPhotoUpload() {
        photoEditBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validar tipo de arquivo
                if (!file.type.startsWith('image/')) {
                    showToast('Por favor, selecione uma imagem válida', 'error');
                    return;
                }

                // Validar tamanho (máx 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('A imagem deve ter no máximo 5MB', 'error');
                    return;
                }

                // Ler e exibir preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    profilePhoto.src = event.target.result;
                    profilePhoto.style.display = 'block';
                    profilePhotoPlaceholder.style.display = 'none';
                    // Salvar temporariamente (em produção, enviar para servidor)
                    savePhotoPreview(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function savePhotoPreview(photoData) {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.userId);
        
        if (userIndex !== -1) {
            users[userIndex].photo = photoData;
            saveUsers(users);
        }
    }

    /* ========================================================
    BLOCO 7: Máscara de telefone
    O que faz: formata input conforme usuário digita.
    Como faz: remove não dígitos e insere parênteses/hífen.
    ======================================================== */
    function applyPhoneMask() {
        profilePhone.addEventListener('input', (e) => {
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

    /* ========================================================
    BLOCO 8: Validações
    O que faz: valida email e outros campos do formulário.
    Como faz: usa regex e verificações de formato.
    ======================================================== */
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validatePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 11;
    }

    /* ========================================================
    BLOCO 9: Persistência local
    O que faz: salva/recupera dados do usuário.
    Como faz: utiliza localStorage com chaves dedicadas.
    ======================================================== */
    function loadUsers() {
        const users = localStorage.getItem('lifelet_users');
        return users ? JSON.parse(users) : [];
    }

    function saveUsers(users) {
        localStorage.setItem('lifelet_users', JSON.stringify(users));
    }

    function updateSession(user) {
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            loginTime: currentUser.loginTime || new Date().toISOString()
        };
        localStorage.setItem('currentSession', JSON.stringify(session));
        currentUser = session;
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
        // Upload de foto
        setupPhotoUpload();

        // Salvar preferências ao alterar
        notificationsEnabled.addEventListener('change', () => {
            savePreferences();
        });

        weeklyReportsEnabled.addEventListener('change', () => {
            savePreferences();
        });

        // Form de perfil
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = profileName.value.trim();
            const email = profileEmail.value.trim();
            const phone = profilePhone.value.trim();
            const birthDate = profileBirthDate.value;
            const bio = profileBio.value.trim();

            // Validações
            if (!name) {
                showToast('O nome é obrigatório', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showToast('Email inválido', 'error');
                return;
            }

            if (phone && !validatePhone(phone)) {
                showToast('Telefone inválido', 'error');
                return;
            }

            // Atualizar usuário
            const users = loadUsers();
            const userIndex = users.findIndex(u => u.id === currentUser.userId);
            
            if (userIndex !== -1) {
                users[userIndex].name = name;
                users[userIndex].email = email;
                users[userIndex].phone = phone;
                users[userIndex].birthDate = birthDate;
                users[userIndex].bio = bio;
                
                // Manter foto se já existir
                if (profilePhoto.src && profilePhoto.style.display !== 'none') {
                    users[userIndex].photo = profilePhoto.src;
                }
                
                saveUsers(users);
                updateSession(users[userIndex]);
                
                showToast('Perfil atualizado com sucesso!', 'success');
            } else {
                showToast('Erro ao atualizar perfil', 'error');
            }
        });
    }

    /* ========================================================
    BLOCO 12: Salvar preferências
    O que faz: persiste configurações de notificações e relatórios.
    Como faz: atualiza objeto de preferências no localStorage.
    ======================================================== */
    function savePreferences() {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.userId);
        
        if (userIndex !== -1) {
            if (!users[userIndex].preferences) {
                users[userIndex].preferences = {};
            }
            
            users[userIndex].preferences.notifications = notificationsEnabled.checked;
            users[userIndex].preferences.weeklyReports = weeklyReportsEnabled.checked;
            
            saveUsers(users);
            showToast('Preferências salvas', 'success');
        }
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

