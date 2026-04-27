/**
 * ValiantShop — Discord Interaction Worker
 * Handles button clicks, select menus, modals, and bidirectional sync.
 */
import { POKEMON_DB } from './pokemonDb.js';

const STATUS_CONFIG = {
  Pendente:   { color: 0xF97416, emoji: '🟠', label: 'Pendente' },
  Breeding:   { color: 0x7B2FBE, emoji: '🟣', label: 'Breeding' },
  Finalizado: { color: 0x00C851, emoji: '🟢', label: 'Finalizado' },
  Entregue:   { color: 0x427BD0, emoji: '🔵', label: 'Entregue' },
};

const DEFAULT_EMBEDS = {
  notificacao: {
    title: '✨ ENCOMENDA VALIANTSHOP ✨',
    description: '<@USER>, um novo pedido foi registrado no sistema.',
    color: '0xF97416',
    banner: 'https://i.pinimg.com/originals/9a/9a/5e/9a9a5e8e7e1e7e7e7e7e7e7e7e7e7e7e.jpg',
    footer: 'ValiantShop | Logística de Encomendas',
    author: 'Aviso de Venda',
    thumbnail: '{sprite}',
    content: '⚠️ Novo pedido registrado!',
    channel: '1496973570168066148',
    fields: [
      { name: '👤 Treinador', value: '{treinador}', inline: true }, { name: '👾 Pokémon', value: '{pokemon}', inline: true }, { name: '📊 IVs', value: '{ivs}', inline: true },
      { name: '🧪 Ability', value: '{ability}', inline: true }, { name: '🧬 Gênero', value: '{genero}', inline: true }, { name: '💬 Discord', value: '{discord}', inline: true },
      { name: '📝 Observações', value: '{obs}', inline: true }, { name: '🥚 Egg Group', value: '{egg}', inline: true }, { name: '💰 Valor Total', value: '{total}', inline: true }
    ]
  },
  cancelamento: {
    title: '🚨 ENCOMENDA CANCELADA 🚨',
    description: 'Uma encomenda foi removida do sistema.',
    color: '0xEF4444',
    banner: 'https://e1.pxfuel.com/desktop-wallpaper/685/471/desktop-wallpaper-crying-pikachu-sad-pokemon.jpg',
    footer: 'ValiantShop — Central de Logística',
    author: 'Logística Valiant',
    thumbnail: '{sprite}',
    content: '⚠️ Uma encomenda foi cancelada!',
    channel: '1498096158088892466',
    fields: [
      { name: '👤 Treinador', value: '{treinador}', inline: true }, { name: '👾 Pokémon', value: '{pokemon}', inline: true }, { name: '📊 IVs', value: '{ivs}', inline: true },
      { name: '🧬 Gênero', value: '{genero}', inline: true }, { name: '🧪 Ability', value: '{ability}', inline: false }
    ]
  }
};

const ARCHIVE_CHANNEL_ID = '1498075679269458073';
const VERIFY_CONFIRM = "SIM";

// ─── Helpers ────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Valiant-Key' },
  });
}

async function verifyDiscordRequest(publicKeyHex, signature, timestamp, body) {
  try {
    const bytes = (hex) => {
      const b = new Uint8Array(hex.length / 2);
      for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      return b;
    };
    const key = await crypto.subtle.importKey('raw', bytes(publicKeyHex), { name: 'Ed25519', namedCurve: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, bytes(signature), new TextEncoder().encode(timestamp + body));
  } catch { return false; }
}

async function getFirebaseToken(env) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.FIREBASE_BOT_EMAIL, password: env.FIREBASE_BOT_PASSWORD, returnSecureToken: true }),
  });
  const data = await res.json();
  return data.idToken || null;
}

