import axios from 'axios';
import { POKEMON_DATA } from '../data/pokemonData';
import { EGG_GROUPS_MAP } from '../data/eggGroups';

// User ID to be mentioned in notifications
const USER_ID = "650763941462671394";

const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_ORDERS || "";

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG — cor e emoji por status
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: number; label: string }> = {
  'Pendente':   { color: 0xF97316, label: '🟠 Pendente' },
  'Breeding':   { color: 0x9B59B6, label: '🟣 Breeding' },   // roxo — diferente de "Entregue"
  'Finalizado': { color: 0x22C55E, label: '🟢 Finalizado' },
  'Entregue':   { color: 0x06B6D4, label: '🔵 Entregue' },   // ciano — bem diferente de roxo
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Formata IVs no padrão: "F5 -atk -spa"
 */
const formatIVs = (ivs: string, ignoredIvs: string[]): string => {
  const ivRaw = ivs || '';
  const ivNum = ivRaw.includes('4') ? 'F4' : ivRaw.includes('5') ? 'F5' : ivRaw.includes('6') ? 'F6' : ivRaw;

  if (!ignoredIvs || ignoredIvs.length === 0) return ivNum;

  const ignoredStr = ignoredIvs
    .map((iv: string) => `-${iv.toLowerCase()}`)
    .join(' ');
  return `${ivNum} ${ignoredStr}`;
};

/**
 * Constrói o objeto embed para uma encomenda
 */
const buildEmbed = (order: any, status: string = 'Pendente') => {
  const pokemonInfo = POKEMON_DATA.find(p => p.name.toLowerCase() === (order.pokemon || '').toLowerCase());
  const pokeId = pokemonInfo?.id || 0;

  const ivFormatted = formatIVs(order.ivs || '', order.ignoredIvs || []);

  const isHA = order.hasHA || (pokemonInfo?.hiddenAbility === order.ability && order.ability);
  const abilityDisplay = isHA ? `${order.ability} (HA)` : (order.ability || 'N/A');

  const eggGroupsData = EGG_GROUPS_MAP[normalizeName(order.pokemon || '')];
  const eggGroupDisplay = eggGroupsData ? eggGroupsData.join(', ') : 'N/A';

  const priceFormatted = `${(order.totalPrice || 0) / 1000}k`;

  const cinematicBanner = 'https://wallpapers-clan.com/wp-content/uploads/2024/08/ash-pikachu-adventure-pokemon-desktop-wallpaper-cover.jpg';
  const thumbUrl = pokeId > 0 ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : '';

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pendente'];

  return {
    title: '✨ ENCOMENDA VALIANTSHOP ✨',
    color: statusCfg.color,
    description: `👋 <@${USER_ID}>, um novo pedido foi registrado no sistema.\n\n**Status:** ${statusCfg.label}`,
    thumbnail: thumbUrl ? { url: thumbUrl } : undefined,
    image: { url: cinematicBanner },
    fields: [
      { name: '👤 Treinador',   value: `\`${order.playerNick || 'Desconhecido'}\``, inline: true },
      { name: '👾 Pokémon',     value: `\`${order.pokemon || 'N/A'}\``,             inline: true },
      { name: '📊 IVs',         value: `\`${ivFormatted}\``,                         inline: true },
      { name: '🧪 Ability',     value: `\`${abilityDisplay}\``,                      inline: true },
      { name: '🧬 Gênero',      value: `\`${order.gender || 'N/A'}\``,               inline: true },
      { name: '💬 Discord',     value: `\`${order.discordNick || 'Não informado'}\``, inline: true },
      { name: '📝 Observações', value: `\`${order.observations || 'Nenhum'}\``,       inline: true },
      { name: '🥚 Egg Group',   value: `\`${eggGroupDisplay}\``,                      inline: true },
      { name: '💰 Valor Total', value: `**${priceFormatted}**`,                       inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: '🏢 ValiantShop | Logística de Encomendas',
      icon_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    },
  };
};

// ─────────────────────────────────────────────────────────────
// CRIAR notificação — retorna o messageId do Discord
// ─────────────────────────────────────────────────────────────
/**
 * Envia a embed de nova encomenda e retorna o messageId para armazenar no Firestore.
 */
export const notifyNewOrder = async (order: any): Promise<string | null> => {
  if (!WEBHOOK_URL) {
    console.warn('ERRO: VITE_DISCORD_WEBHOOK_ORDERS não encontrada no .env');
    return null;
  }

  try {
    // ?wait=true faz o Discord retornar o objeto da mensagem com o id
    const response = await axios.post(`${WEBHOOK_URL}?wait=true`, {
      content: `🔔 **Aviso de Venda** | <@${USER_ID}>`,
      embeds: [buildEmbed(order, 'Pendente')],
    });

    const messageId: string | null = response.data?.id ?? null;
    console.log('[Discord] Mensagem criada, messageId:', messageId);
    return messageId;
  } catch (error) {
    console.error('[Discord] Erro ao enviar notificação:', error);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// ATUALIZAR embed quando o status mudar
// ─────────────────────────────────────────────────────────────
/**
 * Edita a embed existente no Discord com a nova cor e status.
 * @param messageId  ID da mensagem do Discord (guardado no Firestore)
 * @param order      Dados completos da encomenda
 * @param newStatus  Novo status ('Pendente' | 'Breeding' | 'Finalizado' | 'Entregue')
 */
export const updateOrderEmbed = async (
  messageId: string,
  order: any,
  newStatus: string
): Promise<void> => {
  if (!WEBHOOK_URL || !messageId) return;

  try {
    await axios.patch(`${WEBHOOK_URL}/messages/${messageId}`, {
      content: `🔔 **Status Atualizado** | <@${USER_ID}>`,
      embeds: [buildEmbed(order, newStatus)],
    });
    console.log(`[Discord] Embed atualizada para status: ${newStatus}`);
  } catch (error) {
    console.error('[Discord] Erro ao atualizar embed:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETAR embed quando a encomenda for cancelada
// ─────────────────────────────────────────────────────────────
/**
 * Apaga a mensagem do Discord correspondente à encomenda cancelada.
 * @param messageId  ID da mensagem do Discord
 */
export const deleteOrderEmbed = async (messageId: string): Promise<void> => {
  if (!WEBHOOK_URL || !messageId) return;

  try {
    await axios.delete(`${WEBHOOK_URL}/messages/${messageId}`);
    console.log('[Discord] Embed deletada, messageId:', messageId);
  } catch (error) {
    console.error('[Discord] Erro ao deletar embed:', error);
  }
};
