/* ============================================================
Monitoramento Cardíaco Lifelet - SISTEMA ORIGINAL
============================================================ */
(function() {
    'use strict';

    /* ========================================================
    BLOCO 1: Estado e Configurações
    ======================================================== */
    let currentUserId = null;
    let userSession = null;
    let heartbeatData = [];
    let currentAverage = null;
    let historicalData = [];
    let currentReading = null;
    let chartInstance = null;

    /* ========================================================
    BLOCO 2: Referências do DOM
    ======================================================== */
    const currentBPMElement = document.getElementById('currentBPM');
    const currentStatusElement = document.getElementById('currentStatus');
    const currentTimestampElement = document.getElementById('currentTimestamp');
    const averageBPMElement = document.getElementById('averageBPM');
    const minBPMElement = document.getElementById('minBPM');
    const maxBPMElement = document.getElementById('maxBPM');
    const variationBPMElement = document.getElementById('variationBPM');
    const heartZoneElement = document.getElementById('heartZone');
    const heartTrendElement = document.getElementById('heartTrend');
    const healthMessageElement = document.getElementById('healthMessage');
    const weekAverageElement = document.getElementById('weekAverage');
    const highestAverageElement = document.getElementById('highestAverage');
    const lowestAverageElement = document.getElementById('lowestAverage');
    const stabilityScoreElement = document.getElementById('stabilityScore');
    const recentReadingsTable = document.getElementById('recentReadingsTable');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const dateRangeBtn = document.getElementById('dateRangeBtn');
    const currentDateRangeElement = document.getElementById('currentDateRange');
    
    // Estado do período selecionado
    let currentDateRange = 7; // dias

    /* ========================================================
    BLOCO 3: Inicialização (SISTEMA ORIGINAL)
    ======================================================== */
    async function init() {
        console.log('Inicializando dashboard...');
        
        // Verificar autenticação (SISTEMA ORIGINAL)
        await checkAuthentication();
        
        if (currentUserId) {
            setupEventListeners();
            await loadAllData();
            updateDashboard();
            initializeChart();
            startRealTimeUpdates();
        } else {
            showNoAuthState();
        }
    }

    // Verificação de autenticação ORIGINAL
    async function checkAuthentication() {
        const session = localStorage.getItem('currentSession');
        if (!session) {
            updateUserDisplay('Visitante');
            showToast('Faça login para ver seus dados', 'info');
            return false;
        }
        
        try {
            const sessionData = JSON.parse(session);
            if (sessionData && sessionData.userId) {
                userSession = sessionData;
                currentUserId = sessionData.userId;
                updateUserDisplay(sessionData.name || 'Usuário');
                console.log('Usuário autenticado:', currentUserId);
                return true;
            } else {
                updateUserDisplay('Visitante');
                return false;
            }
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
            updateUserDisplay('Visitante');
            return false;
        }
    }

    function updateUserDisplay(name) {
        const elements = [
            document.getElementById('currentUser'),
            document.getElementById('dropdownUserName')
        ];
        
        elements.forEach(el => {
            if (el) el.textContent = name;
        });
    }

    /* ========================================================
    BLOCO 4: Carregamento de Dados (MANTIDO)
    ======================================================== */
    async function loadAllData() {
        try {
            console.log('Carregando dados para usuário:', currentUserId);
            
            const hoje = new Date().toISOString().split('T')[0];
            
            // 1. CARREGAR LEITURAS DO DIA ATUAL
            await loadHeartbeatData(hoje);
            
            // 2. CARREGAR MÉDIA DO DIA
            await loadCurrentAverage(hoje);
            
            // 3. CARREGAR HISTÓRICO
            await loadHistoricalData();
            
            // 4. CALCULAR LEITURA ATUAL
            calculateCurrentReading();
            
            console.log('Dados carregados com sucesso');
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar dados do monitoramento', 'error');
            loadFallbackData();
        }
    }

    async function loadHeartbeatData(date) {
        try {
            if (!window.api || !window.api.getBatimentosDia) {
                throw new Error('API não disponível');
            }
            
            const response = await window.api.getBatimentosDia(currentUserId, date);
            heartbeatData = processHeartbeatResponse(response);
            
        } catch (error) {
            console.error('Erro ao carregar leituras:', error);
            heartbeatData = [];
        }
    }

    function processHeartbeatResponse(response) {
        if (!response) return [];
        
        // Se for array, processar diretamente
        if (Array.isArray(response)) {
            return response.map(item => ({
                bpm: extractBPMValue(item),
                timestamp: extractTimestamp(item),
                time: extractTime(item),
                date: extractDate(item),
                deviceId: item.dispositivo || item.device || 'Monitor'
            })).filter(item => item.bpm > 0)
              .sort((a, b) => b.timestamp - a.timestamp);
        }
        
        // Se for objeto com propriedade 'leituras' ou 'data'
        if (response.leituras || response.data || response.batimentos) {
            const leituras = response.leituras || response.data || response.batimentos || [];
            if (Array.isArray(leituras)) {
                return leituras.map(item => ({
                    bpm: extractBPMValue(item),
                    timestamp: extractTimestamp(item),
                    time: extractTime(item),
                    date: extractDate(item),
                    deviceId: item.dispositivo || item.device || 'Monitor'
                })).filter(item => item.bpm > 0)
                  .sort((a, b) => b.timestamp - a.timestamp);
            }
        }
        
        return [];
    }

    function extractBPMValue(item) {
        return item.bpm || item.batimentos || item.valor || item.heartbeat || 0;
    }

    function extractTimestamp(item) {
        if (item.timestamp) return new Date(item.timestamp).getTime();
        if (item.dataHora) return new Date(item.dataHora).getTime();
        if (item.data && item.hora) {
            const [year, month, day] = item.data.split('-');
            const [hours, minutes] = item.hora.split(':');
            return new Date(year, month - 1, day, hours, minutes).getTime();
        }
        return Date.now();
    }

    function extractTime(item) {
        const timestamp = extractTimestamp(item);
        return new Date(timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function extractDate(item) {
        if (item.data) return item.data;
        const timestamp = extractTimestamp(item);
        return new Date(timestamp).toISOString().split('T')[0];
    }

    async function loadCurrentAverage(date) {
        try {
            if (!window.api || !window.api.getBatimentosMedia) {
                throw new Error('API não disponível');
            }
            
            const response = await window.api.getBatimentosMedia(currentUserId, date);
            currentAverage = processAverageResponse(response);
            
        } catch (error) {
            console.error('Erro ao carregar média:', error);
            currentAverage = null;
        }
    }

    function processAverageResponse(response) {
        if (!response) return null;
        
        // Extrair valores de diferentes formatos possíveis
        const avg = response.media || response.avg || response.average || response.valorMedio || 0;
        const min = response.minimo || response.min || 0;
        const max = response.maximo || response.max || 0;
        const count = response.totalLeituras || response.quantidade || response.count || 0;
        
        if (avg <= 0) return null;
        
        return {
            avg: Math.round(avg),
            min: Math.round(min || Math.max(0, avg - 10)),
            max: Math.round(max || avg + 10),
            readingsCount: count,
            variation: Math.round((max || avg + 10) - (min || Math.max(0, avg - 10)))
        };
    }

    async function loadHistoricalData() {
        try {
            if (!window.api || !window.api.getHistoricoMedia) {
                throw new Error('API não disponível');
            }
            
            const response = await window.api.getHistoricoMedia(currentUserId);
            historicalData = processHistoricalResponse(response);
            
            // Limitar histórico ao período selecionado
            if (currentDateRange && historicalData.length > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - currentDateRange);
                historicalData = historicalData.filter(item => {
                    const itemDate = new Date(item.timestamp);
                    return itemDate >= cutoffDate;
                });
            }
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            historicalData = [];
        }
    }

    function processHistoricalResponse(response) {
        if (!response) return [];
        
        if (Array.isArray(response)) {
            return response.map(item => ({
                date: item.data || new Date().toISOString().split('T')[0],
                timestamp: item.data ? new Date(item.data).getTime() : Date.now(),
                avgBPM: item.media || item.avg || item.average || 0,
                minBPM: item.minimo || item.min || 0,
                maxBPM: item.maximo || item.max || 0,
                readings: item.totalLeituras || item.quantidade || 0
            })).filter(item => item.avgBPM > 0 && item.date)
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-7);
        }
        
        return [];
    }

    function calculateCurrentReading() {
        if (heartbeatData.length === 0) {
            currentReading = null;
            return;
        }
        
        // Pegar a leitura mais recente
        const latest = heartbeatData[0];
        currentReading = {
            bpm: latest.bpm,
            timestamp: latest.timestamp,
            time: latest.time,
            date: latest.date,
            status: getBPMStatus(latest.bpm),
            deviceId: latest.deviceId
        };
    }

    function loadFallbackData() {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Dados de fallback para desenvolvimento
        heartbeatData = Array.from({ length: 10 }, (_, i) => {
            const timestamp = Date.now() - (i * 10 * 60 * 1000);
            const bpm = 70 + Math.floor(Math.random() * 15);
            return {
                bpm: bpm,
                timestamp: timestamp,
                time: new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                date: hoje,
                deviceId: 'Monitor-Fallback'
            };
        });
        
        currentAverage = {
            avg: 75,
            min: 68,
            max: 82,
            readingsCount: 10,
            variation: 14
        };
        
        const daysToGenerate = currentDateRange || 7;
        historicalData = Array.from({ length: daysToGenerate }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (daysToGenerate - 1 - i));
            return {
                date: date.toISOString().split('T')[0],
                timestamp: date.getTime(),
                avgBPM: 72 + Math.floor(Math.random() * 8),
                minBPM: 65 + Math.floor(Math.random() * 6),
                maxBPM: 78 + Math.floor(Math.random() * 8),
                readings: 80 + Math.floor(Math.random() * 40)
            };
        });
        
        calculateCurrentReading();
    }

    /* ========================================================
    BLOCO 5: Atualização do Dashboard (MANTIDO)
    ======================================================== */
    function updateDashboard() {
        updateCurrentBPMDisplay();
        updateAverageDisplay();
        updateHealthStatus();
        updateHistoricalStats();
        updateRecentReadingsTable();
    }

    function updateCurrentBPMDisplay() {
        if (!currentBPMElement) return;
        
        if (!currentReading || !currentReading.bpm) {
            currentBPMElement.textContent = '--';
            currentBPMElement.style.color = 'var(--color-muted)';
            
            if (currentStatusElement) {
                currentStatusElement.className = 'bpm-status unknown';
                currentStatusElement.innerHTML = `
                    <i class="fas fa-question-circle"></i>
                    <span>Sem dados</span>
                `;
            }
            
            if (currentTimestampElement) {
                currentTimestampElement.textContent = 'Aguardando primeira leitura...';
            }
            return;
        }
        
        // Mostrar dados REAIS
        currentBPMElement.textContent = currentReading.bpm;
        currentBPMElement.style.color = getBPMColor(currentReading.bpm);
        
        const status = currentReading.status;
        if (currentStatusElement) {
            currentStatusElement.className = `bpm-status ${status}`;
            currentStatusElement.innerHTML = `
                <i class="fas ${getStatusIcon(status)}"></i>
                <span>${getStatusText(status)}</span>
            `;
        }
        
        if (currentTimestampElement) {
            currentTimestampElement.textContent = 
                `Última leitura: ${currentReading.time} (Hoje)`;
        }
    }

    function updateAverageDisplay() {
        if (!currentAverage || !currentAverage.avg) {
            setDefaultAverageValues();
            
            // Tentar calcular a partir das leituras
            if (heartbeatData.length > 0) {
                const validBPMs = heartbeatData.map(r => r.bpm).filter(bpm => bpm > 0);
                if (validBPMs.length > 0) {
                    updateAverageFromReadings(validBPMs);
                }
            }
            return;
        }
        
        // Mostrar dados REAIS da API
        if (averageBPMElement) {
            averageBPMElement.textContent = currentAverage.avg;
            averageBPMElement.style.color = getBPMColor(currentAverage.avg);
        }
        
        if (minBPMElement) minBPMElement.textContent = currentAverage.min || '--';
        if (maxBPMElement) maxBPMElement.textContent = currentAverage.max || '--';
        if (variationBPMElement) variationBPMElement.textContent = currentAverage.variation || '--';
    }

    function updateAverageFromReadings(bpmValues) {
        const avg = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
        const min = Math.min(...bpmValues);
        const max = Math.max(...bpmValues);
        
        if (averageBPMElement) {
            averageBPMElement.textContent = avg;
            averageBPMElement.style.color = getBPMColor(avg);
        }
        
        if (minBPMElement) minBPMElement.textContent = min;
        if (maxBPMElement) maxBPMElement.textContent = max;
        if (variationBPMElement) variationBPMElement.textContent = max - min;
    }

    function setDefaultAverageValues() {
        if (averageBPMElement) {
            averageBPMElement.textContent = '--';
            averageBPMElement.style.color = 'var(--color-muted)';
        }
        if (minBPMElement) minBPMElement.textContent = '--';
        if (maxBPMElement) maxBPMElement.textContent = '--';
        if (variationBPMElement) variationBPMElement.textContent = '--';
    }

    function updateHealthStatus() {
        const bpmValue = currentReading ? currentReading.bpm : 0;
        
        if (!bpmValue || bpmValue <= 0) {
            setDefaultHealthValues();
            return;
        }
        
        const zone = getHeartZone(bpmValue);
        if (heartZoneElement) heartZoneElement.textContent = zone;
        
        let trend = { text: 'Estável', color: 'var(--color-muted)' };
        if (heartbeatData.length >= 2) {
            const recentBPMs = heartbeatData.slice(0, Math.min(5, heartbeatData.length)).map(r => r.bpm);
            trend = getHeartTrend(recentBPMs);
        }
        
        if (heartTrendElement) {
            heartTrendElement.textContent = trend.text;
            heartTrendElement.style.color = trend.color;
        }
        
        if (healthMessageElement) {
            healthMessageElement.textContent = getHealthMessage(zone, trend);
            healthMessageElement.style.borderLeftColor = getZoneColor(zone);
        }
    }

    function setDefaultHealthValues() {
        if (heartZoneElement) heartZoneElement.textContent = '--';
        if (heartTrendElement) {
            heartTrendElement.textContent = '--';
            heartTrendElement.style.color = 'var(--color-muted)';
        }
        if (healthMessageElement) {
            healthMessageElement.textContent = currentUserId ? 
                'Conectando ao dispositivo...' : 
                'Faça login para monitoramento';
            healthMessageElement.style.borderLeftColor = 'var(--color-primary)';
        }
    }

    function updateHistoricalStats() {
        if (historicalData.length === 0) {
            setDefaultHistoricalValues();
            return;
        }
        
        const validAverages = historicalData.map(d => d.avgBPM).filter(avg => avg > 0);
        
        if (validAverages.length === 0) {
            setDefaultHistoricalValues();
            return;
        }
        
        const periodAvg = Math.round(validAverages.reduce((a, b) => a + b, 0) / validAverages.length);
        const highest = Math.max(...validAverages);
        const lowest = Math.min(...validAverages);
        const stability = calculateStability(validAverages);
        
        if (weekAverageElement) {
            const label = currentDateRange === 7 ? 'Média 7 Dias' :
                         currentDateRange === 14 ? 'Média 14 Dias' :
                         'Média 30 Dias';
            weekAverageElement.parentElement.querySelector('.stat-label').textContent = label;
            weekAverageElement.textContent = periodAvg;
        }
        if (highestAverageElement) highestAverageElement.textContent = highest;
        if (lowestAverageElement) lowestAverageElement.textContent = lowest;
        if (stabilityScoreElement) stabilityScoreElement.textContent = stability;
    }

    function setDefaultHistoricalValues() {
        if (weekAverageElement) weekAverageElement.textContent = '--';
        if (highestAverageElement) highestAverageElement.textContent = '--';
        if (lowestAverageElement) lowestAverageElement.textContent = '--';
        if (stabilityScoreElement) stabilityScoreElement.textContent = '--';
    }

    function updateRecentReadingsTable() {
        if (!recentReadingsTable) return;
        
        if (heartbeatData.length === 0) {
            showNoReadingsMessage();
            return;
        }
        
        const recent = heartbeatData.slice(0, 10);
        recentReadingsTable.innerHTML = recent.map((reading, index) => `
            <tr>
                <td>${reading.time}</td>
                <td>
                    <strong style="color: ${getBPMColor(reading.bpm)}">
                        ${reading.bpm} BPM
                    </strong>
                </td>
                <td>
                    <span class="status-badge status-${getBPMStatus(reading.bpm)}">
                        ${getStatusText(getBPMStatus(reading.bpm))}
                    </span>
                </td>
                <td>
                    <i class="fas ${getTrendIcon(reading, index, recent)}"></i>
                    <span>${getTrendText(reading, index, recent)}</span>
                </td>
                <td>${getDurationFromNow(reading.timestamp)}</td>
            </tr>
        `).join('');
    }

    function getTrendIcon(reading, index, readings) {
        if (index === 0 || readings.length < 2) return 'fa-minus';
        
        const prevReading = readings[index - 1];
        if (reading.bpm > prevReading.bpm + 2) return 'fa-arrow-up';
        if (reading.bpm < prevReading.bpm - 2) return 'fa-arrow-down';
        return 'fa-minus';
    }

    function getTrendText(reading, index, readings) {
        if (index === 0 || readings.length < 2) return 'Estável';
        
        const prevReading = readings[index - 1];
        const diff = reading.bpm - prevReading.bpm;
        
        if (diff > 5) return 'Subindo rapidamente';
        if (diff > 2) return 'Subindo';
        if (diff < -5) return 'Descendo rapidamente';
        if (diff < -2) return 'Descendo';
        return 'Estável';
    }

    /* ========================================================
    BLOCO 6: Atualizações em Tempo Real (MANTIDO)
    ======================================================== */
    function startRealTimeUpdates() {
        if (!currentUserId) return;
        
        // Atualizar a cada 15 segundos
        const interval = setInterval(async () => {
            try {
                const hoje = new Date().toISOString().split('T')[0];
                
                // Buscar novas leituras
                await loadHeartbeatData(hoje);
                
                // Recalcular leitura atual
                calculateCurrentReading();
                
                // Atualizar displays em tempo real
                updateCurrentBPMDisplay();
                updateRecentReadingsTable();
                
                // A cada minuto, atualizar média
                if (Date.now() % 60000 < 15000) {
                    await loadCurrentAverage(hoje);
                    updateAverageDisplay();
                    updateHealthStatus();
                }
                
                // A cada 5 minutos, atualizar histórico
                if (Date.now() % 300000 < 15000) {
                    await loadHistoricalData();
                    updateHistoricalStats();
                    initializeChart();
                }
                
            } catch (error) {
                console.error('Erro na atualização em tempo real:', error);
            }
        }, 15000);
        
        // Limpar intervalo ao sair da página
        window.addEventListener('beforeunload', () => clearInterval(interval));
    }

    /* ========================================================
    BLOCO 7: Gráfico de Histórico (MANTIDO)
    ======================================================== */
    function initializeChart() {
        const ctx = document.getElementById('heartHistoryChart');
        if (!ctx) return;
        
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        const validData = historicalData.filter(d => d.avgBPM > 0);
        
        if (validData.length === 0) {
            showNoChartData(ctx);
            return;
        }
        
        // Atualizar título da seção do gráfico
        const chartSectionHeader = document.querySelector('.history-section .section-header h2');
        if (chartSectionHeader) {
            const periodText = currentDateRange === 7 ? 'Últimos 7 Dias' :
                              currentDateRange === 14 ? 'Últimos 14 Dias' :
                              'Últimos 30 Dias';
            chartSectionHeader.innerHTML = `<i class="fas fa-history"></i> Histórico da Média (${periodText})`;
        }
        
        const labels = validData.map(d => {
            const date = new Date(d.timestamp);
            return date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit' 
            });
        });
        
        const data = validData.map(d => d.avgBPM);
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média de Batimentos (BPM)',
                    data: data,
                    borderColor: 'rgb(74, 163, 255)',
                    backgroundColor: 'rgba(74, 163, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(74, 163, 255)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(22, 27, 34, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const data = validData[context.dataIndex];
                                return [
                                    `Média: ${data.avgBPM} BPM`,
                                    `Mín: ${data.minBPM || '--'} BPM`,
                                    `Máx: ${data.maxBPM || '--'} BPM`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(50, Math.min(...data) - 10),
                        max: Math.min(120, Math.max(...data) + 10),
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            callback: function(value) { return value + ' BPM'; }
                        }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.6)' }
                    }
                }
            }
        });
    }

    /* ========================================================
    BLOCO 8: Funções Utilitárias (MANTIDAS)
    ======================================================== */
    function getBPMStatus(bpm) {
        if (!bpm || bpm <= 0) return 'unknown';
        if (bpm < 60) return 'critical';
        if (bpm < 100) return 'normal';
        if (bpm < 120) return 'elevated';
        return 'critical';
    }

    function getBPMColor(bpm) {
        if (!bpm || bpm <= 0) return 'var(--color-muted)';
        if (bpm < 60) return 'var(--color-danger)';
        if (bpm < 100) return 'var(--color-success)';
        if (bpm < 120) return 'var(--color-warning)';
        return 'var(--color-danger)';
    }

    function getStatusIcon(status) {
        switch(status) {
            case 'normal': return 'fa-check-circle';
            case 'elevated': return 'fa-exclamation-triangle';
            case 'critical': return 'fa-heart-crack';
            default: return 'fa-question-circle';
        }
    }

    function getStatusText(status) {
        switch(status) {
            case 'normal': return 'Normal';
            case 'elevated': return 'Elevado';
            case 'critical': return 'Crítico';
            default: return 'Sem dados';
        }
    }

    function getHeartZone(bpm) {
        if (!bpm || bpm <= 0) return 'Sem dados';
        if (bpm < 60) return 'Muito Baixa';
        if (bpm < 70) return 'Baixa';
        if (bpm < 85) return 'Normal';
        if (bpm < 100) return 'Moderada';
        if (bpm < 120) return 'Alta';
        return 'Muito Alta';
    }

    function getZoneColor(zone) {
        switch(zone) {
            case 'Muito Baixa': return 'var(--color-danger)';
            case 'Baixa': return 'var(--color-warning)';
            case 'Normal': return 'var(--color-success)';
            case 'Moderada': return 'var(--color-primary)';
            case 'Alta': return 'var(--color-warning)';
            case 'Muito Alta': return 'var(--color-danger)';
            default: return 'var(--color-muted)';
        }
    }

    function getHeartTrend(bpmArray) {
        if (bpmArray.length < 2) return { text: 'Estável', color: 'var(--color-muted)' };
        
        const firstHalf = bpmArray.slice(0, Math.floor(bpmArray.length / 2));
        const secondHalf = bpmArray.slice(Math.floor(bpmArray.length / 2));
        
        const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const diff = avg2 - avg1;
        
        if (diff > 2) return { text: 'Subindo', color: 'var(--color-danger)' };
        if (diff < -2) return { text: 'Descendo', color: 'var(--color-success)' };
        return { text: 'Estável', color: 'var(--color-muted)' };
    }

    function getHealthMessage(zone, trend) {
        if (zone === 'Sem dados') return 'Aguardando dados...';
        if (zone === 'Normal' && trend.text === 'Estável') return 'Batimentos normais e estáveis';
        if (zone === 'Alta' || zone === 'Muito Alta') return 'Batimentos elevados. Considere descansar.';
        if (zone === 'Baixa' || zone === 'Muito Baixa') return 'Batimentos baixos. Verifique hidratação.';
        if (trend.text === 'Subindo') return 'Tendência de aumento detectada.';
        return 'Monitoramento em andamento.';
    }

    function calculateStability(averages) {
        if (averages.length < 2) return 100;
        const mean = averages.reduce((a, b) => a + b, 0) / averages.length;
        const variance = averages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / averages.length;
        const stdDev = Math.sqrt(variance);
        const stability = Math.max(0, 100 - (stdDev * 8));
        return Math.round(stability);
    }

    function getDurationFromNow(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes} min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h atrás`;
        const days = Math.floor(hours / 24);
        return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }

    /* ========================================================
    BLOCO 9: Event Listeners e Gerenciamento de UI (ORIGINAL)
    ======================================================== */
    function setupEventListeners() {
        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                refreshBtn.disabled = true;
                
                await loadAllData();
                updateDashboard();
                initializeChart();
                
                setTimeout(() => {
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
                    refreshBtn.disabled = false;
                    showToast('Dados atualizados', 'success');
                }, 500);
            });
        }
        
        // Export button
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }
        
        // Date range button
        if (dateRangeBtn) {
            dateRangeBtn.addEventListener('click', () => {
                // Alterna entre 7, 14, 30 dias
                const ranges = [7, 14, 30];
                const currentIndex = ranges.indexOf(currentDateRange);
                const nextIndex = (currentIndex + 1) % ranges.length;
                currentDateRange = ranges[nextIndex];
                
                // Atualiza texto do botão
                if (currentDateRangeElement) {
                    currentDateRangeElement.textContent = 
                        currentDateRange === 7 ? 'Últimos 7 dias' :
                        currentDateRange === 14 ? 'Últimos 14 dias' :
                        'Últimos 30 dias';
                }
                
                // Recarrega dados com novo período
                loadAllData().then(() => {
                    updateDashboard();
                    initializeChart();
                    showToast(`Período alterado para ${currentDateRange} dias`, 'info');
                });
            });
        }
        
        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }
        
        // Logout button (SISTEMA ORIGINAL)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Limpar localStorage (SISTEMA ORIGINAL)
                localStorage.removeItem('currentSession');
                localStorage.removeItem('authToken');
                
                showToast('Você saiu da sessão', 'info');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            });
        }
    }

    function showNoAuthState() {
        if (healthMessageElement) {
            healthMessageElement.textContent = 'Faça login para acessar o monitoramento cardíaco';
            healthMessageElement.style.borderLeftColor = 'var(--color-primary)';
        }
        
        if (recentReadingsTable) {
            recentReadingsTable.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <i class="fas fa-user-circle" style="font-size: 2rem; margin-bottom: 10px; color: var(--color-muted); display: block;"></i>
                        <p style="color: var(--color-muted); margin-bottom: 15px;">Faça login para ver seus dados</p>
                        <button class="control-btn" onclick="window.location.href='login.html'">
                            <i class="fas fa-sign-in-alt"></i>
                            Fazer Login
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    function showNoReadingsMessage() {
        if (!recentReadingsTable) return;
        
        recentReadingsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="fas fa-heartbeat" style="font-size: 2rem; margin-bottom: 10px; color: var(--color-muted); display: block;"></i>
                    <p style="color: var(--color-muted);">Nenhuma leitura disponível hoje</p>
                    <p style="color: var(--color-muted); font-size: 0.9rem; margin-top: 10px;">O dispositivo pode estar desconectado</p>
                </td>
            </tr>
        `;
    }

    function showNoChartData(ctx) {
        const ctx2d = ctx.getContext('2d');
        ctx2d.clearRect(0, 0, ctx.width, ctx.height);
        ctx2d.fillStyle = 'var(--color-muted)';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.font = '14px sans-serif';
        ctx2d.fillText('Aguardando dados históricos', ctx.width / 2, ctx.height / 2);
    }

    function exportData() {
        if (!currentReading && heartbeatData.length === 0) {
            showToast('Nenhum dado disponível para exportar', 'warning');
            return;
        }
        
        const data = {
            userId: currentUserId,
            exportDate: new Date().toISOString(),
            currentReading: currentReading,
            currentAverage: currentAverage,
            historicalData: historicalData,
            dailyReadings: heartbeatData.slice(0, 20)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifelet-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Dados exportados com sucesso', 'success');
    }

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        const icon = toast.querySelector('i');
        if (icon) {
            icon.className = type === 'success' ? 'fas fa-check-circle' : 
                           type === 'error' ? 'fas fa-exclamation-circle' : 
                           'fas fa-info-circle';
        }
        
        toast.style.display = 'flex';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    /* ========================================================
    BLOCO 10: Bootstrap
    ======================================================== */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();