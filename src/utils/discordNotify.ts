import axios from 'axios';
import { POKEMON_DATA } from '../data/pokemonData';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const USER_ID      = '650763941462671394';
const WORKER_URL   = 'https://valiantshop-discord-bot.reskallaarthur.workers.dev';
const SITE_KEY     = 'V@liant-ProxY-2025-Secure-Key-99';

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: number; label: string }> = {
  'Pendente':   { color: 0xF97416, label: '🟠 Pendente' },
  'Breeding':   { color: 0x9B59B6, label: '🟣 Breeding' },
  'Finalizado': { color: 0x22C55E, label: '🟢 Finalizado' },
  'Entregue':   { color: 0x427BD0, label: '🔵 Entregue' },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const workerRequest = async (data: any, retries = 3): Promise<any> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(WORKER_URL, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Valiant-Key': SITE_KEY
        }
      });
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 && attempt < retries - 1) {
        const retryAfter = (err?.response?.data?.retry_after ?? 1) * 1000;
        await sleep(retryAfter);
      } else {
        console.error(`[Discord Worker] Erro ${status ?? 'rede'}:`, err?.response?.data ?? err?.message);
        throw err;
      }
    }
  }
};

const formatIVs = (ivs: string, ignoredIvs: string[]): string => {
  const ivRaw = ivs || '';
  const ivNum = ivRaw.includes('4') ? 'F4' : ivRaw.includes('5') ? 'F5' : ivRaw.includes('6') ? 'F6' : ivRaw;
  if (!ignoredIvs || ignoredIvs.length === 0) return ivNum;
  return `${ivNum} ${ignoredIvs.map((iv: string) => `-${iv.toLowerCase()}`).join(' ')}`;
};

// ─────────────────────────────────────────────────────────────
// EMBED BUILDER
// ─────────────────────────────────────────────────────────────
const buildEmbed = (order: any, status: string = 'Pendente') => {
  const pokemonInfo = POKEMON_DATA.find(p => p.name.toLowerCase() === (order.pokemon || '').toLowerCase());
  const pokeId = pokemonInfo?.id || 0;
  const ivFormatted = formatIVs(order.ivs || '', order.ignoredIvs || []);
  const isHA = order.hasHA || (pokemonInfo?.hiddenAbility === order.ability && order.ability);
  const abilityDisplay = isHA ? `${order.ability} (HA)` : (order.ability || 'N/A');
  const priceFormatted = `${(order.totalPrice || 0) / 1000}k`;
  const cinematicBanner = 'https://wallpapers-clan.com/wp-content/uploads/2024/08/ash-pikachu-adventure-pokemon-desktop-wallpaper-cover.jpg';
  const thumbUrl = pokeId > 0 ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : '';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pendente'];

  const fields = [
    { name: '👤 Treinador',   value: `\`${order.playerNick || 'Desconhecido'}\``, inline: true },
    { name: '👾 Pokémon',     value: `\`${order.pokemon || 'N/A'}\``,             inline: true },
    { name: '📊 IVs',         value: `\`${ivFormatted}\``,                         inline: true },
    { name: '🧪 Ability',     value: `\`${abilityDisplay}\``,                      inline: true },
    { name: '🧬 Gênero',      value: `\`${order.gender || 'N/A'}\``,               inline: true },
    { name: '💬 Discord',     value: `\`${order.discordNick || 'Não informado'}\``, inline: true },
    { name: '📝 Observações', value: `\`${order.observations || 'Nenhum'}\``,       inline: true },
    { name: '🥚 Egg Group',   value: `\`${order.eggGroup || 'N/A'}\``,              inline: true },
    { name: '💰 Valor Total', value: `**${priceFormatted}**`,                       inline: true },
  ];

  if (order.isCompetitive && order.build) {
    const b = order.build;
    const evStr = Object.entries(b.evs || {})
      .filter(([_, v]) => (v as number) > 0)
      .map(([s, v]) => `${s}: ${v}`)
      .join(' | ');

    fields.push(
      { name: '⚔️ Build Competitiva', value: '\u200b', inline: false },
      { name: '📈 EVs', value: `\`${evStr || 'Nenhum'}\``, inline: true },
      { name: '🎖️ Level', value: `\`${b.level || '?'}\``, inline: true },
      { name: '🎒 Item', value: `\`${b.item || 'Nenhum'}\``, inline: true },
      { name: '⚡ PP Max', value: `\`${b.ppMax ? 'Sim' : 'Não'}\``, inline: true },
      { name: '🌀 Moveset', value: `\`${(b.moves || []).filter(Boolean).join(' / ') || 'N/A'}\``, inline: false }
    );
  }

  const embed: any = {
    title: order.isCompetitive ? '⚔️ NOVA ENCOMENDA COMPETITIVA ⚔️' : '✨ ENCOMENDA VALIANTSHOP ✨',
    color: order.isCompetitive ? 0xA855F7 : statusCfg.color,
    description: order.isCompetitive 
      ? `👋 <@${USER_ID}>, um novo pedido competitivo foi registrado.\n\n**Status:** ${statusCfg.label}`
      : `👋 <@${USER_ID}>, um novo pedido foi registrado no sistema.\n\n**Status:** ${statusCfg.label}`,
    thumbnail: thumbUrl ? { url: thumbUrl } : undefined,
    image: { url: cinematicBanner },
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: order.isCompetitive ? '🏢 ValiantShop | Logística Competitiva' : '🏢 ValiantShop | Logística de Encomendas',
      icon_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    },
  };

  return embed;
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

