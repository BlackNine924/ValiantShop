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
    ],
    components: []
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
    ],
    components: []
  },
  caixa: {
    title: '💰 BALANÇO FINANCEIRO',
    description: 'Relatório consolidado de lucros da ValiantShop.\n\n💰 **Lucro Total:** `{caixa}`',
    color: '0x2ECC71',
    footer: 'Atualizado em tempo real',
    author: 'Gestão Financeira',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
    fields: [],
    components: []
  },
  resumo: {
    title: '📊 PERFORMANCE DIÁRIA',
    description: 'Detalhamento das operações realizadas nas últimas 24 horas.',
    color: '0x3498DB',
    footer: 'ValiantShop Logistics',
    author: 'Painel de Operações',
    fields: [
      { name: '🟠 Pendentes', value: '`{pendente}`', inline: true },
      { name: '🟣 Breeding', value: '`{breeding}`', inline: true },
      { name: '🟢 Finalizados', value: '`{finalizado}`', inline: true },
      { name: '🔵 Entregues', value: '`{entregue}`', inline: true },
      { name: '💰 Total do Dia', value: '**{total_dia}**', inline: false }
    ],
    components: []
  },
  cliente: {
    title: '👤 PERFIL DO CLIENTE',
    description: 'Informações detalhadas e histórico de consumo.',
    color: '0x9B59B6',
    author: 'Customer Insights',
    fields: [
      { name: '📛 Nickname', value: '`{nick}`', inline: true },
      { name: '🆔 Discord ID', value: '`{id}`', inline: true },
      { name: '💸 Total Investido', value: '**{gasto}**', inline: false },
      { name: '📦 Últimos Pedidos', value: '{historico}', inline: false }
    ],
    components: []
  },
  tabela: {
    title: '📜 TABELA DE PREÇOS OFICIAL',
    description: 'Valores base e multiplicadores da ValiantShop.',
    color: '0xE67E22',
    author: 'Tabela de Serviços',
    banner: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    fields: [
      { name: '📊 IVs Base', value: '• **F4:** 40k\n• **F5:** 80k\n• **F6:** 100k', inline: true },
      { name: '⚠️ Multiplicadores', value: '• **Genderless:** x2\n• **Male-Only:** x2\n• **Indeedee M:** x2', inline: true },
      { name: '🧬 Adicionais', value: '• **HA:** +15k\n• **Castrado (F5/F6):** -10k', inline: false }
    ],
    components: []
  },
  config: {
    title: '⚙️ CONFIGURAÇÕES DO BOT',
    description: 'Ajuste as funções globais do ValiantBot.',
    color: '0x2F3136',
    author: 'Administração Valiant',
    fields: [],
    components: []
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

async function queryFirestore(env, query, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(query)
  });
  return res.ok ? res.json() : [];
}

function getPokeInfo(name) {
  if (!name) return null;
  const entry = Object.entries(POKEMON_DB).find(([k]) => k.toLowerCase() === name.toLowerCase());
  return entry ? { name: entry[0], ...entry[1] } : null;
}

