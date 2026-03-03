/* ============================================================
BLOCO 1: Alternância de tema
O que faz: alterna entre tema claro/escuro na landing page.
Como faz: lê/salva preferência no localStorage e atualiza ícone.
============================================================ */
(function () {
    const root = document.documentElement; // pode ser document.body também
    const toggleBtn = document.getElementById('darkModeToggle');
    const ICON_MOON = 'fa-moon';
    const ICON_SUN = 'fa-sun';

    // Carregar preferência salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        // padrão escuro, sem atributo necessário
        root.removeAttribute('data-theme');
    }

    function updateIcon() {
        const isLight = root.getAttribute('data-theme') === 'light';
        const icon = toggleBtn?.querySelector('i');
        if (!icon) return;
        icon.classList.toggle(ICON_MOON, !isLight);
        icon.classList.toggle(ICON_SUN, isLight);
    }

    function toggleTheme() {
        const isLight = root.getAttribute('data-theme') === 'light';
        if (isLight) {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        updateIcon();
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
        updateIcon();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            const lateBtn = document.getElementById('darkModeToggle');
            if (lateBtn) {
                lateBtn.addEventListener('click', toggleTheme);
                updateIcon();
            }
        });
    }
})();



/* ============================================================
BLOCO 2: Reprodução de áudio acessível
O que faz: toca áudios institucionais com fallback e correção de caminho.
Como faz: reutiliza elemento Audio único e expõe window.playAudio.
============================================================ */
(function () {
    let sharedAudioElement = null;

    function ensureAudioElement() {
        if (sharedAudioElement) return sharedAudioElement;
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        sharedAudioElement = audio;
        return audio;
    }

    function resolveSourceOrFallback(requestedSrc) {
        // Corrige caminhos comuns incorretos: troca ../AUDIO por ../IMG
        if (typeof requestedSrc === 'string' && requestedSrc.toUpperCase().includes('/AUDIO/')) {
            return requestedSrc.replace(/\/AUDIO\//i, '/IMG/');
        }
        // Se não vier nada válido, usa padrão existente na pasta IMG
        const src = typeof requestedSrc === 'string' && requestedSrc.trim().length > 0
            ? requestedSrc
            : '../IMG/audio.mp3';
        return src;
    }

    async function playWithFallback(primarySrc) {
        const audio = ensureAudioElement();
        const DEFAULT_FALLBACK = '../IMG/audio.mp3';

        try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = primarySrc;
            await audio.play();
            return;
        } catch (err) {
            // Tenta fallback padrão se a primeira tentativa falhar
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.src = DEFAULT_FALLBACK;
                await audio.play();
            } catch (_) {
                // Silencia erros; evita quebrar a UI
                // console.warn('Falha ao reproduzir áudio:', err);
            }
        }
    }

    // Expor função global para ser usada no HTML via onclick
    window.playAudio = function (requestedSrc) {
        const src = resolveSourceOrFallback(requestedSrc);
        playWithFallback(src);
    };
})();

