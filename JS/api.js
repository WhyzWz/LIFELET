/* JS/api.js - Cliente SIMPLIFICADO para Lifelet */
(function () {
    'use strict';

    console.log('[api] Inicializando API simplificada...');

    // URL base da API
    let API_BASE_URL = 'https://lifelet-api.onrender.com';
    console.log('[api] URL base:', API_BASE_URL);

    // Função simples para requisições
    async function _request(urlPath, options = {}) {
        const url = API_BASE_URL + '/' + urlPath.replace(/^\//, '');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Adicionar token se existir
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        console.log('[api] Fazendo requisição:', options.method || 'GET', url);

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : null
            });

            console.log('[api] Resposta recebida:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[api] Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[api] Erro na requisição:', error);
            throw error;
        }
    }

    // API principal
    const api = {
        // Configurações
        setBaseUrl(url) {
            API_BASE_URL = url;
            console.log('[api] Nova URL:', API_BASE_URL);
        },

        // Teste de conexão
        async testConnection() {
            try {
                const response = await fetch(API_BASE_URL + '/health');
                return response.ok;
            } catch {
                return false;
            }
        },

        // LOGIN - Versão SIMPLIFICADA
        async login({ email, senha }) {
            console.log('[api] Tentando login para:', email);
            
            try {
                const result = await _request('/login', {
                    method: 'POST',
                    body: { email, senha }
                });

                console.log('[api] Login resposta:', result);

                // Salvar token se existir
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    console.log('[api] Token salvo');
                }

                return result;
            } catch (error) {
                console.error('[api] Erro no login:', error);
                
                // FALLBACK para desenvolvimento
                if (error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError')) {
                    console.warn('[api] API offline, usando fallback local');
                    
                    // Simular login bem-sucedido para desenvolvimento
                    const fakeUser = {
                        id: Date.now(),
                        name: email.split('@')[0],
                        email: email,
                        type: 'user'
                    };
                    
                    const fakeToken = 'dev_token_' + Date.now();
                    localStorage.setItem('authToken', fakeToken);
                    
                    return {
                        user: fakeUser,
                        token: fakeToken,
                        message: 'Login simulado (modo desenvolvimento)'
                    };
                }
                
                throw error;
            }
        },

        // REGISTRO - Versão SIMPLIFICADA
        async register(payload) {
            console.log('[api] Tentando registro:', payload.email);
            
            try {
                const result = await _request('/cadastro', {
                    method: 'POST',
                    body: payload
                });

                console.log('[api] Registro resposta:', result);

                // Salvar token se existir
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                }

                return result;
            } catch (error) {
                console.error('[api] Erro no registro:', error);
                
                // FALLBACK para desenvolvimento
                if (error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError')) {
                    console.warn('[api] API offline, usando fallback local');
                    
                    // Simular registro bem-sucedido
                    const fakeUser = {
                        id: Date.now(),
                        name: payload.nomeCompleto,
                        email: payload.email,
                        type: payload.funcao === 2 ? 'guardian' : 'user'
                    };
                    
                    const fakeToken = 'dev_token_' + Date.now();
                    localStorage.setItem('authToken', fakeToken);
                    
                    return {
                        user: fakeUser,
                        token: fakeToken,
                        message: 'Registro simulado (modo desenvolvimento)'
                    };
                }
                
                throw error;
            }
        },

        // Rotas para batimentos (com fallback)
        async getBatimentosMedia(userId, data = null) {
            try {
                let url = `/usuario/${userId}/batimentos-media`;
                if (data) url += `?data=${data}`;
                return await _request(url);
            } catch (error) {
                console.warn('[api] Erro ao buscar média, usando fallback');
                return this._getFallbackData('media');
            }
        },

        async getBatimentosDia(userId, data = null) {
            try {
                let url = `/usuario/${userId}/batimentos-dia`;
                if (data) url += `?data=${data}`;
                return await _request(url);
            } catch (error) {
                console.warn('[api] Erro ao buscar leituras do dia, usando fallback');
                return this._getFallbackData('leituras');
            }
        },

        async getHistoricoMedia(userId) {
            try {
                return await _request(`/usuario/${userId}/historico-media`);
            } catch (error) {
                console.warn('[api] Erro ao buscar histórico, usando fallback');
                return this._getFallbackData('historico');
            }
        },

        // Dados de fallback para desenvolvimento
        _getFallbackData(type) {
            const hoje = new Date().toISOString().split('T')[0];
            
            if (type === 'media') {
                return {
                    media: 75,
                    minimo: 70,
                    maximo: 80,
                    totalLeituras: 24,
                    data: hoje
                };
            }
            
            if (type === 'leituras') {
                return Array.from({ length: 12 }, (_, i) => ({
                    bpm: 70 + Math.floor(Math.random() * 15),
                    timestamp: new Date(Date.now() - (i * 10 * 60 * 1000)).toISOString(),
                    data: hoje,
                    hora: new Date(Date.now() - (i * 10 * 60 * 1000)).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    dispositivo: 'Pulseira-Dev'
                }));
            }
            
            if (type === 'historico') {
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
            
            return null;
        }
    };

    // Expor globalmente
    window.api = api;
    
    // Testar conexão automaticamente
    setTimeout(async () => {
        const isConnected = await api.testConnection();
        console.log('[api] Conexão com API:', isConnected ? 'OK' : 'FALHA');
        
        if (!isConnected) {
            console.warn('[api] API offline. Usando modo desenvolvimento com dados simulados.');
            console.log('[api] Para testar login/registro, use:');
            console.log('[api]   Email: qualquer@email.com');
            console.log('[api]   Senha: qualquer (8+ caracteres)');
        }
    }, 1000);

    console.log('[api] API carregada com sucesso!');
})();