function replacePlaceholders(text, data) {
  if (!text) return text;
  const info = getPokeInfo(data.pokemon);
  const map = {
    '{treinador}': data.playerNick || 'N/A',
    '{pokemon}': data.pokemon || 'N/A',
    '{ivs}': (data.ivs ? `F${data.ivs.toString().match(/\d+/)?.[0] || data.ivs.toString().replace('F', '')}` : 'N/A'),
    '{genero}': data.gender || 'N/A',
    '{ability}': data.ability ? (data.hasHA ? `${data.ability} (HA)` : data.ability) : 'N/A',
    '{b/c}': data.isCastrated ? '(CASTRADO)' : '(BREEDABLE)',
    '{total}': (data.totalPrice ? Math.floor(Number(data.totalPrice) / (Number(data.totalPrice) >= 1000 ? 1000 : 1)) + (Number(data.totalPrice) >= 1000 ? 'k' : '') : (data.total || 'N/A')),
    '{obs}': data.observations || 'Nenhuma',
    '{discord}': data.discordNick || 'N/A',
    '{egg}': data.eggGroup || info?.e?.join(', ') || 'N/A',
    '{caixa}': data.caixa || '0',
    '{total_dia}': data.total_dia || '0',
    '{status}': (STATUS_CONFIG[data.status || 'Pendente']?.emoji || '') + ' ' + (STATUS_CONFIG[data.status || 'Pendente']?.label || 'Pendente'),
    '{sprite}': info ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${info.id}.png` : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    '{pendente}': data.pendente || data.Pendente || '0',
    '{breeding}': data.breeding || data.Breeding || '0',
    '{finalizado}': data.finalizado || data.Finalizado || '0',
    '{entregue}': data.entregue || data.Entregue || '0',
    '{nick}': data.nick || 'N/A',
    '{id}': data.id || 'N/A',
    '{gasto}': data.gasto || '0',
    '{historico}': data.historico || 'Nenhum pedido.',
    '{tabela}': data.tabela || ''
  };
  let result = text;
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) result = result.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v);
  }
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
    })) || DEFAULT_EMBEDS[type].fields,
    components: f.components?.arrayValue?.values?.map(v => ({
      type: 2,
      label: v.mapValue.fields.label.stringValue,
      style: parseInt(v.mapValue.fields.style.integerValue),
      custom_id: v.mapValue.fields.custom_id?.stringValue || '',
      url: v.mapValue.fields.url?.stringValue || ''
    })) || DEFAULT_EMBEDS[type].components || []
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
      { type: 2, label: '🔘 Botões', style: 2, custom_id: `menu_buttons_${type}` },
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

function buildButtonButtons(type, buttons) {
  const rows = [];
  const btnElements = buttons.map((b, i) => ({ type: 2, label: b.label.slice(0, 15), style: b.style, custom_id: `editbutton_modal_${i}_${type}` }));
  for (let i = 0; i < btnElements.length; i += 5) rows.push({ type: 1, components: btnElements.slice(i, i + 5) });
  const actionRow = { type: 1, components: [] };
  if (buttons.length < 5) actionRow.components.push({ type: 2, label: '➕ Adicionar Botão', style: 3, custom_id: `editbutton_add_${type}` });
  if (buttons.length > 0) actionRow.components.push({ type: 2, label: '🗑️ Remover Botão', style: 4, custom_id: `menu_buttons_delete_${type}` });
  actionRow.components.push({ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_config_${type}` });
  rows.push(actionRow);
  return rows;
}

