# Configuração do EmailJS para Envio de Emails

## Passos para Configurar o EmailJS

### 1. Criar Conta no EmailJS
1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu email

### 2. Configurar Serviço de Email
1. No dashboard do EmailJS, vá para "Email Services"
2. Clique em "Add New Service"
3. Escolha seu provedor de email (Gmail, Outlook, etc.)
4. Configure com as credenciais do email `projetolifelet@gmail.com`
5. Anote o **Service ID** gerado

### 3. Criar Template de Email
1. Vá para "Email Templates"
2. Clique em "Create New Template"
3. Use o seguinte template:

**Subject:** Nova mensagem de contato - {{assunto}}

**Body:**
```
Nova mensagem recebida através do site Lifelet:

Nome: {{nome}}
Email: {{email}}
Assunto: {{assunto}}

Mensagem:
{{mensagem}}

---
Enviado automaticamente pelo formulário de contato do site Lifelet.
```

4. Salve o template e anote o **Template ID**

### 4. Obter Chave Pública
1. Vá para "Account" > "General"
2. Copie sua **Public Key**

### 5. Atualizar o Código
Substitua os seguintes valores no arquivo `contact.js`:

```javascript
// Linha 5: Substitua "YOUR_PUBLIC_KEY" pela sua chave pública
emailjs.init("SUA_CHAVE_PUBLICA_AQUI");

// Linha 42: Substitua pelos seus IDs
emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', formData)
```

### 6. Testar
1. Abra o site no navegador
2. Preencha o formulário de contato
3. Envie uma mensagem de teste
4. Verifique se o email chegou em `projetolifelet@gmail.com`

## Limites da Conta Gratuita
- 200 emails por mês
- Suporte básico
- Templates personalizados

## Solução Alternativa (Sem EmailJS)
Se preferir não usar EmailJS, você pode:
1. Usar um serviço como Formspree, Netlify Forms, ou Getform
2. Implementar um backend simples com Node.js + Nodemailer
3. Usar APIs de email como SendGrid ou Mailgun

## Troubleshooting
- Verifique se as credenciais estão corretas
- Confirme se o template está configurado corretamente
- Verifique o console do navegador para erros
- Teste com diferentes navegadores