async function updateFirestore(env, collection, docId, fields, idToken) {
  const fieldName = Object.keys(fields)[0];
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?updateMask.fieldPaths=${fieldName}`;
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields }) });
  return res.ok;
}

async function getFirestoreDoc(env, collection, docId, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  return res.ok ? res.json() : null;
}

async function getDiscordMessage(env, channelId, messageId) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
  return res.ok ? res.json() : null;
}

function getPokeInfo(name) {
  if (!name) return null;
  const entry = Object.entries(POKEMON_DB).find(([k]) => k.toLowerCase() === name.toLowerCase());
  return entry ? { name: entry[0], ...entry[1] } : null;
}

function replacePlaceholders(text, order) {
  if (!text) return text;
  const info = getPokeInfo(order.pokemon);
  const map = {
    '{treinador}': order.playerNick || 'N/A',
    '{pokemon}': order.pokemon || 'N/A',
    '{ivs}': (order.ivs ? `F${order.ivs.toString().match(/\d+/)?.[0] || order.ivs.toString().replace('F', '')}` : 'N/A'),
    '{genero}': order.gender || 'N/A',
    '{ability}': order.ability ? (order.hasHA ? `${order.ability} (HA)` : order.ability) : 'N/A',
    '{b/c}': order.isCastrated ? '(CASTRADO)' : '(BREEDABLE)',
    '{total}': (order.totalPrice ? Math.floor(Number(order.totalPrice) / (Number(order.totalPrice) >= 1000 ? 1000 : 1)) + (Number(order.totalPrice) >= 1000 ? 'k' : '') : 'N/A'),
    '{obs}': order.observations || 'Nenhuma',
    '{discord}': order.discordNick || 'N/A',
    '{egg}': order.eggGroup || info?.e?.join(', ') || 'N/A',
    '{status}': (STATUS_CONFIG[order.status || 'Pendente']?.emoji || '') + ' ' + (STATUS_CONFIG[order.status || 'Pendente']?.label || 'Pendente'),
    '{sprite}': info ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${info.id}.png` : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
  };
  let result = text;
  for (const [k, v] of Object.entries(map)) result = result.replace(new RegExp(k, 'g'), v);
  return result;
}

function buildEmbedFromConfig(cfg, order) {
  const info = getPokeInfo(order.pokemon);
  const embed = {
    color: parseInt(cfg.color, 16) || 0xF97416,
  };
  
  const title = replacePlaceholders(cfg.title, order);
  if (title && title.trim() !== '') embed.title = title.substring(0, 256);
  
  const desc = replacePlaceholders(cfg.description, order);
  if (desc && desc.trim() !== '') embed.description = desc.substring(0, 4096);
  
  if (cfg.fields && cfg.fields.length > 0) {
    embed.fields = cfg.fields.map(f => ({ 
      name: (replacePlaceholders(f.name, order) || '\u200B').substring(0, 256), 
      value: (replacePlaceholders(f.value, order) || '\u200B').substring(0, 1024), 
      inline: f.inline 
    }));
  }

  if (cfg.banner && cfg.banner.trim() !== '') embed.image = { url: replacePlaceholders(cfg.banner, order) };
  if (cfg.footer && cfg.footer.trim() !== '') embed.footer = { text: replacePlaceholders(cfg.footer, order).substring(0, 2048) };
  if (cfg.author && cfg.author.trim() !== '') embed.author = { name: replacePlaceholders(cfg.author, order).substring(0, 256) };
  
  if ((cfg.thumbnail === '{sprite}' || cfg.thumbnail === 'pokemon') && info) {
    embed.thumbnail = { url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${info.id}.png` };
  } else if (cfg.thumbnail && cfg.thumbnail.trim() !== '') {
    embed.thumbnail = { url: replacePlaceholders(cfg.thumbnail, order) };
  }

  return embed;
}

// ─── Embed Config ───────────────────────────────────────────────────────────
async function getEmbedConfig(env, type, idToken) {
  const config = await getFirestoreDoc(env, 'bot_config', 'embeds', idToken);
  if (!config || !config.fields[type]) return DEFAULT_EMBEDS[type];
  const f = config.fields[type].mapValue.fields;
  return {
    title: f.title?.stringValue || DEFAULT_EMBEDS[type].title,
    description: f.description?.stringValue || DEFAULT_EMBEDS[type].description,
    color: f.color?.stringValue || DEFAULT_EMBEDS[type].color,
    banner: f.banner?.stringValue || '',
    footer: f.footer?.stringValue || '',
    author: f.author?.stringValue || '',
    thumbnail: f.thumbnail?.stringValue || '{sprite}',
    content: f.content?.stringValue || '',
    channel: f.channel?.stringValue || DEFAULT_EMBEDS[type].channel,
    fields: f.fields?.arrayValue?.values?.map(v => ({
      name: v.mapValue.fields.name.stringValue,
      value: v.mapValue.fields.value.stringValue,
      inline: v.mapValue.fields.inline.booleanValue
    })) || DEFAULT_EMBEDS[type].fields
  };
}

function buildEmbedEditorButtons(type) {
  return [
    { type: 1, components: [
      { type: 2, label: '✏️ Título', style: 2, custom_id: `editembed_title_${type}` },
      { type: 2, label: '✏️ Descrição', style: 2, custom_id: `editembed_description_${type}` },
      { type: 2, label: '🎨 Cor', style: 2, custom_id: `editembed_color_${type}` },
      { type: 2, label: '👤 Autor', style: 2, custom_id: `editembed_author_${type}` }
    ]},
    { type: 1, components: [
      { type: 2, label: '🖼️ Thumbnail', style: 2, custom_id: `editembed_thumbnail_${type}` },
      { type: 2, label: '🌆 Banner', style: 2, custom_id: `editembed_banner_${type}` },
      { type: 2, label: '👣 Rodapé', style: 2, custom_id: `editembed_footer_${type}` },
      { type: 2, label: '📝 Campos', style: 2, custom_id: `menu_fields_${type}` }
    ]},
    { type: 1, components: [
      { type: 2, label: '💬 Mensagem', style: 2, custom_id: `editembed_content_${type}` },
      { type: 2, label: '📺 Canal', style: 2, custom_id: `editembed_channel_${type}` },
      { type: 2, label: '📖 Ferramentas', style: 2, custom_id: `help_tools_info` }
    ]},
    { type: 1, components: [
      { type: 2, label: '✅ SALVAR', style: 3, custom_id: `verify_saveconfig_${type}` },
      { type: 2, label: '❌ Cancelar', style: 4, custom_id: `action_cancelconfig_${type}` }
    ]}
  ];
}

function buildFieldButtons(type, fields) {
  const rows = [];
  const fieldBtns = fields.map((f, i) => ({ type: 2, label: `Campo ${i + 1}`, style: 2, custom_id: `editfield_modal_${i}_${type}` }));
  for (let i = 0; i < fieldBtns.length; i += 5) rows.push({ type: 1, components: fieldBtns.slice(i, i + 5) });
  const actionRow = { type: 1, components: [] };
  if (fields.length < 10) actionRow.components.push({ type: 2, label: '➕ Adicionar', style: 3, custom_id: `editfield_add_${type}` });
  if (fields.length > 0) actionRow.components.push({ type: 2, label: '🗑️ Remover', style: 4, custom_id: `menu_fields_delete_${type}` });
  actionRow.components.push({ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_config_${type}` });
  rows.push(actionRow);
  return rows;
}

