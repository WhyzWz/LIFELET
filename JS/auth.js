/* JS/auth.js - Gerenciamento de autenticação Lifelet */
(function() {
    'use strict';

    const auth = {
        // Verifica se há uma sessão ativa
        isAuthenticated() {
            const session = localStorage.getItem('currentSession');
            if (!session) return false;
            
            try {
                const sessionData = JSON.parse(session);
                return !!(sessionData && sessionData.userId);
            } catch (e) {
                console.error('Erro ao verificar sessão:', e);
                return false;
            }
        },

        // Obtém a sessão atual
        getCurrentSession() {
            const session = localStorage.getItem('currentSession');
            if (!session) return null;
            
            try {
                return JSON.parse(session);
            } catch (e) {
                console.error('Erro ao obter sessão:', e);
                return null;
            }
        },

        // Cria uma nova sessão
        createSession(userData, token = null) {
            const session = {
                userId: userData.id || userData.userId || userData.UserID,
                name: userData.name || userData.nomeCompleto || userData.nome || 'Usuário',
                email: userData.email || userData.userEmail || userData.Email,
                type: userData.type || userData.funcao || 'user',
                loginTime: new Date().toISOString()
            };

            try {
                localStorage.setItem('currentSession', JSON.stringify(session));
                if (token) {
                    localStorage.setItem('authToken', token);
                }
                return session;
            } catch (e) {
                console.error('Erro ao criar sessão:', e);
                return null;
            }
        },

        // Remove a sessão atual (logout)
        logout() {
            localStorage.removeItem('currentSession');
            localStorage.removeItem('authToken');
            return true;
        },

        // Redireciona para login se não autenticado
        requireAuth(redirectUrl = 'login.html') {
            if (!this.isAuthenticated()) {
                window.location.href = redirectUrl;
                return false;
            }
            return true;
        },

        // Redireciona para dashboard se já autenticado
        redirectIfAuthenticated(redirectUrl = 'central.html') {
            if (this.isAuthenticated()) {
                window.location.href = redirectUrl;
                return true;
            }
            return false;
        },

        // Obtém o ID do usuário atual
        getCurrentUserId() {
            const session = this.getCurrentSession();
            return session ? session.userId : null;
        },

        // Atualiza informações do usuário
        updateUserInfo(userData) {
            const currentSession = this.getCurrentSession();
            if (!currentSession) return false;

            const updatedSession = {
                ...currentSession,
                name: userData.name || currentSession.name,
                email: userData.email || currentSession.email,
                type: userData.type || currentSession.type
            };

            try {
                localStorage.setItem('currentSession', JSON.stringify(updatedSession));
                return true;
            } catch (e) {
                console.error('Erro ao atualizar sessão:', e);
                return false;
            }
        }
    };

    // Expor globalmente
    window.auth = auth;

    console.log('[auth] inicializado');
})();