import { GENDERLESS_POKEMON, MALE_ONLY_POKEMON } from '../data/pokemonCategories';
import { getEggGroups } from '../data/eggGroups';

const enrichOrder = (order: any) => {
  const eggGroup = GENDERLESS_POKEMON.includes(order.pokemon) || MALE_ONLY_POKEMON.includes(order.pokemon) 
    ? 'Ditto' 
    : getEggGroups(order.pokemon).join(', ');
  return { ...order, eggGroup };
};

export const notifyNewOrder = async (order: any, orderId?: string): Promise<string | null> => {
  if (!orderId) {
    console.warn('[Discord] notifyNewOrder: Sem orderId, impossível gerar botões.');
    return null;
  }
  
  try {
    const enrichedOrder = enrichOrder(order);
    const embed = buildEmbed(enrichedOrder, 'Pendente');
    const result = await workerRequest({
      action: 'send',
      orderId,
      order: enrichedOrder,
      channelId: enrichedOrder.isCompetitive ? '1501747572463894538' : '1496973570168066148',
      content: enrichedOrder.isCompetitive ? `⚔️ **Novo Pedido Competitivo** | <@${USER_ID}>` : `🔔 **Aviso de Venda** | <@${USER_ID}>`,
      embeds: [embed]
    });
    
    console.log('[Discord Worker] ✅ Mensagem enviada via Worker:', result?.id);
    return result?.id || null;
  } catch (error) {
    console.error('[Discord Worker] Erro ao enviar pedido:', error);
    return null;
  }
};

export const updateOrderEmbed = async (
  messageId: string,
  order: any,
  newStatus: string
): Promise<void> => {
  if (!messageId) return;

  try {
    const orderId = order.id || order.orderId || '';
    await workerRequest({
      action: 'update',
      messageId,
      orderId,
      status: newStatus,
      order: enrichOrder(order)
    });
    console.log(`[Discord Worker] ✅ Status atualizado para "${newStatus}"`);
  } catch (error) {
    console.error('[Discord Worker] Falha ao atualizar embed:', error);
  }
};

export const deleteOrderEmbed = async (messageId: string): Promise<void> => {
  if (!messageId) return;
  try {
    await workerRequest({ action: 'delete', messageId });
    console.log('[Discord Worker] ✅ Embed deletada');
  } catch (error) {
    console.error('[Discord Worker] Erro ao deletar embed:', error);
  }
};

export const notifyDeleteOrder = async (order: any) => {
  try {
    await workerRequest({ action: 'cancel', order: enrichOrder(order) });
  } catch (error) {
    console.error('[Discord] Falha ao notificar cancelamento:', error);
  }
};
