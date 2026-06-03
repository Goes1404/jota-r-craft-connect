# 📋 Como Obter o Access Token do Mercado Pago

**Destinatário:** Cliente (CNPJ: 66.224.091/0001-57)

---

## ⚠️ Importante
Este token é **confidencial e privado**. Ele permite movimentar dinheiro da sua conta. **Nunca compartilhe com pessoas não autorizadas.**

---

## 📌 Passos para Extrair o Access Token

### 1️⃣ Acesse a Conta Mercado Pago
- Vá para **[www.mercadopago.com.br](https://www.mercadopago.com.br)**
- Faça login com suas credenciais (CPF/email e senha)
- **Certifique-se de estar na conta da sua EMPRESA (CNPJ)**, não pessoal

### 2️⃣ Acesse as Credenciais
- Clique no seu **Avatar/Perfil** (canto superior direito)
- Selecione **"Configurações da conta"** ou **"Mis datos"**
- Procure por **"Credenciales"** ou **"Chaves de API"**
- Ou acesse direto: [Credenciais Mercado Pago](https://www.mercadopago.com.br/developers/panel/credentials)

### 3️⃣ Identifique o Access Token de Produção
Você verá algo assim:

```
┌─────────────────────────────────────────┐
│  CREDENCIALES PROD (PRODUÇÃO)           │
├─────────────────────────────────────────┤
│  Public Key: APP_USR-xxxxxxx...        │
│  Access Token: APP_USR_xxxxxxx...      │
└─────────────────────────────────────────┘
```

**Copie apenas o `Access Token`** (aquele que começa com `APP_USR_`)

### 4️⃣ Compartilhe de Forma Segura
**Copie o token completo e envie para o desenvolvedor por:**
- ✅ WhatsApp Business (mais seguro)
- ✅ Email corporativo
- ❌ Não compartilhe em chat público / Slack público
- ❌ Não registre em documentos públicos

---

## 🔍 Verificação Rápida

Se estiver vendo **"Credenciales de Sandbox"** em vez de **"Produção"**, você está visualizando credenciais de teste. 

**Procure pela aba/botão "Produção"** para ver as credenciais reais.

---

## 📞 Dúvidas?
Se não encontrar a seção de credenciais:
1. Verifique se está logado na conta **correta (CNPJ)**
2. Se a conta for nova, pode levar até **24h** para habilitar a seção de credenciais
3. Contate o suporte Mercado Pago: https://www.mercadopago.com.br/ajuda

---

## ✅ Pronto!
Após enviar o token para o desenvolvedor, o sistema começará a gerar QR codes PIX automaticamente e o dinheiro entrará na sua conta.

