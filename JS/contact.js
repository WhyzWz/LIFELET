(function () {
    /* ========================================================
    BLOCO 1: Setup do Email/Contato
    O que faz: inicializa EmailJS (quando configurado) e orquestra envios.
    Como faz: define helpers de init e listeners assim que o DOM carrega.
    ======================================================== */

    // Inicializa o EmailJS (apenas se estiver configurado)
    function initializeEmailJS() {
        // Verifica se as credenciais do EmailJS estão configuradas
        if (window.emailjsPublicKey && 
            window.emailjsPublicKey !== 'YOUR_PUBLIC_KEY' &&
            typeof emailjs !== 'undefined') {
            try {
                emailjs.init(window.emailjsPublicKey);
                console.log('EmailJS inicializado com sucesso');
            } catch (error) {
                console.warn('Erro ao inicializar EmailJS:', error);
            }
        }
    }

    /* ========================================================
    BLOCO 2: Preparação do formulário
    O que faz: obtém elementos, ativa validação e escolhe estratégia de envio.
    Como faz: registra submit handler que decide entre EmailJS, FormSubmit ou mailto.
    ======================================================== */
    function setupContactForm() {
        const form = document.getElementById('contactForm');
        const toast = document.getElementById('toast');

        if (!form || !toast) return;

        // Inicializa o EmailJS quando o formulário é carregado
        initializeEmailJS();

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            // Usa validação nativa do HTML5
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Coleta os dados do formulário
            const formData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                assunto: document.getElementById('assunto').value,
                mensagem: document.getElementById('mensagem').value,
                destinatario: 'projetolifelet@gmail.com'
            };

            // Desabilita o botão de envio para evitar múltiplos envios
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            // Verifica se o EmailJS está configurado corretamente
            if (typeof emailjs !== 'undefined' && 
                emailjs.init && 
                window.emailjsPublicKey && 
                window.emailjsPublicKey !== 'YOUR_PUBLIC_KEY' &&
                window.emailjsServiceId && 
                window.emailjsServiceId !== 'YOUR_SERVICE_ID' &&
                window.emailjsTemplateId && 
                window.emailjsTemplateId !== 'YOUR_TEMPLATE_ID') {
                
                // Envia o email usando EmailJS
                emailjs.send(window.emailjsServiceId, window.emailjsTemplateId, formData)
                    .then(function(response) {
                        console.log('Email enviado com sucesso!', response.status, response.text);
                        
                        // Exibe o toast de sucesso
                        toast.innerHTML = '<i class="fas fa-check-circle"></i> Mensagem enviada com sucesso!';
                        toast.style.display = 'block';
                        toast.style.backgroundColor = '#4CAF50';

                        // Limpa o formulário
                        form.reset();

                    }, function(error) {
                        console.error('Erro ao enviar email:', error);
                        
                        // Exibe o toast de erro
                        toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro ao enviar mensagem. Tente novamente.';
                        toast.style.display = 'block';
                        toast.style.backgroundColor = '#f44336';
                    })
                    .finally(function() {
                        // Reabilita o botão de envio
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;

                        // Oculta o toast após 5s
                        window.clearTimeout(window.__toastTimer);
                        window.__toastTimer = window.setTimeout(function () {
                            toast.style.display = 'none';
                        }, 5000);
                    });
            } else {
                // Solução alternativa: Usar FormSubmit para envio automático
                // Esta é uma solução que funciona imediatamente sem configuração
                try {
                    // Usa FormSubmit para envio automático
                    // FormSubmit é gratuito e funciona imediatamente
                    const formSubmitEndpoint = 'https://formsubmit.co/projetolifelet@gmail.com';
                    
                    const formDataToSend = new FormData();
                    formDataToSend.append('name', formData.nome);
                    formDataToSend.append('email', formData.email);
                    formDataToSend.append('subject', `Contato Lifelet - ${formData.assunto}`);
                    formDataToSend.append('message', formData.mensagem);
                    formDataToSend.append('_next', window.location.href); // Redireciona após envio
                    formDataToSend.append('_captcha', 'false'); // Desabilita captcha
                    formDataToSend.append('_template', 'table'); // Template simples
                    
                    // Envia via FormSubmit
                    fetch(formSubmitEndpoint, {
                        method: 'POST',
                        body: formDataToSend
                    })
                    .then(response => {
                        if (response.ok) {
                            // Exibe o toast de sucesso
                            toast.innerHTML = '<i class="fas fa-check-circle"></i> Mensagem enviada automaticamente!';
                            toast.style.display = 'block';
                            toast.style.backgroundColor = '#4CAF50';
                            
                            // Limpa o formulário
                            form.reset();
                        } else {
                            throw new Error('Erro na resposta do servidor');
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao enviar via Formspree:', error);
                        
                        // Fallback: Abre cliente de email
                        const subject = encodeURIComponent(`Contato Lifelet - ${formData.assunto}`);
                        const body = encodeURIComponent(
                            `Nome: ${formData.nome}\n` +
                            `Email: ${formData.email}\n` +
                            `Assunto: ${formData.assunto}\n\n` +
                            `Mensagem:\n${formData.mensagem}\n\n` +
                            `---\n` +
                            `Enviado através do formulário de contato do site Lifelet.`
                        );
                        
                        const mailtoLink = `mailto:${formData.destinatario}?subject=${subject}&body=${body}`;
                        window.location.href = mailtoLink;
                        
                        toast.innerHTML = '<i class="fas fa-info-circle"></i> Abrindo cliente de email como alternativa...';
                        toast.style.display = 'block';
                        toast.style.backgroundColor = '#2196F3';
                        
                        form.reset();
                    })
                    .finally(() => {
                        // Reabilita o botão de envio
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;

                        // Oculta o toast após 4s
                        window.clearTimeout(window.__toastTimer);
                        window.__toastTimer = window.setTimeout(function () {
                            toast.style.display = 'none';
                        }, 4000);
                    });

                } catch (error) {
                    console.error('Erro geral:', error);
                    
                    // Exibe o toast de erro
                    toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro ao enviar mensagem. Tente novamente.';
                    toast.style.display = 'block';
                    toast.style.backgroundColor = '#f44336';
                    
                    // Reabilita o botão de envio
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;

                    // Oculta o toast após 4s
                    window.clearTimeout(window.__toastTimer);
                    window.__toastTimer = window.setTimeout(function () {
                        toast.style.display = 'none';
                    }, 4000);
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupContactForm);
    } else {
        setupContactForm();
    }
})();