function buildButtonDeleteMenu(type, buttons) {
  return [{ type: 1, components: [{ type: 3, custom_id: `editbutton_delete_select_${type}`, placeholder: 'Selecione para remover', options: buttons.map((b, i) => ({ label: b.label.slice(0, 50), value: i.toString() })) }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_buttons_${type}` }] }];
}

function buildMainMenuButtons(orderId, customButtons = []) {
  if (customButtons && customButtons.length > 0) {
    return [{ type: 1, components: customButtons.map(b => ({ ...b, custom_id: b.custom_id ? `${b.custom_id}_${orderId}` : undefined })) }];
  }
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
      const commands = [
        { 
          name: "editar_embed", 
          description: "Painel de configuração de embeds", 
          options: [{ 
            name: "tipo", 
            description: "Tipo de embed", 
            type: 3, 
            required: true, 
            choices: [
              { name: "Notificação", value: "notificacao" }, 
              { name: "Cancelamento", value: "cancelamento" },
              { name: "Caixa", value: "caixa" },
              { name: "Resumo", value: "resumo" },
              { name: "Cliente", value: "cliente" },
              { name: "Tabela", value: "tabela" },
              { name: "Bot Config", value: "config_bot" }
            ] 
          }] 
        },
        {
          name: "cliente",
          description: "Histórico e detalhes do cliente via ID do Site",
          options: [{
            name: "id_site",
            description: "ID Sequencial do Treinador (Ex: 00001)",
            type: 3,
            required: true
          }]
        },
        {
          name: "caixa",
          description: "Lucro total da loja em tempo real"
        },
        {
          name: "resumo",
          description: "Painel de pedidos e valores do dia"
        },
        {
          name: "config_bot",
          description: "Configurar funções e perfil do bot (pings, nome, status)"
        },
        {
          name: "tabela",
          description: "Exibe a tabela de preços cobrada"
        }
      ];
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
          const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else if (newStatus !== 'Entregue' && currentChannelId === ARCHIVE_CHANNEL_ID) {
          const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder), embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else {
          await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder), embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
        }
        
        if (newMessageId !== currentMessageId) {
          await updateFirestore(env, 'orders', orderId, { discordMessageId: { stringValue: newMessageId } }, idToken);
        }
        return true;
      }

      if (data.action === 'send') {
        const cfg = await getEmbedConfig(env, 'notificacao', idToken);
        const embed = buildEmbedFromConfig(cfg, order);
        const res = await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(data.orderId, cfg.components) }) });
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

      const mockOrder = { 
        pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User',
        Pendente: '5', Breeding: '3', Finalizado: '2', Entregue: '10', total: '1.5kk',
        nick: 'ValiantUser', id: '123456789012345678', gasto: '500k', historico: '• Pikachu (Finalizado) - 100k\n• Charizard (Pendente) - 80k',
        tabela: 'Tabela de Preços', caixa: '15.5kk', total_dia: '1.2kk'
      };

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

      if (interaction.type === 2 && interaction.data.name === 'caixa') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const query = { structuredQuery: { from: [{ collectionId: 'orders' }], select: { fields: [{ fieldPath: 'totalPrice' }] } } };
          const results = await queryFirestore(env, query, idToken);
          const total = results.reduce((acc, r) => acc + (parseInt(r.document?.fields?.totalPrice?.integerValue || r.document?.fields?.totalPrice?.doubleValue || 0)), 0);
          const formatted = total >= 1000000 ? `${(total/1000000).toFixed(2)}kk` : `${(total/1000).toFixed(0)}k`;
          const cfg = await getEmbedConfig(env, 'caixa', idToken);
          const embed = buildEmbedFromConfig(cfg, { caixa: formatted });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'resumo') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const today = new Date(); today.setHours(0,0,0,0);
          const query = { structuredQuery: { from: [{ collectionId: 'orders' }], where: { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: today.toISOString() } } } } };
          const results = await queryFirestore(env, query, idToken);
          const stats = { pendente: 0, breeding: 0, finalizado: 0, entregue: 0, totalVal: 0 };
          results.forEach(r => {
            const d = r.document; if (!d) return;
            const status = (d.fields?.status?.stringValue || 'Pendente').toLowerCase();
            const val = parseInt(d.fields?.totalPrice?.integerValue || d.fields?.totalPrice?.doubleValue || 0);
            if (stats[status] !== undefined) stats[status]++;
            stats.totalVal += val;
          });
          const formattedVal = stats.totalVal >= 1000000 ? `${(stats.totalVal/1000000).toFixed(2)}kk` : `${(stats.totalVal/1000).toFixed(0)}k`;
          const cfg = await getEmbedConfig(env, 'resumo', idToken);
          const embed = buildEmbedFromConfig(cfg, { ...stats, total_dia: formattedVal });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }



      if (interaction.type === 2 && interaction.data.name === 'cliente') {
        let idSite = interaction.data.options.find(o => o.name === 'id_site')?.value;
        if (idSite && !isNaN(idSite)) {
          idSite = idSite.toString().padStart(5, '0');
        }
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          
          // 1. Search for trainer profile by sequentialId (string or integer)
          const profileQuery = { 
            structuredQuery: { 
              from: [{ collectionId: 'trainer_profiles' }], 
              where: {
                compositeFilter: {
                  op: 'OR',
                  filters: [
                    { fieldFilter: { field: { fieldPath: 'sequentialId' }, op: 'EQUAL', value: { stringValue: idSite } } },
                    { fieldFilter: { field: { fieldPath: 'sequentialId' }, op: 'EQUAL', value: { stringValue: idSite.replace(/^0+/, '') } } },
                    { fieldFilter: { field: { fieldPath: 'sequentialId' }, op: 'EQUAL', value: { integerValue: parseInt(idSite).toString() } } }
                  ]
                }
              }, 
              limit: 1 
            } 
          };
          const profileResults = await queryFirestore(env, profileQuery, idToken);
          const profileDoc = profileResults[0]?.document;
          
          if (!profileDoc) {
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Treinador com ID \`${idSite}\` não encontrado no banco de dados.` }) });
             return;
          }

          const nick = profileDoc.fields.displayName.stringValue;
          const discordNick = profileDoc.fields.discordNick?.stringValue || 'N/A';

          // 2. Search for orders by playerNick (matches displayName in profile)
          const orderQuery = { structuredQuery: { from: [{ collectionId: 'orders' }], where: { fieldFilter: { field: { fieldPath: 'playerNick' }, op: 'EQUAL', value: { stringValue: nick } } } } };
          const results = await queryFirestore(env, orderQuery, idToken);
          
          let totalSpent = 0;
          let history = results.map(r => {
            const d = r.document; if (!d) return null;
            const val = parseInt(d.fields?.totalPrice?.integerValue || d.fields?.totalPrice?.doubleValue || 0);
            totalSpent += val;
            return `• **${d.fields?.pokemon?.stringValue}** (${d.fields?.status?.stringValue}) - ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`;
          }).filter(Boolean).slice(-10).reverse().join('\n');

          const formattedSpent = totalSpent >= 1000000 ? `${(totalSpent/1000000).toFixed(2)}kk` : `${(totalSpent/1000).toFixed(0)}k`;
          const cfg = await getEmbedConfig(env, 'cliente', idToken);
          const embed = buildEmbedFromConfig(cfg, { nick: `${nick} (${discordNick})`, id: idSite, gasto: formattedSpent, historico: history || 'Nenhum pedido encontrado.' });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'tabela') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, 'tabela', idToken);
          const embed = buildEmbedFromConfig(cfg, {});
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'config_bot') {
        return jsonResponse({
          type: 4,
          data: {
            embeds: [{
              title: "⚙️ Painel de Comando Administrativo",
              description: "Bem-vindo ao **Valiant Hub**. Aqui você pode orquestrar todas as facetas do seu assistente digital, desde a sua identidade visual até os protocolos de notificação e manutenção do sistema.\n\nSelecione uma **categoria** abaixo para começar a configuração.",
              color: 0x3b82f6,
              thumbnail: { url: "https://i.imgur.com/rNn9A9S.png" },
              fields: [
                { name: "📢 Notificações", value: "Canais de logs, pings e regras de alerta.", inline: true },
                { name: "👤 Identidade", value: "Nome, Avatar, Bio e Status do bot.", inline: true },
                { name: "🛡️ Sistema", value: "Manutenção e permissões críticas.", inline: true }
              ],
              footer: { text: "ValiantShop • Gestão de Infraestrutura" }
            }],
            components: [{
              type: 1,
              components: [{
                type: 3,
                custom_id: "config_category_select",
                options: [
                  { label: "Notificações", value: "config_notif", description: "Configurar logs e pings", emoji: { name: "📢" } },
                  { label: "Perfil & Identidade", value: "config_profile", description: "Alterar nome, avatar e status", emoji: { name: "👤" } },
                  { label: "Configurações de Sistema", value: "config_system", description: "Manutenção e modo seguro", emoji: { name: "🛡️" } }
                ],
                placeholder: "Selecione a área de atuação..."
              }]
            }]
          }
        });
      }

      if (interaction.type === 3) {
        if (interaction.data.custom_id === "config_category_select") {
          const category = interaction.data.values[0];
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '', name: '', status: '' };
            
            let embed, components;
            
            if (category === 'config_notif') {
              embed = {
                title: "📢 Gestão de Notificações & Alertas",
                description: "Configure como o sistema deve reagir a novos eventos e onde os registros devem ser armazenados.\n\n" +
                             "• **Notificações:** Ativa/Desativa o envio de mensagens automáticas.\n" +
                             "• **Pings de Equipe:** Define se a equipe deve ser mencionada em novos pedidos.\n" +
                             "• **Logs:** Histórico técnico de todas as transações e erros.",
                color: 0x3b82f6,
                fields: [
                  { name: "📊 Configuração Atual", value: `📡 Estado: ${s.notif ? '`ON` ✅' : '`OFF` ❌'}\n🔔 Pings: ${s.pings ? '`ON` ✅' : '`OFF` ❌'}\n📺 Canal de Logs: <#${s.logChannel || 'Não Definido'}>` }
                ]
              };
              components = [
                { type: 1, components: [
                  { type: 2, label: 'Alternar Notificações', style: s.notif ? 3 : 4, custom_id: 'config_toggle_notif' },
                  { type: 2, label: 'Alternar Pings', style: s.pings ? 3 : 4, custom_id: 'config_toggle_pings' }
                ]},
                { type: 1, components: [
                  { type: 2, label: 'Definir Canal de Logs', style: 2, custom_id: 'config_set_logchannel' },
                  { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }
                ]}
              ];
            } else if (category === 'config_profile') {
              embed = {
                title: "👤 Customização de Identidade",
                description: "Molde a personalidade e a aparência do bot no servidor.\n\n" +
                             "• **Nome & Bio:** O nome de exibição e a descrição 'Sobre Mim'.\n" +
                             "• **Avatar:** A imagem de perfil (requer URL direta).\n" +
                             "• **Status:** A frase que aparece abaixo do nome do bot.",
                color: 0xa855f7,
                fields: [
                  { name: "🎭 Identidade Atual", value: `🏷️ **Nome:** ${s.name || 'Padrão'}\n📝 **Status:** ${s.status || 'Sem status definido'}` }
                ]
              };
              components = [{
                type: 1,
                components: [
                  { type: 2, label: 'Editar Nome & Bio', style: 2, custom_id: 'config_edit_identity' },
                  { type: 2, label: 'Alterar Avatar', style: 2, custom_id: 'config_edit_avatar' },
                  { type: 2, label: 'Definir Status', style: 2, custom_id: 'config_edit_status' },
                  { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }
                ]
              }];
            } else if (category === 'config_system') {
              embed = {
                title: "🛡️ Segurança & Núcleo do Sistema",
                description: "Acesse funções críticas de manutenção e integridade dos dados.\n\n" +
                             "• **Modo Manutenção:** Bloqueia comandos para usuários não-administradores.\n" +
                             "• **Limpeza de Cache:** Força a atualização de variáveis locais e tokens.",
                color: 0xef4444,
                fields: [{ name: "Modo Manutenção", value: s.maintenance ? "⚠️ O bot está em modo de manutenção." : "✅ O bot está operando normalmente." }]
              };
              components = [{
                type: 1,
                components: [
                  { type: 2, label: s.maintenance ? 'Desativar Manutenção' : 'Ativar Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' },
                  { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }
                ]
              }];
            }
            
            await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 7, data: { embeds: [embed], components } })
            });
          })());
          return jsonResponse({ type: 5 });
        }

        if (interaction.data.custom_id === 'config_edit_identity') {
          return jsonResponse({ type: 9, data: { title: 'Editar Identidade', custom_id: 'config_identity_submit', components: [
            { type: 1, components: [{ type: 4, custom_id: 'name', label: 'Nome do Bot', style: 1, required: true }] },
            { type: 1, components: [{ type: 4, custom_id: 'bio', label: 'Biografia/Sobre', style: 2, required: true }] }
          ]}});
        }

        if (interaction.data.custom_id === 'config_edit_avatar') {
          return jsonResponse({ type: 9, data: { title: 'Alterar Avatar', custom_id: 'config_avatar_submit', components: [
            { type: 1, components: [{ type: 4, custom_id: 'url', label: 'URL da Imagem', style: 1, required: true }] }
          ]}});
        }

        if (interaction.data.custom_id === 'config_edit_status') {
          return jsonResponse({ type: 9, data: { title: 'Definir Status', custom_id: 'config_status_submit', components: [
            { type: 1, components: [{ type: 4, custom_id: 'status', label: 'Mensagem do Status', style: 1, required: true }] }
          ]}});
        }

        if (interaction.data.custom_id === 'config_set_logchannel') {
          return jsonResponse({ type: 9, data: { title: 'Canal de Logs', custom_id: 'config_logchannel_submit', components: [
            { type: 1, components: [{ type: 4, custom_id: 'channel_id', label: 'ID do Canal', style: 1, required: true }] }
          ]}});
        }

        if (interaction.data.custom_id === 'back_to_config') {
          return jsonResponse({ type: 7, data: {
            embeds: [{
              title: "⚙️ Painel de Comando Administrativo",
              description: "Bem-vindo ao **Valiant Hub**. Aqui você pode orquestrar todas as facetas do seu assistente digital, desde a sua identidade visual até os protocolos de notificação e manutenção do sistema.\n\nSelecione uma **categoria** abaixo para começar a configuração.",
              color: 0x3b82f6,
              thumbnail: { url: "https://i.imgur.com/rNn9A9S.png" },
              fields: [
                { name: "📢 Notificações", value: "Canais de logs, pings e regras de alerta.", inline: true },
                { name: "👤 Identidade", value: "Nome, Avatar, Bio e Status do bot.", inline: true },
                { name: "🛡️ Sistema", value: "Manutenção e permissões críticas.", inline: true }
              ],
              footer: { text: "ValiantShop • Gestão de Infraestrutura" }
            }],
            components: [{
              type: 1,
              components: [{
                type: 3,
                custom_id: "config_category_select",
                options: [
                  { label: "Notificações", value: "config_notif", description: "Configurar logs e pings", emoji: { name: "📢" } },
                  { label: "Perfil & Identidade", value: "config_profile", description: "Alterar nome, avatar e status", emoji: { name: "👤" } },
                  { label: "Configurações de Sistema", value: "config_system", description: "Manutenção e modo seguro", emoji: { name: "🛡️" } }
                ],
                placeholder: "Selecione a área de atuação..."
              }]
            }]
          }});
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
        if (parts[0] === 'menu' && parts[1] === 'buttons') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           return jsonResponse({ type: 7, data: { components: buildButtonButtons(type, cfg.components || []) } });
        }

        if (parts[0] === 'editbutton' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Botão', custom_id: `modalbutton_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'label', label: 'Texto do Botão', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'style', label: 'Estilo (1-Blurple, 2-Gray, 3-Green, 4-Red)', placeholder: '2', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado (Ação)', placeholder: 'ex: status_check', style: 1 }] },
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL (Opcional)', placeholder: 'https://...', style: 1 }] }
           ]}});
        }

        if (parts[0] === 'editbutton' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const btn = cfg.components[index];
           return jsonResponse({ type: 9, data: { title: 'Editar Botão', custom_id: `modalbutton_edit_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'label', label: 'Texto do Botão', value: btn.label, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'style', label: 'Estilo (1-4)', value: btn.style.toString(), style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado', value: btn.custom_id || '', style: 1 }] },
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL', value: btn.url || '', style: 1 }] }
           ]}});
        }

        if (parts[0] === 'menu' && parts[1] === 'buttons' && parts[2] === 'delete') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           return jsonResponse({ type: 7, data: { components: buildButtonDeleteMenu(type, cfg.components || []) } });
        }

        if (parts[0] === 'editbutton' && parts[1] === 'delete' && parts[2] === 'select') {
           const idToken = await getFirebaseToken(env);
           const index = parseInt(interaction.data.values[0]);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           cfg.components.splice(index, 1);
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           return jsonResponse({ type: 7, data: { components: buildButtonButtons(type, cfg.components) } });
        }

        if (interaction.data.custom_id === "config_toggle_notif" || interaction.data.custom_id === "config_toggle_pings" || interaction.data.custom_id === "config_toggle_maint") {
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
            
            const field = interaction.data.custom_id === "config_toggle_notif" ? "notif" : (interaction.data.custom_id === "config_toggle_pings" ? "pings" : "maintenance");
            s[field] = !s[field];
            
            await updateFirestoreDoc(env, 'bot_config', 'settings', { fields: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v.toString() }])) }, idToken);
            
            // Trigger a re-render of the current view (Notificações or Sistema)
            const isMaint = interaction.data.custom_id === "config_toggle_maint";
            const embed = isMaint ? {
              title: "🛡️ Configurações de Sistema",
              description: "Controles de segurança e manutenção global.",
              color: 0xef4444,
              fields: [{ name: "Modo Manutenção", value: s.maintenance ? "⚠️ O bot está em modo de manutenção." : "✅ O bot está operando normalmente." }]
            } : {
              title: "📢 Configurações de Notificação",
              description: "Gerencie como o bot se comunica com a equipe e registra atividades.",
              color: 0x3b82f6,
              fields: [{ name: "Status Atual", value: `🔔 Notificações: ${s.notif ? '✅' : '❌'}\n📣 Pings: ${s.pings ? '✅' : '❌'}\n📺 Logs: <#${s.logChannel || '0'}>` }]
            };
            const components = isMaint ? [{ type: 1, components: [{ type: 2, label: s.maintenance ? 'Desativar Manutenção' : 'Ativar Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }] : [
              { type: 1, components: [{ type: 2, label: 'Alternar Notificações', style: s.notif ? 3 : 4, custom_id: 'config_toggle_notif' }, { type: 2, label: 'Alternar Pings', style: s.pings ? 3 : 4, custom_id: 'config_toggle_pings' }] },
              { type: 1, components: [{ type: 2, label: 'Definir Canal de Logs', style: 2, custom_id: 'config_set_logchannel' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }
            ];
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed], components }) });
          })());
          return jsonResponse({ type: 6 });
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
        if (parts[0] === 'menu' && parts[1] === 'back') return jsonResponse({ type: 7, data: { content: '', components: buildMainMenuButtons(orderId, (await getEmbedConfig(env, 'notificacao', idToken)).components) } });
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
                 const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else if (parts[1] !== 'Entregue' && interaction.channel_id === ARCHIVE_CHANNEL_ID) {
                 const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
                 const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else {
                 await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuButtons(orderId, cfg.components) }) });
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

        if (cid === 'config_logchannel_submit' || cid === 'config_identity_submit' || cid === 'config_avatar_submit' || cid === 'config_status_submit') {
          ctx.waitUntil((async () => {
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue !== undefined ? v.booleanValue : (v.stringValue && !isNaN(v.stringValue) && k !== 'logChannel' ? parseInt(v.stringValue) : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '', name: '', bio: '', avatar: '', status: '' };
            
            if (cid === 'config_logchannel_submit') s.logChannel = getVal('channel_id');
            if (cid === 'config_identity_submit') { s.name = getVal('name'); s.bio = getVal('bio'); }
            if (cid === 'config_avatar_submit') s.avatar = getVal('url');
            if (cid === 'config_status_submit') s.status = getVal('status');
            
            const fields = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: (v || '').toString() }]));
            await updateFirestoreDoc(env, 'bot_config', 'settings', { fields }, idToken);
            
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
              method: 'PATCH', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ content: "✅ **Configuração Global Atualizada!**\nAs mudanças foram salvas no banco de dados e aplicadas ao sistema.", embeds: [], components: [] }) 
            });
          })());
          return jsonResponse({ type: 6 });
        }
        const mockOrder = { 
          pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User',
          Pendente: '5', Breeding: '3', Finalizado: '2', Entregue: '10', total: '1.5kk',
          nick: 'ValiantUser', id: '123456789012345678', gasto: '500k', historico: '• Pikachu (Finalizado) - 100k\n• Charizard (Pendente) - 80k',
          tabela: 'Tabela de Preços', caixa: '15.5kk', total_dia: '1.2kk'
        };

        if (cid.includes('_submit')) {
           const parts = cid.split('_'); const type = parts.pop();
           if (getVal('confirm') !== VERIFY_CONFIRM) return jsonResponse({ type: 4, data: { flags: 64, content: `❌ Confirmação incorreta!` } });
           if (parts[0] === 'editembed' || parts[1] === 'saveconfig') {
              const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
              const cfg = JSON.parse(draftDoc.fields.config.stringValue);
              const fields = { [type]: { mapValue: { fields: {
                title: { stringValue: cfg.title || '' }, description: { stringValue: cfg.description || '' }, color: { stringValue: cfg.color },
                banner: { stringValue: cfg.banner || '' }, footer: { stringValue: cfg.footer || '' }, author: { stringValue: cfg.author || '' },
                thumbnail: { stringValue: cfg.thumbnail || '{sprite}' },
                content: { stringValue: cfg.content || '' }, channel: { stringValue: cfg.channel || DEFAULT_EMBEDS[type].channel },
                fields: { arrayValue: { values: cfg.fields.map(f => ({ mapValue: { fields: { name: { stringValue: f.name }, value: { stringValue: f.value }, inline: { booleanValue: f.inline } }}})) }},
                components: { arrayValue: { values: (cfg.components || []).map(b => ({ mapValue: { fields: {
                  label: { stringValue: b.label },
                  style: { integerValue: b.style.toString() },
                  custom_id: { stringValue: b.custom_id || '' },
                  url: { stringValue: b.url || '' }
                }}})) }}
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
        if (cid === 'modal_config_logchannel') {
           return jsonResponse({ type: 6 });
        }

        if (cid.startsWith('modalbutton_')) {
           const parts = cid.split('_'); const action = parts[1]; const type = parts.pop();
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (!cfg.components) cfg.components = [];
           
           const newBtn = { label: getVal('label'), style: parseInt(getVal('style')), custom_id: getVal('custom_id'), url: getVal('url') };
           if (action === 'add') cfg.components.push(newBtn);
           else { const index = parseInt(parts[2]); cfg.components[index] = newBtn; }
           
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           return jsonResponse({ type: 7, data: { embeds: [preview], components: buildButtonButtons(type, cfg.components) } });
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
