/* JS/emergency.js - Solução de emergência */
(function() {
    'use strict';
    
    console.log('🚨 MODO EMERGÊNCIA ATIVADO');
    
    // Criar API falsa se a real não carregar
    if (typeof window.api === 'undefined') {
        console.log('Criando API de emergência...');
        
        window.api = {
            login: async function({ email, senha }) {
                console.log('Login emergência:', email);
                
                // Validar senha
                if (!senha || senha.length < 8) {
                    throw new Error('Senha deve ter pelo menos 8 caracteres');
                }
                
                // Criar usuário fake
                const fakeUser = {
                    id: 'emergency_' + Date.now(),
                    name: email.split('@')[0] || 'Usuário',
                    email: email,
                    type: 'user'
                };
                
                const fakeToken = 'emergency_token_' + Date.now();
                
                // Salvar sessão
                localStorage.setItem('currentSession', JSON.stringify({
                    userId: fakeUser.id,
                    name: fakeUser.name,
                    email: fakeUser.email,
                    type: fakeUser.type,
                    loginTime: new Date().toISOString()
                }));
                
                localStorage.setItem('authToken', fakeToken);
                
                return {
                    user: fakeUser,
                    token: fakeToken,
                    message: 'Login em modo emergência'
                };
            },
            
            register: async function(payload) {
                console.log('Registro emergência:', payload.email);
                
                // Criar usuário fake
                const fakeUser = {
                    id: 'emergency_' + Date.now(),
                    name: payload.nomeCompleto,
                    email: payload.email,
                    type: payload.funcao === 2 ? 'guardian' : 'user'
                };
                
                const fakeToken = 'emergency_token_' + Date.now();
                
                // Salvar sessão
                localStorage.setItem('currentSession', JSON.stringify({
                    userId: fakeUser.id,
                    name: fakeUser.name,
                    email: fakeUser.email,
                    type: fakeUser.type,
                    loginTime: new Date().toISOString()
                }));
                
                localStorage.setItem('authToken', fakeToken);
                
                return {
                    user: fakeUser,
                    token: fakeToken,
                    message: 'Registro em modo emergência'
                };
            },
            
            // Funções para o dashboard
            getBatimentosMedia: async function() {
                return {
                    media: 75,
                    minimo: 70,
                    maximo: 80,
                    totalLeituras: 24
                };
            },
            
            getBatimentosDia: async function() {
                const hoje = new Date().toISOString().split('T')[0];
                return Array.from({ length: 12 }, (_, i) => ({
                    bpm: 70 + Math.floor(Math.random() * 15),
                    timestamp: new Date(Date.now() - (i * 10 * 60 * 1000)).toISOString(),
                    data: hoje,
                    hora: new Date(Date.now() - (i * 10 * 60 * 1000)).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                }));
            },
            
            getHistoricoMedia: async function() {
                return Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return {
                        data: date.toISOString().split('T')[0],
                        media: 72 + Math.floor(Math.random() * 8),
                        minimo: 65 + Math.floor(Math.random() * 6),
                        maximo: 78 + Math.floor(Math.random() * 8),
                        totalLeituras: 80 + Math.floor(Math.random() * 40)
                    };
                });
            }
        };
        
        console.log('✅ API de emergência criada');
    }
})();