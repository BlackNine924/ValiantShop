// ValiantShop Discord Notifier Bot
// Este script roda 24/7 e envia DMs automáticas quando pedidos mudam no Firestore.
// 100% Gratuito (Pode ser rodado no seu PC ou em serviços como Koyeb)

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Servidor Web simples para manter o Render.com ativo (Health Check)
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot da ValiantShop está online! ✨'));
app.listen(port, () => console.log(`🌍 Health check pronto na porta ${port}`));

// 1. Inicialização do Firebase Admin
// Você vai precisar baixar o seu arquivo 'serviceAccountKey.json' no Console do Firebase
// Configurações do Projeto > Contas de Serviço > Gerar nova chave privada
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 2. Inicialização do Bot do Discord
const client = new Client({ 
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds],
    partials: ['CHANNEL'] 
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
  console.log(`✅ Bot Notificador Online como ${client.user.tag}`);
  startListening();
});

// 3. Lógica de Monitoramento em Tempo Real
function startListening() {
  console.log('👀 Monitorando alterações em "orders"...');
  
  db.collection('orders').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      // Só dispara quando um pedido existente é MODIFICADO (ex: status mudou)
      if (change.type === 'modified') {
        const order = change.doc.data();
        const prevOrder = change.before ? change.doc.data() : null; // Simplificado

        console.log(`🔔 Alteração detectada no pedido ${change.doc.id}`);

        // 1. Buscar o ID do Discord do usuário no banco
        try {
            const userDoc = await db.collection('users').doc(order.uid).get();
            const userData = userDoc.data();

            if (userData && userData.discordId) {
                // 2. Tentar enviar a DM Privada
                const discordUser = await client.users.fetch(userData.discordId);
                
                await discordUser.send({
                    content: `✨ **ValiantShop Update:**\nO status do seu pedido de **${order.pokemon}** foi atualizado para: **${order.status}**! ✨`
                });
                console.log(`📧 DM enviada para ${userData.discordId}`);
            } else {
                console.log(`⚠️ Usuário ${order.uid} não possui Discord vinculado.`);
            }
        } catch (err) {
            console.error('❌ Erro ao enviar DM:', err);
        }
      }
    });
  }, (error) => {
    console.error('❌ Erro no listener do Firestore:', error);
    // Tenta reiniciar o listener após 5 segundos em caso de erro
    setTimeout(startListening, 5000);
  });
}

client.login(DISCORD_TOKEN);
