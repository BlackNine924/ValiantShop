# Guia de Implementação: Bot de Notificações Discord (ValiantShop)

Este guia explica como transformar o site em um sistema inteligente que avisa o jogador no Discord quando sua encomenda muda de status ("Pronta", "Em Breeding", etc.) de forma automática, privada e **100% gratuita (sem precisar de cartão de crédito)**.

---

## 🏗️ Arquitetura Proposta

Para não depender do Firebase Cloud Functions (que exige cartão de crédito), usamos um **Script Node.js Notificador** independente que monitora o banco de dados.

### O que o sistema já tem preparado:
1. **Coleção Firestore `users`**: Armazena o `discordId`, permitindo mensagens diretas (DMs) privadas.
2. **Coleção Firestore `orders`**: Monitora as mudanças de status dos pedidos.
3. **Privacidade**: O bot respeita o toggle nas configurações do site.

---

## ☁️ Por que o Render.com é a melhor opção?

O **Render.com** é excelente para o seu caso porque:
- **100% Gratuito**: Você não precisa de cartão de crédito para o plano "Free".
- **Fácil de usar**: Ele se conecta direto ao seu GitHub e atualiza o bot toda vez que você envia código novo.
- **Confiável**: Diferente de outros serviços grátis, o Render mantém o serviço estável contanto que receba um "ping" ocasional (que o script já está preparado para lidar).

---

## 🛠️ Passo a Passo Detalhado: Colocando no Render.com

Siga estes passos para ter o bot rodando na nuvem agora mesmo:

### 1. Preparar os Arquivos (No seu PC)
1. Vá ao [Console do Firebase](https://console.firebase.google.com/) > Configurações > Contas de Serviço.
2. Clique em **Gerar nova chave privada**, baixe o arquivo `.json` e renomeie para **`serviceAccountKey.json`**.
3. Coloque esse arquivo na raiz da pasta do seu projeto.
4. Faça o **Push** de todo o código (incluindo o `serviceAccountKey.json` e a pasta `scripts`) para o seu repositório no **GitHub**.

### 2. Criar o Serviço no Render
1. Acesse [dashboard.render.com](https://dashboard.render.com/) e crie sua conta (pode usar o login do GitHub).
2. Clique em **New +** > **Web Service**.
3. Selecione o seu repositório do **ValiantShop**.

### 3. Configurações do Serviço
Use estas configurações exatamente:
- **Name**: `valiantshop-notifier`
- **Region**: (Qualquer uma, ex: Oregon)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node scripts/valiant-notifier.js`

### 4. Variáveis de Ambiente (Segurança)
Clique na aba **Environment** e adicione:
- **`DISCORD_TOKEN`**: (O seu token do bot do Discord).
- **`PORT`**: `3000` (Isso ativa o servidor web interno para manter o bot vivo).

---

## 🏠 Alternativa: Rodar no seu próprio PC

Se você preferir não usar a nuvem agora, pode rodar direto no terminal onde você já trabalha:

1. Instale as dependências: `npm install discord.js firebase-admin dotenv express`
2. Rode: `node scripts/valiant-notifier.js`

O bot funcionará perfeitamente enquanto o seu computador estiver ligado e o terminal aberto.

---

**Conclusão**: O roteiro mais seguro e gratuito para você agora é rodar o script `scripts/valiant-notifier.js`. Ele usa o que já construímos hoje (Firestore + Vínculo de Discord) e é a única forma de automatizar tudo sem precisar de um cartão de crédito.