function buildFieldDeleteMenu(type, fields) {
  return [{ type: 1, components: [{ type: 3, custom_id: `editfield_delete_select_${type}`, placeholder: 'Selecione para remover', options: fields.map((f, i) => ({ label: `Campo ${i + 1}: ${f.name.slice(0, 50)}`, value: i.toString() })) }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_fields_${type}` }] }];
}

function buildMainMenuButtons(orderId) {
  return [{ type: 1, components: [{ type: 2, label: '⚙️ Status', style: 1, custom_id: `menu_status_${orderId}` }, { type: 2, label: '❌ Cancelar', style: 4, custom_id: `confirm_cancel_${orderId}` }] }];
}

function buildStatusSelectionButtons(orderId, currentStatus) {
  const buttons = Object.entries(STATUS_CONFIG).map(([status, s]) => ({ type: 2, label: `${s.emoji} ${s.label}`, style: status === currentStatus ? 2 : 1, custom_id: `setstatus_${status}_${orderId}`, disabled: status === currentStatus }));
  buttons.push({ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_${orderId}` });
  return [{ type: 1, components: buttons.slice(0, 5) }];
}

function buildConfirmCancelButtons(orderId) {
  return [{ type: 1, components: [{ type: 2, label: '🔥 CONFIRMAR EXCLUSÃO', style: 4, custom_id: `verify_delete_${orderId}` }, { type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_${orderId}` }] }];
}

// ─── Main handler ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return jsonResponse({}, 200);
    
    if (request.method === 'GET') {
      const commands = [{ name: "editar_embed", description: "Painel de configuração de embeds", options: [{ name: "tipo", description: "Tipo de embed", type: 3, required: true, choices: [{ name: "Notificação", value: "notificacao" }, { name: "Cancelamento", value: "cancelamento" }] }] }];
      await fetch(`https://discord.com/api/v10/applications/1498061638941806833/commands`, { method: 'PUT', headers: { 'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
      return new Response('Commands updated');
    }

    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp  = request.headers.get('X-Signature-Timestamp');
    const siteKey    = request.headers.get('X-Valiant-Key');
    const body = await request.text();

    if (!signature && siteKey === env.VALIANT_SECRET) {
      const data = JSON.parse(body);
      const order = data.order || {};
      const idToken = await getFirebaseToken(env);
      async function syncOrderStatus(env, orderId, newStatus, currentChannelId, currentMessageId, idToken, orderObj = null) {
        const doc = orderObj ? null : await getFirestoreDoc(env, 'orders', orderId, idToken);
        if (!doc && !orderObj) return false;
        
        const fullOrder = orderObj || Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
        fullOrder.status = newStatus;
        
        const cfg = await getEmbedConfig(env, 'notificacao', idToken);
        const embed = buildEmbedFromConfig(cfg, fullOrder);
        embed.color = STATUS_CONFIG[newStatus]?.color || embed.color;
        
        await updateFirestore(env, 'orders', orderId, { status: { stringValue: newStatus } }, idToken);
        
        let newChannelId = currentChannelId;
        let newMessageId = currentMessageId;
        
        if (newStatus === 'Entregue' && currentChannelId !== ARCHIVE_CHANNEL_ID) {
          const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuButtons(orderId) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else if (newStatus !== 'Entregue' && currentChannelId === ARCHIVE_CHANNEL_ID) {
          const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder), embeds: [embed], components: buildMainMenuButtons(orderId) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else {
          await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder), embeds: [embed], components: buildMainMenuButtons(orderId) }) });
        }
        
        if (newMessageId !== currentMessageId) {
          await updateFirestore(env, 'orders', orderId, { discordMessageId: { stringValue: newMessageId } }, idToken);
        }
        return true;
      }

      if (data.action === 'send') {
        const cfg = await getEmbedConfig(env, 'notificacao', idToken);
        const embed = buildEmbedFromConfig(cfg, order);
        const res = await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(data.orderId) }) });
        if (res.ok) {
           const msg = await res.json();
           return jsonResponse({ success: true, id: msg.id });
        }
        return jsonResponse({ success: false });
      }
      if (data.action === 'update') {
        const cfg = await getEmbedConfig(env, 'notificacao', idToken);
        let channelId = cfg.channel;
        let msgObj = await getDiscordMessage(env, channelId, data.messageId);
        if (!msgObj) { channelId = ARCHIVE_CHANNEL_ID; msgObj = await getDiscordMessage(env, channelId, data.messageId); }
        if (msgObj) {
           await syncOrderStatus(env, data.orderId, data.status, channelId, data.messageId, idToken, order);
        }
        return jsonResponse({ success: true });
      }
      if (data.action === 'delete' || data.action === 'cancel') {
        const cfg = await getEmbedConfig(env, 'cancelamento', idToken);
        if (data.order && Object.keys(data.order).length > 0) {
           const embed = buildEmbedFromConfig(cfg, data.order);
           await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, data.order) || `⚠️ <@650763941462671394> Encomenda cancelada!`, embeds: [embed] }) });
        }
        if (data.messageId) {
           const notifCfg = await getEmbedConfig(env, 'notificacao', idToken);
           await fetch(`https://discord.com/api/v10/channels/${notifCfg.channel}/messages/${data.messageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
           await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages/${data.messageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
        }
        return jsonResponse({ success: true });
      }
    }

    if (signature && timestamp) {
      const valid = await verifyDiscordRequest(env.DISCORD_PUBLIC_KEY, signature, timestamp, body);
      if (!valid) return new Response('Invalid signature', { status: 401 });
      const interaction = JSON.parse(body);
      if (interaction.type === 1) return jsonResponse({ type: 1 });

      const mockOrder = { pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User' };

      if (interaction.type === 2 && interaction.data.name === 'editar_embed') {
         const type = interaction.data.options[0].value;
         ctx.waitUntil((async () => {
           const idToken = await getFirebaseToken(env);
           const cfg = await getEmbedConfig(env, type, idToken);
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: cfg.content, embeds: [preview], components: buildEmbedEditorButtons(type) }) });
         })());
         return jsonResponse({ type: 5 });
      }

      if (interaction.type === 3) {
        const parts = interaction.data.custom_id.split('_');
        if (parts[0] === 'help' && parts[1] === 'tools') {
           return jsonResponse({ type: 4, data: { flags: 64, content: `**📖 Variáveis:**\n\`{treinador}\`, \`{pokemon}\`, \`{ivs}\`, \`{genero}\`, \`{ability}\`, \`{b/c}\`, \`{total}\`, \`{discord}\`, \`{obs}\`, \`{egg}\`, \`{status}\`\n**Thumbnail:** Use \`{sprite}\` para carregar a foto do Pokémon.` } });
        }
        const type = parts[parts.length - 1];
        const orderId = parts.slice(2).join('_');

        if (parts[0] === 'verify') {
           const cid = parts[1] === 'delete' ? `delete_order_submit_${orderId}` : (parts[1] === 'saveconfig' ? `editembed_save_submit_${type}` : `action_cancel_submit_${type}`);
           return jsonResponse({ type: 9, data: { title: 'Confirmação', custom_id: cid, components: [{ type: 1, components: [{ type: 4, custom_id: 'confirm', label: `Digite '${VERIFY_CONFIRM}' para confirmar`, placeholder: VERIFY_CONFIRM, style: 1, min_length: 3, max_length: 3 }] }] } });
        }

        if (parts[0] === 'action' && parts[1] === 'cancelconfig') {
           return jsonResponse({ type: 7, data: { content: '❌ Edição cancelada.', embeds: [], components: [] } });
        }

        if (parts[0] === 'editembed') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const labels = { title: 'Título', description: 'Descrição', color: 'Cor', author: 'Autor', thumbnail: 'Thumbnail', banner: 'Banner', footer: 'Rodapé', content: 'Mensagem', channel: 'ID do Canal' };
           let val = '';
           if (parts[1] === 'color') val = cfg.color; else if (parts[1] === 'banner') val = cfg.banner;
           else if (parts[1] === 'footer') val = cfg.footer; else if (parts[1] === 'author') val = cfg.author;
           else if (parts[1] === 'thumbnail') val = cfg.thumbnail; else if (parts[1] === 'content') val = cfg.content;
           else if (parts[1] === 'channel') val = cfg.channel; else val = cfg[parts[1]];
           return jsonResponse({ type: 9, data: { title: `Editar ${labels[parts[1]]}`, custom_id: `modaleditor_${parts[1]}_${type}`, components: [{ type: 1, components: [{ type: 4, custom_id: 'val', label: labels[parts[1]], value: val || '', style: parts[1] === 'description' || parts[1] === 'content' ? 2 : 1, required: ['title', 'description', 'color', 'channel'].includes(parts[1]) }] }] } });
        }

        if (parts[0] === 'menu' && parts[1] === 'fields') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { components: buildFieldDeleteMenu(type, cfg.fields) } });
           return jsonResponse({ type: 7, data: { components: buildFieldButtons(type, cfg.fields) } });
        }
        
        if (parts[0] === 'editfield') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (parts[1] === 'modal') {
              const f = cfg.fields[parseInt(parts[2])];
              return jsonResponse({ type: 9, data: { title: `Editar Campo ${parseInt(parts[2]) + 1}`, custom_id: `modaleditor_field_${parts[2]}_${type}`, components: [{ type: 1, components: [{ type: 4, custom_id: 'name', label: 'Nome', value: f.name, style: 1 }] }, { type: 1, components: [{ type: 4, custom_id: 'val', label: 'Valor', value: f.value, style: 2 }] }, { type: 1, components: [{ type: 4, custom_id: 'inline', label: 'Inline (S/N)', value: f.inline ? 'S' : 'N', style: 1, min_length: 1, max_length: 1 }] }] } });
           }
           if (parts[1] === 'add') { cfg.fields.push({ name: 'Novo Campo', value: 'Valor', inline: true }); await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) }); const preview = buildEmbedFromConfig(cfg, mockOrder); return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldButtons(type, cfg.fields) } }); }
           if (parts[1] === 'delete' && parts[2] === 'select') { cfg.fields.splice(parseInt(interaction.data.values[0]), 1); await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) }); const preview = buildEmbedFromConfig(cfg, mockOrder); return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldButtons(type, cfg.fields) } }); }
        }
        if (parts[0] === 'menu' && parts[1] === 'back' && parts[2] === 'config') return jsonResponse({ type: 7, data: { components: buildEmbedEditorButtons(type) } });
        if (parts[0] === 'menu' && parts[1] === 'status') { 
           const idToken = await getFirebaseToken(env);
           const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
           const status = doc?.fields?.status?.stringValue || 'Pendente';
           return jsonResponse({ type: 7, data: { components: buildStatusSelectionButtons(orderId, status) } }); 
        }
        if (parts[0] === 'menu' && parts[1] === 'back') return jsonResponse({ type: 7, data: { content: '', components: buildMainMenuButtons(orderId) } });
        if (parts[0] === 'confirm' && parts[1] === 'cancel') return jsonResponse({ type: 7, data: { content: '⚠️ **TEM CERTEZA?**', components: buildConfirmCancelButtons(orderId) } });
        if (parts[0] === 'setstatus') {
           ctx.waitUntil((async () => {
             const idToken = await getFirebaseToken(env);
             const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
             if (doc) {
               const order = Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
               order.status = parts[1]; // Ensure status is updated locally
               const cfg = await getEmbedConfig(env, 'notificacao', idToken);
               const embed = buildEmbedFromConfig(cfg, order);
               embed.color = STATUS_CONFIG[parts[1]]?.color || embed.color;
               await updateFirestore(env, 'orders', orderId, { status: { stringValue: parts[1] } }, idToken);
               
               let newMessageId = interaction.message.id;
               if (parts[1] === 'Entregue' && interaction.channel_id !== ARCHIVE_CHANNEL_ID) {
                 const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuButtons(orderId) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else if (parts[1] !== 'Entregue' && interaction.channel_id === ARCHIVE_CHANNEL_ID) {
                 const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
                 const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(orderId) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else {
                 await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(orderId) }) });
               }
               
               if (newMessageId !== interaction.message.id) {
                 await updateFirestore(env, 'orders', orderId, { discordMessageId: { stringValue: newMessageId } }, idToken);
               }
             }
           })());
           return jsonResponse({ type: 6 });
        }
      }

      if (interaction.type === 5) {
        const idToken = await getFirebaseToken(env);
        const getVal = (cid) => interaction.data.components.find(c => c.components[0].custom_id === cid).components[0].value;
        const cid = interaction.data.custom_id;
        const mockOrder = { pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User' };

        if (cid.includes('_submit')) {
           const parts = cid.split('_'); const type = parts.pop();
           if (getVal('confirm') !== VERIFY_CONFIRM) return jsonResponse({ type: 4, data: { flags: 64, content: `❌ Confirmação incorreta!` } });
           if (parts[0] === 'editembed') {
              const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
              const cfg = JSON.parse(draftDoc.fields.config.stringValue);
              const fields = { [type]: { mapValue: { fields: {
                title: { stringValue: cfg.title || '' }, description: { stringValue: cfg.description || '' }, color: { stringValue: cfg.color },
                banner: { stringValue: cfg.banner || '' }, footer: { stringValue: cfg.footer || '' }, author: { stringValue: cfg.author || '' },
                thumbnail: { stringValue: cfg.thumbnail || '{sprite}' },
                content: { stringValue: cfg.content || '' }, channel: { stringValue: cfg.channel || DEFAULT_EMBEDS[type].channel },
                fields: { arrayValue: { values: cfg.fields.map(f => ({ mapValue: { fields: { name: { stringValue: f.name }, value: { stringValue: f.value }, inline: { booleanValue: f.inline } }}})) }}
              }}}};
              await updateFirestore(env, 'bot_config', 'embeds', fields, idToken);
              return jsonResponse({ type: 7, data: { content: `✅ Configuração salva!`, embeds: [], components: [] } });
           }
           if (parts[0] === 'delete') {
              ctx.waitUntil((async () => {
                const orderId = cid.split('_')[3];
                const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
                if (doc) {
                  const order = Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
                  const cfg = await getEmbedConfig(env, 'cancelamento', idToken);
                  const embed = buildEmbedFromConfig(cfg, order);
                  await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed] }) });
                }
                await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
                await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
              })());
              return jsonResponse({ type: 6 });
           }
        }
        if (cid.startsWith('modaleditor_')) {
           const parts = cid.split('_'); const action = parts[1]; const type = parts.pop();
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const val = getVal('val');
           
           if (action === 'field') {
              const index = parseInt(parts[2]); cfg.fields[index] = { name: getVal('name'), value: getVal('val'), inline: getVal('inline').toUpperCase() === 'S' };
           } else if (action === 'channel') {
              cfg.channel = val;
           } else {
              if (action === 'color') cfg.color = '0x' + val.replace('#', '').toUpperCase();
              else cfg[action] = val;
           }
           
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           
           if (action === 'field') return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldButtons(type, cfg.fields) } });
           if (action === 'channel') return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Canal de envio atualizado para \`${val}\`!` } });
           return jsonResponse({ type: 7, data: { content: cfg.content, embeds: [preview] } });
        }
      }
    }
    return new Response('Unauthorized', { status: 401 });
  },
};
