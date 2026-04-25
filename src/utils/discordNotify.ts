import axios from 'axios';
import { POKEMON_DATA } from '../data/pokemonData';
import { EGG_GROUPS_MAP } from '../data/eggGroups';

// User ID to be mentioned in notifications
const USER_ID = "650763941462671394";

/**
 * Send a notification to Discord when a new order is created
 */
export const notifyNewOrder = async (order: any) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_ORDERS || "";
  
  if (!webhookUrl) {
    console.warn("ERRO: URL do Webhook do Discord não encontrada no .env (VITE_DISCORD_WEBHOOK_ORDERS)");
    return;
  }

  try {
    // Find pokemon data
    const pokemonInfo = POKEMON_DATA.find(p => p.name.toLowerCase() === (order.pokemon || "").toLowerCase());
    const pokeId = pokemonInfo?.id || 0;

    console.log("Preparando notificação para:", order.pokemon, "ID:", pokeId);

    // Format IVs to F-shorthand (F4, F5, F6)
    const ivRaw = order.ivs || "";
    const ivFormatted = ivRaw.includes('4') ? 'F4' : ivRaw.includes('5') ? 'F5' : ivRaw.includes('6') ? 'F6' : ivRaw;

    // Check if HA
    const isHA = order.hasHA || (pokemonInfo?.hiddenAbility === order.ability && order.ability);
    const abilityDisplay = isHA ? `${order.ability} (HA)` : (order.ability || "N/A");

    // Format Egg Group
    const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const eggGroupsData = EGG_GROUPS_MAP[normalizeName(order.pokemon || "")];
    const eggGroupDisplay = eggGroupsData ? eggGroupsData.join(", ") : "N/A";

    // Format price
    const priceFormatted = `${(order.totalPrice || 0) / 1000}k`;

    // Specified Premium Banner
    const cinematicBanner = "https://wallpapers-clan.com/wp-content/uploads/2024/08/ash-pikachu-adventure-pokemon-desktop-wallpaper-cover.jpg"; 

    const thumbUrl = pokeId > 0 ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : "";

    const embed = {
      title: "✨ NOVA ENCOMENDA RECEBIDA ✨",
      color: 0x29A6F7, // Brand blue specified by user
      description: `👋 <@${USER_ID}>, um novo pedido foi registrado no sistema.`,
      thumbnail: thumbUrl ? { url: thumbUrl } : undefined,
      image: { url: cinematicBanner },
      fields: [
        { name: "👤 Treinador", value: `\`${order.playerNick || "Desconhecido"}\``, inline: true },
        { name: "👾 Pokémon", value: `\`${order.pokemon || "N/A"}\``, inline: true },
        { name: "📊 IVs", value: `\`${ivFormatted}\``, inline: true },
        { name: "🧪 Ability", value: `\`${abilityDisplay}\``, inline: true },
        { name: "🧬 Gênero", value: `\`${order.gender || "N/A"}\``, inline: true },
        { name: "💬 Discord", value: `\`${order.discordNick || "Não informado"}\``, inline: true },
        { name: "📝 Observações", value: `\`${order.observations || "Nenhum"}\``, inline: true },
        { name: "🥚 Egg Group", value: `\`${eggGroupDisplay}\``, inline: true },
        { name: "💰 Valor Total", value: `**${priceFormatted}**`, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "🏢 ValiantShop | Logística de Encomendas",
        icon_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
      },
    };

    await axios.post(webhookUrl, {
      content: `🔔 **Aviso de Venda** | <@${USER_ID}>`,
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};
