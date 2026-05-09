/**
 * ValiantShop — Discord Interaction Worker
 * Handles button clicks, select menus, modals, and bidirectional sync.
 */
import { POKEMON_DB } from './pokemonDb.js';
import { POKEMON_TYPE_DATA } from '../../src/data/pokemonTypes.ts';

const STATUS_CONFIG = {
  Pendente:   { color: 0xF97416, emoji: '🟠', label: 'Pendente' },
  Breeding:   { color: 0x7B2FBE, emoji: '🟣', label: 'Breeding' },
  Finalizado: { color: 0x00C851, emoji: '🟢', label: 'Finalizado' },
  Entregue:   { color: 0x427BD0, emoji: '🔵', label: 'Entregue' },
};

const TYPE_TRANSLATIONS = {
  "normal": "normal", "fire": "fire", "fogo": "fire",
  "water": "water", "água": "water", "agua": "water",
  "grass": "grass", "grama": "grass", "planta": "grass",
  "electric": "electric", "elétrico": "electric", "eletrico": "electric",
  "ice": "ice", "gelo": "ice",
  "fighting": "fighting", "lutador": "fighting",
  "poison": "poison", "venenoso": "poison",
  "ground": "ground", "terra": "ground",
  "flying": "flying", "voador": "flying",
  "psychic": "psychic", "psíquico": "psychic", "psiquico": "psychic",
  "bug": "bug", "inseto": "bug",
  "rock": "rock", "pedra": "rock",
  "ghost": "ghost", "fantasma": "ghost",
  "dragon": "dragon", "dragão": "dragon", "dragao": "dragon",
  "dark": "dark", "noturno": "dark", "sombrio": "dark",
  "steel": "steel", "aço": "steel", "aco": "steel",
  "fairy": "fairy", "fada": "fairy"
};

const CATEGORY_TRANSLATIONS = {
  "starter": "Iniciais",
  "pseudo": "Semi-Lendários"
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
    components: [
      { type: 2, label: '⚙️ Status', style: 1, custom_id: 'menu_status' },
      { type: 2, label: '❌ Cancelar', style: 4, custom_id: 'confirm_cancel' }
    ]
  },
  notificacao_competitiva: {
    title: '⚔️ ENCOMENDA COMPETITIVA ⚔️',
    description: '<@USER>, um novo pedido competitivo foi registrado.',
    color: '0xA855F7',
    banner: 'https://wallpapers-clan.com/wp-content/uploads/2024/08/ash-pikachu-adventure-pokemon-desktop-wallpaper-cover.jpg',
    footer: 'ValiantShop | Logística Competitiva',
    author: 'Aviso de Venda Competitiva',
    thumbnail: '{sprite}',
    content: '⚔️ Novo pedido competitivo!',
    channel: '1501747572463894538',
    fields: [
      { name: '👤 Treinador', value: '{treinador}', inline: true }, { name: '👾 Pokémon', value: '{pokemon}', inline: true }, { name: '📊 IVs', value: '{ivs}', inline: true },
      { name: '📈 EVs', value: '{evs}', inline: true }, { name: '🎒 Item', value: '{item}', inline: true }, { name: '🎖️ Level', value: '{level}', inline: true },
      { name: '🌀 Moveset', value: '{moveset}', inline: false },
      { name: '💰 Valor Total', value: '{total}', inline: true }
    ],
    components: [
      { type: 2, label: '⚙️ Status', style: 1, custom_id: 'menu_status' },
      { type: 2, label: '❌ Cancelar', style: 4, custom_id: 'confirm_cancel' }
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
    ],
    components: []
  },
  balance: {
    title: '💰 BALANÇO FINANCEIRO',
    description: 'Relatório consolidado de lucros da ValiantShop.\n\n💰 **Lucro Total:** `{balance}`',
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
    footer: 'ValiantShop Logistics • {data}',
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
  help: {
    title: '🌌 CENTRAL DE AJUDA — VALIANTSHOP',
    description: 'Bem-vindo à central de suporte e ferramentas do bot. Utilize o menu abaixo para navegar entre as categorias.',
    color: '0x6366f1',
    banner: 'https://valiantshop.pages.dev/assets/images/bot_banner.jpg', 
    thumbnail: 'https://valiantshop.pages.dev/assets/images/bot_logo.png',
    footer: 'ValiantShop | Modernizing your experience',
    fields: [
      { name: '🚀 Início Rápido', value: 'Selecione uma categoria no menu para ver os comandos disponíveis.', inline: false },
      { name: '🌐 Links Úteis', value: '[Acesse nosso Site](https://valiantshop.pages.dev)\n[Tabela de Preços](https://valiantshop.pages.dev/tabela)', inline: false }
    ],
    components: [
      { label: 'Site Oficial', style: 5, url: 'https://valiantshop.pages.dev', emoji: { name: '🌐' } }
    ]
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

const COMP_VARS = ['{evs}', '{item}', '{moveset}', '{level}', '{ppmax}'];

function validateVars(text, type) {
  if (type === 'notificacao_competitiva') return { hasProhibited: false, cleaned: text };
  
  let cleaned = text;
  let hasProhibited = false;
  
  for (const v of COMP_VARS) {
    if (text.includes(v)) {
      const escapedV = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(escapedV, 'g'), '');
      hasProhibited = true;
    }
  }
  
  return { hasProhibited, cleaned };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json', 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
      'Access-Control-Allow-Headers': 'Content-Type, X-Valiant-Key' 
    },
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
  const cleanName = name.trim().toLowerCase();
  
  // 1. Tentar pelo POKEMON_DB (chaves capitalizadas)
  const entry = Object.entries(POKEMON_DB).find(([k]) => k.toLowerCase() === cleanName);
  if (entry) return { name: entry[0], ...entry[1] };
  
  // 2. Fallback: Procurar no POKEMON_TYPE_DATA pelo nome
  const typeEntry = POKEMON_TYPE_DATA.find(t => t.name.toLowerCase() === cleanName);
  if (typeEntry) return { name: typeEntry.name, id: typeEntry.id };
  
  return null;
}

function replacePlaceholders(text, data, templateType = 'notificacao') {
  if (!text) return text;
  const isCompTemplate = templateType === 'notificacao_competitiva';
  const info = getPokeInfo(data.pokemon);
  
  // Formata IVs ignorados — exibe apenas "-HP -Atk" sem prefixo
  let ivsDetalhe = '';
  const IV_NAME_MAP = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe', special: 'SpA' };
  if (Array.isArray(data.ignoredIvs) && data.ignoredIvs.length > 0) {
    ivsDetalhe = data.ignoredIvs.map(iv => {
      const key = iv.toString().toLowerCase();
      return `-${IV_NAME_MAP[key] || iv}`;
    }).join(' ');
  } else if (typeof data.ignoredIvs === 'string' && data.ignoredIvs.length > 0) {
    ivsDetalhe = data.ignoredIvs;
  }

  const map = {
    '{treinador}': data.playerNick || 'N/A',
    '{pokemon}': data.pokemon || 'N/A',
    '{ivs}': (data.ivs ? `F${data.ivs.toString().match(/\d+/)?.[0] || data.ivs.toString().replace('F', '')}` : 'N/A'),
    '{ivs_detalhe}': ivsDetalhe.replace(/QUALQUER/g, 'QUALQUER'), // Mantém QUALQUER legível
    '{genero}': data.gender === 'Q' ? 'Qualquer' : (data.gender === 'G' ? 'Genderless' : (data.gender || 'N/A')),
    '{ability}': data.ability ? (data.hasHA ? `${data.ability} (HA)` : data.ability) : 'N/A',
    '{b/c}': data.isCastrated ? '(CASTRADO)' : '(BREEDABLE)',
    '{total}': (data.totalPrice ? Math.floor(Number(data.totalPrice) / (Number(data.totalPrice) >= 1000 ? 1000 : 1)) + (Number(data.totalPrice) >= 1000 ? 'k' : '') : (data.total || 'N/A')),
    '{obs}': data.observations || 'Nenhuma',
    '{discord}': data.discordNick || 'N/A',
    '{egg}': data.eggGroup || info?.e?.join(', ') || 'N/A',
    '{balance}': data.balance || '0',
    '{caixa}': data.caixa || data.balance || '0',
    '{total_dia}': data.total_dia || '0',
    '{data}': data.data || '',
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
    '{tabela}': data.tabela || '',
    '{evs}': isCompTemplate ? (data.build?.evs ? Object.entries(data.build.evs).filter(([_, v]) => Number(v) > 0).map(([s, v]) => `${s}: ${v}`).join(' | ') : 'N/A') : '',
    '{item}': isCompTemplate ? (data.build?.item || 'Nenhum') : '',
    '{moveset}': isCompTemplate ? ((data.build?.moves || []).filter(Boolean).join(' / ') || 'N/A') : '',
    '{level}': isCompTemplate ? (data.build?.level || '50') : '',
    '{ppmax}': isCompTemplate ? (data.build?.ppMax ? 'SIM' : 'NÃO') : ''
  };
  let result = text;
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) result = result.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v);
  }
  return result;
}

function buildEmbedFromConfig(cfg, order, templateType = 'notificacao') {
  const info = getPokeInfo(order.pokemon);
  const embed = {
    color: parseInt(cfg.color, 16) || 0xF97416,
  };
  
  const title = replacePlaceholders(cfg.title, order, templateType);
  if (title && title.trim() !== '') embed.title = title.substring(0, 256);
  
  const desc = replacePlaceholders(cfg.description, order, templateType);
  if (desc && desc.trim() !== '') embed.description = desc.substring(0, 4096);
  
  if (cfg.fields && cfg.fields.length > 0) {
    embed.fields = cfg.fields.map(f => ({ 
      name: (replacePlaceholders(f.name, order, templateType) || '\u200B').substring(0, 256), 
      value: (replacePlaceholders(f.value, order, templateType) || '\u200B').substring(0, 1024), 
      inline: f.inline 
    }));
  }

  if (cfg.banner && cfg.banner.trim() !== '') embed.image = { url: replacePlaceholders(cfg.banner, order, templateType) };
  if (cfg.footer && cfg.footer.trim() !== '') embed.footer = { text: replacePlaceholders(cfg.footer, order, templateType).substring(0, 2048) };
  if (cfg.author && cfg.author.trim() !== '') embed.author = { name: replacePlaceholders(cfg.author, order, templateType).substring(0, 256) };
  
  if ((cfg.thumbnail === '{sprite}' || cfg.thumbnail === 'pokemon') && info) {
    embed.thumbnail = { url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${info.id}.png` };
  } else if (cfg.thumbnail && cfg.thumbnail.trim() !== '') {
    embed.thumbnail = { url: replacePlaceholders(cfg.thumbnail, order, templateType) };
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
    })) || DEFAULT_EMBEDS[type].components || [],
    selects: f.selects?.arrayValue?.values?.map(v => ({
      custom_id: v.mapValue.fields.custom_id.stringValue,
      placeholder: v.mapValue.fields.placeholder.stringValue,
      options: v.mapValue.fields.options.stringValue.split(',').map(o => ({ label: o.trim(), value: o.trim() }))
    })) || [],
    modals: f.modals?.arrayValue?.values?.map(v => ({
      trigger_id: v.mapValue.fields.trigger_id.stringValue,
      title: v.mapValue.fields.title.stringValue,
      questions: v.mapValue.fields.questions.stringValue,
      log_channel: v.mapValue.fields.log_channel.stringValue
    })) || []
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
      { type: 2, label: '🔽 Menus', style: 2, custom_id: `menu_selects_${type}` },
      { type: 2, label: '📖 Ferramentas', style: 2, custom_id: `help_tools_info` }
    ]},
    { type: 1, components: [
      { type: 2, label: '✅ SALVAR', style: 3, custom_id: `verify_saveconfig_${type}` },
      { type: 2, label: '❌ Cancelar', style: 4, custom_id: `action_cancelconfig_${type}` },
      { type: 2, label: '🔧 Modais', style: 2, custom_id: `menu_modals_${type}` }
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

function buildSelectButtons(type, selects = []) {
  const rows = [];
  const btnElements = selects.map((s, i) => ({ type: 2, label: (s.placeholder || s.custom_id || 'Menu').slice(0, 15), style: 2, custom_id: `editselect_modal_${i}_${type}` }));
  for (let i = 0; i < btnElements.length; i += 5) rows.push({ type: 1, components: btnElements.slice(i, i + 5) });
  const actionRow = { type: 1, components: [] };
  if (selects.length < 5) actionRow.components.push({ type: 2, label: '➕ Adicionar Menu', style: 3, custom_id: `editselect_add_${type}` });
  if (selects.length > 0) actionRow.components.push({ type: 2, label: '🗑️ Remover Menu', style: 4, custom_id: `menu_selects_delete_${type}` });
  actionRow.components.push({ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_config_${type}` });
  rows.push(actionRow);
  return rows;
}

function buildSelectDeleteMenu(type, selects = []) {
  return [{ type: 1, components: [{ type: 3, custom_id: `editselect_delete_select_${type}`, placeholder: 'Selecione para remover', options: selects.map((s, i) => ({ label: (s.placeholder || s.custom_id || 'Menu').slice(0, 50), value: i.toString() })) }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_selects_${type}` }] }];
}

function buildModalButtons(type, modals = []) {
  const rows = [];
  const btnElements = modals.map((m, i) => ({ type: 2, label: (m.title || m.custom_id || 'Modal').slice(0, 15), style: 2, custom_id: `editmodal_modal_${i}_${type}` }));
  for (let i = 0; i < btnElements.length; i += 5) rows.push({ type: 1, components: btnElements.slice(i, i + 5) });
  const actionRow = { type: 1, components: [] };
  if (modals.length < 5) actionRow.components.push({ type: 2, label: '➕ Adicionar Modal', style: 3, custom_id: `editmodal_add_${type}` });
  if (modals.length > 0) actionRow.components.push({ type: 2, label: '🗑️ Remover Modal', style: 4, custom_id: `menu_modals_delete_${type}` });
  actionRow.components.push({ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_config_${type}` });
  rows.push(actionRow);
  return rows;
}

function buildModalDeleteMenu(type, modals = []) {
  return [{ type: 1, components: [{ type: 3, custom_id: `editmodal_delete_select_${type}`, placeholder: 'Selecione para remover', options: modals.map((m, i) => ({ label: (m.title || m.custom_id || 'Modal').slice(0, 50), value: i.toString() })) }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_modals_${type}` }] }];
}

function buildMainMenuComponents(orderId, customButtons = [], customSelects = []) {
  const rows = [];
  if (customSelects && customSelects.length > 0) {
    for (const select of customSelects) {
      rows.push({ type: 1, components: [{ type: 3, custom_id: select.custom_id ? `${select.custom_id}_${orderId}` : `menu_select_${orderId}`, placeholder: select.placeholder || 'Escolha uma opção', options: select.options }] });
    }
  }
  
  if (customButtons && customButtons.length > 0) {
    const btnElements = customButtons.map(b => ({ ...b, custom_id: b.custom_id ? `${b.custom_id}_${orderId}` : undefined }));
    for (let i = 0; i < btnElements.length; i += 5) rows.push({ type: 1, components: btnElements.slice(i, i + 5) });
  } else if (rows.length === 0) {
    rows.push({ type: 1, components: [{ type: 2, label: '⚙️ Status', style: 1, custom_id: `menu_status_${orderId}` }, { type: 2, label: '❌ Cancelar', style: 4, custom_id: `confirm_cancel_${orderId}` }] });
  }
  return rows;
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
          description: "🎨 [SISTEMA] Painel de configuração de embeds", 
          options: [{ 
            name: "tipo", 
            description: "Tipo de embed", 
            type: 3, 
            required: true, 
            choices: [
              { name: "Encomenda Geral", value: "notificacao" }, 
              { name: "Encomenda Competitiva", value: "notificacao_competitiva" },
              { name: "Cancelamento", value: "cancelamento" },
              { name: "Balance", value: "balance" },
              { name: "Resumo", value: "resumo" },
              { name: "Cliente", value: "cliente" },
              { name: "Tabela", value: "tabela" },
              { name: "Bot Config", value: "config_bot" },
              { name: "Help", value: "help" }
            ] 
          }] 
        },
        {
          name: "cliente",
          description: "🎨 [SISTEMA] Histórico e detalhes do cliente via Nick do Discord",
          options: [{
            name: "discord",
            description: "Nick do Discord do Treinador (Ex: reskallaarthur)",
            type: 3,
            required: true
          }]
        },
        {
          name: "balance",
          description: "📦 [LOGÍSTICA] Lucro total da loja em tempo real"
        },
        {
          name: "resumo",
          description: "📦 [LOGÍSTICA] Painel de pedidos e valores das últimas 24 horas"
        },
        {
          name: "help",
          description: "🌟 [INFO] Central de ajuda e comandos da ValiantShop"
        },
        {
          name: "config_bot",
          description: "⚙️ [CONFIG] Configurar funções e perfil do bot"
        },
        {
          name: "tabela",
          description: "ℹ️ [INFO] Exibe a tabela de preços cobrada"
        },
        {
          name: "server",
          description: "🛡️ [ADMIN] Central de gerenciamento do servidor"
        },
        {
          name: "salas_estoque",
          description: "🏪 [LOGÍSTICA] Visualizar salas do estoque em tempo real",
          options: [
            {
              name: "pokemon",
              description: "Nome do Pokémon para destacar ou filtrar",
              type: 3,
              required: false
            },
            {
              name: "salas",
              description: "Filtrar por salas específicas (Ex: Sala 1, Sala 2)",
              type: 3,
              required: false
            },
            {
              name: "egg_group",
              description: "Filtrar por Egg Group (Ex: Field, Monster)",
              type: 3,
              required: false
            },
            {
              name: "tipos",
              description: "Filtrar por tipos (Ex: Fire, Water)",
              type: 3,
              required: false
            },
            {
              name: "gen",
              description: "Filtrar por Geração (1-9)",
              type: 4,
              required: false
            },
            {
              name: "categoria",
              description: "Filtrar por categoria especial",
              type: 3,
              required: false,
              choices: [
                { name: "Iniciais", value: "starter" },
                { name: "Semi-Lendários", value: "pseudo" }
              ]
            }
          ]
        }
      ];
      const appId = env.DISCORD_APPLICATION_ID || "1498061638941806833";
      const syncRes = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, { 
        method: 'PUT', 
        headers: { 
          'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`, 
          'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify(commands) 
      });

      if (syncRes.ok) {
        const deployed = await syncRes.json();
        return new Response(`✅ Comandos sincronizados com sucesso!\n\nAplicação: ${appId}\nComandos (${deployed.length}): ${deployed.map(c => '/' + c.name).join(', ')}\n\nNota: Comandos globais podem levar até 1 hora para aparecer em todos os servidores.`, { 
          status: 200, 
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
        });
      } else {
        const errorText = await syncRes.text();
        return new Response(`❌ Erro ao sincronizar comandos (${syncRes.status}): ${errorText}`, { 
          status: syncRes.status,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
        });
      }
    }

    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp  = request.headers.get('X-Signature-Timestamp');
    const siteKey    = request.headers.get('X-Valiant-Key');
    const body = await request.text();

    if (!signature && siteKey && siteKey === env.VALIANT_SECRET) {
      const data = JSON.parse(body);
      const order = data.order || {};
      const idToken = await getFirebaseToken(env);
      async function syncOrderStatus(env, orderId, newStatus, currentChannelId, currentMessageId, idToken, orderObj = null) {
        const doc = orderObj ? null : await getFirestoreDoc(env, 'orders', orderId, idToken);
        if (!doc && !orderObj) return false;
        
        const fullOrder = orderObj || Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
        fullOrder.status = newStatus;
        
        const templateType = fullOrder.isCompetitive ? 'notificacao_competitiva' : 'notificacao';
        const cfg = await getEmbedConfig(env, templateType, idToken);
        const embed = buildEmbedFromConfig(cfg, fullOrder, templateType);
        embed.color = STATUS_CONFIG[newStatus]?.color || embed.color;
        
        await updateFirestore(env, 'orders', orderId, { status: { stringValue: newStatus } }, idToken);
        
        let newChannelId = currentChannelId;
        let newMessageId = currentMessageId;
        
        if (newStatus === 'Entregue' && currentChannelId !== ARCHIVE_CHANNEL_ID) {
          const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else if (newStatus !== 'Entregue' && currentChannelId === ARCHIVE_CHANNEL_ID) {
          const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder), embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
          if (res.ok) {
             const newMsg = await res.json();
             newMessageId = newMsg.id;
             await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          }
        } else {
          await fetch(`https://discord.com/api/v10/channels/${currentChannelId}/messages/${currentMessageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, fullOrder, templateType), embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
        }
        
        if (newMessageId !== currentMessageId) {
          await updateFirestore(env, 'orders', orderId, { discordMessageId: { stringValue: newMessageId } }, idToken);
        }
        return true;
      }

      if (data.action === 'send') {
        const templateType = order.isCompetitive ? 'notificacao_competitiva' : 'notificacao';
        const cfg = await getEmbedConfig(env, templateType, idToken);
        const embed = buildEmbedFromConfig(cfg, order, templateType);
        const res = await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order, templateType), embeds: [embed], components: buildMainMenuComponents(data.orderId, cfg.components, cfg.selects) }) });
        if (res.ok) {
           const msg = await res.json();
           return jsonResponse({ success: true, id: msg.id });
        }
        return jsonResponse({ success: false });
      }
      if (data.action === 'update') {
        const templateType = order.isCompetitive ? 'notificacao_competitiva' : 'notificacao';
        const cfg = await getEmbedConfig(env, templateType, idToken);
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
           const embed = buildEmbedFromConfig(cfg, data.order, 'cancelamento');
           await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, data.order, 'cancelamento') || `⚠️ <@650763941462671394> Encomenda cancelada!`, embeds: [embed] }) });
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
        tabela: 'Tabela de Preços', caixa: '15.5kk', total_dia: '150k'
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

      if (interaction.type === 2 && interaction.data.name === 'balance') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const query = { structuredQuery: { from: [{ collectionId: 'orders' }], select: { fields: [{ fieldPath: 'totalPrice' }] } } };
          const results = await queryFirestore(env, query, idToken);
          const total = results.reduce((acc, r) => acc + (parseInt(r.document?.fields?.totalPrice?.integerValue || r.document?.fields?.totalPrice?.doubleValue || 0)), 0);
          const formatted = total >= 1000000 ? `${(total/1000000).toFixed(2)}kk` : `${(total/1000).toFixed(0)}k`;
          const cfg = await getEmbedConfig(env, 'balance', idToken);
          const embed = buildEmbedFromConfig(cfg, { balance: formatted });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'resumo') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const query = { structuredQuery: { from: [{ collectionId: 'orders' }], where: { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: past24h.toISOString() } } } } };
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
          const currentDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date());
          const cfg = await getEmbedConfig(env, 'resumo', idToken);
          const embed = buildEmbedFromConfig(cfg, { ...stats, total_dia: formattedVal, data: currentDate });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }



      if (interaction.type === 2 && interaction.data.name === 'cliente') {
        const discordInput = interaction.data.options.find(o => o.name === 'discord')?.value || '';
        
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          
          const orderQuery = { 
            structuredQuery: { 
              from: [{ collectionId: 'orders' }], 
              where: { fieldFilter: { field: { fieldPath: 'discordNick' }, op: 'EQUAL', value: { stringValue: discordInput } } } 
            } 
          };
          
          const results = await queryFirestore(env, orderQuery, idToken);
          
          if (!results || results.length === 0 || !results[0].document) {
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Nenhuma encomenda encontrada para o Discord Nick \`${discordInput}\`. Verifique a ortografia exata.` }) });
             return;
          }

          let totalSpent = 0;
          let playerNick = results[0].document.fields?.playerNick?.stringValue || 'Desconhecido';
          
          let history = results.map(r => {
            const d = r.document; if (!d) return null;
            const val = parseInt(d.fields?.totalPrice?.integerValue || d.fields?.totalPrice?.doubleValue || 0);
            totalSpent += val;
            return `• **${d.fields?.pokemon?.stringValue}** (${d.fields?.status?.stringValue}) - ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`;
          }).filter(Boolean).slice(-10).reverse().join('\n');

          const formattedSpent = totalSpent >= 1000000 ? `${(totalSpent/1000000).toFixed(2)}kk` : `${(totalSpent/1000).toFixed(0)}k`;
          const cfg = await getEmbedConfig(env, 'cliente', idToken);
          const embed = buildEmbedFromConfig(cfg, { nick: `${playerNick}`, id: discordInput, gasto: formattedSpent, historico: history || 'Nenhum pedido encontrado.' });
          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'help') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, 'help', idToken);
          const embed = buildEmbedFromConfig(cfg, mockOrder);
          
          const components = [
            {
              type: 1,
              components: [
                {
                  type: 3,
                  custom_id: 'help_menu',
                  placeholder: cfg.selects?.[0]?.placeholder || 'Selecione uma categoria...',
                  options: [
                    { label: '🏠 Início', value: 'help_home', description: 'Voltar para a tela inicial.', emoji: { name: '🏠' } },
                    { label: '📦 Logística & Pedidos', value: 'help_logistics', description: 'Comandos de balanço, resumo e histórico.', emoji: { name: '📦' } },
                    { label: '🛠️ Ferramentas & Estoque', value: 'help_tools', description: 'Tabela de preços, salas de estoque e utilitários.', emoji: { name: '🛠️' } },
                    { label: '⚙️ Configurações', value: 'help_settings', description: 'Ajustes de identidade, avatar e status.', emoji: { name: '⚙️' } },
                    { label: '📄 Personalização', value: 'help_system', description: 'Edição de embeds, modais e botões.', emoji: { name: '📄' } }
                  ]
                }
              ]
            }
          ];

          if (cfg.components && cfg.components.length > 0) {
            components.push({ type: 1, components: cfg.components.slice(0, 5) });
          } else {
            components.push({
              type: 1,
              components: [
                { type: 2, label: 'Site Oficial', style: 5, url: 'https://valiantshop.pages.dev', emoji: { name: '🌐' } }
              ]
            });
          }

          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components }) 
          });
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

      if (interaction.type === 2 && interaction.data.name === 'salas_estoque') {
        const highlightPoke = interaction.data.options?.find(o => o.name === 'pokemon')?.value?.toLowerCase();
        const filterSalas = interaction.data.options?.find(o => o.name === 'salas')?.value?.toLowerCase()?.split(',')?.map(s => s.trim());
        const filterEgg = interaction.data.options?.find(o => o.name === 'egg_group')?.value?.toLowerCase();
        const filterTypes = interaction.data.options?.find(o => o.name === 'tipos')?.value?.toLowerCase()?.split(',')?.map(s => s.trim());
        const filterGen = interaction.data.options?.find(o => o.name === 'gen')?.value;
        const filterCategory = interaction.data.options?.find(o => o.name === 'categoria')?.value;

        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const query = { structuredQuery: { from: [{ collectionId: 'stock_rooms' }] } };
          const results = await queryFirestore(env, query, idToken);
          
          let rooms = results.map(r => {
            const d = r.document; if (!d) return null;
            const fields = d.fields;
            const pokemonList = fields.pokemonList?.arrayValue?.values?.map(v => v.stringValue) || [];
            return {
              name: fields.name?.stringValue || 'Sem Nome',
              pokemonList
            };
          }).filter(Boolean).sort((a, b) => {
             const numA = parseInt(a.name.replace(/\D/g, ''), 10);
             const numB = parseInt(b.name.replace(/\D/g, ''), 10);
             if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
             return a.name.localeCompare(b.name, undefined, { numeric: true });
          });

          // 1. Filtrar por salas (Lógica flexível: 1, 2, Sala 1, etc)
          if (filterSalas && filterSalas.length > 0) {
            rooms = rooms.filter(room => 
              filterSalas.some(s => room.name.toLowerCase().includes(s))
            );
          }

          // 2. Aplicar filtros de Pokémon (Egg, Tipos, Gen, Categoria)
          const hasPokeFilters = filterEgg || filterTypes || filterGen || filterCategory;
          if (hasPokeFilters) {
            rooms = rooms.map(room => {
              const filteredList = room.pokemonList.filter(p => {
                const info = getPokeInfo(p);
                if (!info) return false;

                // 1. Egg Group
                const fEgg = filterEgg?.trim().toLowerCase();
                if (fEgg && !info.e?.some(e => e.toLowerCase() === fEgg)) return false;

                // 2. Tipos (Deve ter TODOS os tipos especificados)
                if (filterTypes && filterTypes.length > 0) {
                   const typeEntry = POKEMON_TYPE_DATA.find(t => t.id == info.id) || POKEMON_TYPE_DATA.find(t => t.name.toLowerCase() === info.name.toLowerCase());
                   if (!typeEntry) return false;
                   
                   const pTypesEn = typeEntry.types.map(t => t.toLowerCase());
                   const normalizedFilters = filterTypes
                     .map(ft => ft.trim().toLowerCase())
                     .filter(ft => ft.length > 0)
                     .map(ft => TYPE_TRANSLATIONS[ft] || ft);
                   
                   if (normalizedFilters.length > 0 && !normalizedFilters.every(nft => pTypesEn.includes(nft))) return false;
                }

                // 3. Gen (Lógica baseada em faixas de ID)
                if (filterGen) {
                  const idNum = parseInt(info.id);
                  if (isNaN(idNum)) return false;
                  let pGen = 0;
                  if (idNum >= 1 && idNum <= 151) pGen = 1;
                  else if (idNum >= 152 && idNum <= 251) pGen = 2;
                  else if (idNum >= 252 && idNum <= 386) pGen = 3;
                  else if (idNum >= 387 && idNum <= 493) pGen = 4;
                  else if (idNum >= 494 && idNum <= 649) pGen = 5;
                  else if (idNum >= 650 && idNum <= 721) pGen = 6;
                  else if (idNum >= 722 && idNum <= 809) pGen = 7;
                  else if (idNum >= 810 && idNum <= 905) pGen = 8;
                  else if (idNum >= 906 && idNum <= 1025) pGen = 9;
                  
                  if (pGen !== filterGen) return false;
                }

                // 4. Categoria (Iniciais e Pseudos)
                if (filterCategory) {
                  const id = info.id;
                  if (filterCategory === 'starter') {
                    const starters = [
                      1,2,3, 4,5,6, 7,8,9, // Gen 1
                      152,153,154, 155,156,157, 158,159,160, // Gen 2
                      252,253,254, 255,256,257, 258,259,260, // Gen 3
                      387,388,389, 390,391,392, 393,394,395, // Gen 4
                      495,496,497, 498,499,500, 501,502,503, // Gen 5
                      650,651,652, 653,654,655, 656,657,658, // Gen 6
                      722,723,724, 725,726,727, 728,729,730, // Gen 7
                      810,811,812, 813,814,815, 816,817,818, // Gen 8
                      906,907,908, 909,910,911, 912,913,914  // Gen 9
                    ];
                    if (!starters.includes(id)) return false;
                  }
                  if (filterCategory === 'pseudo') {
                    const pseudos = [
                      147,148,149, 246,247,248, 371,372,373, 374,375,376, 
                      443,444,445, 633,634,635, 704,705,706, 782,783,784, 
                      885,886,887, 996,997,998
                    ];
                    if (!pseudos.includes(id)) return false;
                  }
                }

                return true;
              });
              return { ...room, pokemonList: filteredList };
            }).filter(room => room.pokemonList.length > 0);
          }

          // 3. Filtrar por pokémon específico (AND logic)
          if (highlightPoke) {
            rooms = rooms.filter(room => 
              room.pokemonList.some(p => p.toLowerCase().includes(highlightPoke))
            );
          }

          if (rooms.length === 0) {
            let errorMsg = "❌ Nenhuma sala encontrada com os filtros aplicados.";
            if (!highlightPoke && !filterSalas && !hasPokeFilters) errorMsg = "❌ Nenhuma sala de estoque cadastrada no sistema.";
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
              method: 'PATCH', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ content: errorMsg }) 
            });
            return;
          }

          const hasAnyFilter = highlightPoke || filterSalas || hasPokeFilters;
          const fields = rooms.map(room => {
            const list = room.pokemonList.map(p => {
              const isMatch = highlightPoke && p.toLowerCase().includes(highlightPoke);
              return isMatch ? `**${p}**` : p;
            }).join(', ') || 'Vazia';
            
            return {
              name: `📦 ${room.name.toUpperCase()}`,
              value: list,
              inline: !hasAnyFilter
            };
          });

          const embeds = [];
          for (let i = 0; i < fields.length; i += 25) {
            const embed = {
              title: i === 0 ? "🏪 SALAS DO ESTOQUE — VALIANTSHOP" : "🏪 SALAS DO ESTOQUE (Continuação)",
              color: hasAnyFilter ? 0xFFA500 : 0x2ecc71,
              fields: fields.slice(i, i + 25),
              footer: { text: `ValiantShop | Inventário (${rooms.length} salas)` },
              timestamp: new Date().toISOString()
            };
            if (i === 0) {
              embed.description = hasAnyFilter ? "Filtros aplicados. Exibindo apenas os resultados correspondentes." : "Visão geral compacta de todas as salas de estoque.";
            }
            embeds.push(embed);
          }

          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: embeds.slice(0, 10) }) 
          });
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

      if (interaction.type === 2 && interaction.data.name === 'server') {
        return jsonResponse({
          type: 4,
          data: {
            flags: 64,
            embeds: [{
              title: '🛡️ Central de Comando ValiantShop',
              description: 'Bem-vindo ao centro de operações privadas. Selecione uma categoria abaixo para gerenciar a infraestrutura do seu servidor.',
              color: 0xef4444,
              fields: [
                { name: '🔒 Segurança', value: 'Controle de acesso e limpeza seletiva.', inline: true },
                { name: '☢️ Infraestrutura', value: 'Nuke, Purgar e Gerenciamento de Canais.', inline: true },
                { name: '📂 Workspace', value: 'Organização, Webhooks e Notas.', inline: true }
              ],
              footer: { text: '⚠️ Apenas Administradores • Operações Privadas' }
            }],
            components: [{
              type: 1,
              components: [{
                type: 3,
                custom_id: "server_category_select",
                options: [
                  { label: "Segurança & Moderação", value: "server_cat_security", description: "Limpeza, Lockdown e Filtros", emoji: { name: "🔒" } },
                  { label: "Infraestrutura", value: "server_cat_infra", description: "Nuke, Purge e Workspace", emoji: { name: "☢️" } },
                  { label: "Workspace & Ferramentas", value: "server_cat_tools", description: "Webhooks, Notas e Exportação", emoji: { name: "📂" } }
                ],
                placeholder: "Selecione a área de atuação..."
              }]
            }]
          }
        });
      }

      if (interaction.type === 3) {
        const cid = interaction.data.custom_id;
        let parts = cid ? cid.split('_') : [];

        if (cid === 'help_menu') {
          const category = interaction.data.values[0];
          let embed = {
            color: 0x6366f1,
            image: { url: 'https://valiantshop.pages.dev/assets/images/bot_banner.jpg' },
            footer: { text: "ValiantShop | Central de Comando" },
            timestamp: new Date().toISOString()
          };

          if (category === 'help_home') {
            embed.title = "🌌 CENTRAL DE COMANDO — VALIANTSHOP";
            embed.description = "Bem-vindo à central de suporte e ferramentas do bot. Utilize o menu abaixo para navegar entre as categorias.";
            embed.thumbnail = { url: 'https://valiantshop.pages.dev/assets/images/bot_logo.png' };
            embed.fields = [
              { name: "🚀 Início Rápido", value: "Selecione uma categoria no menu para ver os comandos disponíveis." },
              { name: "🌐 Links Úteis", value: "[Acesse nosso Site](https://valiantshop.pages.dev)\n[Tabela de Preços](https://valiantshop.pages.dev/tabela)" }
            ];
          } else if (category === 'help_logistics') {
            embed.title = "📦 LOGÍSTICA & PEDIDOS";
            embed.description = "Controle o fluxo financeiro e o status das encomendas.";
            embed.fields = [
              { name: "`/balance`", value: "📊 Veja o saldo total e lucro das últimas 24h.", inline: true },
              { name: "`/resumo`", value: "📋 Relatório detalhado de pedidos e valores.", inline: true },
              { name: "`/cliente`", value: "👤 Consulte o histórico e gastos de um cliente.", inline: true }
            ];
          } else if (category === 'help_tools') {
            embed.title = "🛠️ FERRAMENTAS & ESTOQUE";
            embed.description = "Utilitários para gestão de preços e inventário.";
            embed.fields = [
              { name: "`/tabela`", value: "ℹ️ Exibe a tabela de preços oficial.", inline: true },
              { name: "`/salas_estoque`", value: "📦 Lista o conteúdo das salas de estoque.", inline: true },
              { name: "`/server`", value: "💾 Comandos de utilidade do servidor.", inline: true }
            ];
          } else if (category === 'help_settings') {
            embed.title = "⚙️ CONFIGURAÇÕES DO BOT";
            embed.description = "Ajuste a presença e identidade do bot.";
            embed.fields = [
              { name: "`/config_bot`", value: "🛠️ Abre o painel de configurações gerais.", inline: true }
            ];
          } else if (category === 'help_system') {
            embed.title = "📄 PERSONALIZAÇÃO DO SISTEMA";
            embed.description = "Configure como as mensagens são exibidas.";
            embed.fields = [
              { name: "`/editar_embed`", value: "🎨 Personalize textos e cores das notificações.", inline: true }
            ];
          }

          return jsonResponse({ type: 7, data: { embeds: [embed] } });
        }

        if (cid && cid.startsWith('custommodal_')) {
           const idToken = await getFirebaseToken(env);
           const embedsDoc = await getFirestoreDoc(env, 'bot_config', 'embeds', idToken);
           if (embedsDoc && embedsDoc.fields) {
             let targetModal = null;
             for (const type of Object.keys(embedsDoc.fields)) {
               const f = embedsDoc.fields[type].mapValue.fields;
               if (f.modals && f.modals.arrayValue && f.modals.arrayValue.values) {
                 const modals = f.modals.arrayValue.values.map(v => ({
                   trigger_id: v.mapValue.fields.trigger_id.stringValue,
                   title: v.mapValue.fields.title.stringValue,
                   questions: v.mapValue.fields.questions.stringValue,
                   log_channel: v.mapValue.fields.log_channel.stringValue
                 }));
                 targetModal = modals.find(m => m.trigger_id === interaction.data.custom_id);
                 if (targetModal) break;
               }
             }
             if (targetModal) {
               const qList = targetModal.questions.split(',').map(q => q.trim()).filter(q => q.length > 0);
               const components = qList.map((q, i) => ({ type: 1, components: [{ type: 4, custom_id: `q_${i}`, label: q.substring(0, 45), style: 1, required: true }] })).slice(0, 5);
               return jsonResponse({ type: 9, data: { title: targetModal.title.substring(0, 45), custom_id: `submitmodal_${interaction.data.custom_id}`, components } });
             }
           }
        }


        // ─── Handlers das Categorias do /server ───────────────────────────────
        if (interaction.data.custom_id === 'server_category_select') {
          const cat = interaction.data.values[0];
          let embed, components = [];
          
          if (cat === 'server_cat_security') {
            embed = { title: "🔒 Segurança & Moderação", description: "Ações de limpeza e controle de acesso.", color: 0x3498DB };
            components = [
              { type: 1, components: [
                { type: 2, label: 'Limpar Canal', style: 2, custom_id: 'server_action_clear' },
                { type: 2, label: 'Limpar Usuário', style: 2, custom_id: 'server_action_clearuser' },
                { type: 2, label: 'Alternar Lockdown', style: 4, custom_id: 'server_action_lockdown' }
              ]},
              { type: 1, components: [{ type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }] }
            ];
          } else if (cat === 'server_cat_infra') {
            embed = { title: "☢️ Infraestrutura", description: "Gerenciamento pesado de canais e categorias.", color: 0xE74C3C };
            components = [
              { type: 1, components: [
                { type: 2, label: 'Nuke Canal', style: 4, custom_id: 'server_action_nuke' },
                { type: 2, label: 'Purgar Categoria', style: 4, custom_id: 'server_action_purge' },
                { type: 2, label: 'Sincronizar Permissões', style: 2, custom_id: 'server_action_sync_perms' }
              ]},
              { type: 1, components: [{ type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }] }
            ];
          } else if (cat === 'server_cat_tools') {
            embed = { title: "📂 Workspace & Ferramentas", description: "Utilitários para desenvolvedor e organização.", color: 0xF1C40F };
            components = [
              { type: 1, components: [
                { type: 2, label: 'Refazer Webhooks', style: 2, custom_id: 'server_action_rewebhooks' },
                { type: 2, label: 'Exportar Chat', style: 2, custom_id: 'server_action_export' },
                { type: 2, label: 'Nota do Canal', style: 2, custom_id: 'server_action_note' }
              ]},
              { type: 1, components: [
                { type: 2, label: 'Sync Ambiente (DEV/PROD)', style: 1, custom_id: 'server_action_env' },
                { type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }
              ]}
            ];
          }
          
          return jsonResponse({ type: 7, data: { embeds: [embed], components } });
        }

        if (interaction.data.custom_id === 'server_action_lockdown') {
          ctx.waitUntil((async () => {
            const channel = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
            const everyoneRole = interaction.guild_id;
            const currentOverwrites = channel.permission_overwrites || [];
            const everyoneIdx = currentOverwrites.findIndex(o => o.id === everyoneRole);
            
            let newOverwrites = [...currentOverwrites];
            let isLocked = false;
            
            if (everyoneIdx > -1) {
              const ow = currentOverwrites[everyoneIdx];
              const deny = BigInt(ow.deny || "0");
              const sendMsg = 1n << 11n; // SEND_MESSAGES
              if ((deny & sendMsg) === sendMsg) {
                // Unlock
                newOverwrites[everyoneIdx].deny = (deny & ~sendMsg).toString();
                isLocked = false;
              } else {
                // Lock
                newOverwrites[everyoneIdx].deny = (deny | sendMsg).toString();
                isLocked = true;
              }
            } else {
              newOverwrites.push({ id: everyoneRole, type: 0, allow: "0", deny: (1n << 11n).toString() });
              isLocked = true;
            }
            
            await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ permission_overwrites: newOverwrites }) });
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: isLocked ? "🔒 Canal trancado com sucesso!" : "🔓 Canal destrancado com sucesso!" }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id === 'server_action_sync_perms') {
          ctx.waitUntil((async () => {
             const channel = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
             if (channel.parent_id) {
               const category = await fetch(`https://discord.com/api/v10/channels/${channel.parent_id}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
               await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ permission_overwrites: category.permission_overwrites }) });
               await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "✅ Permissões sincronizadas com a categoria!" }) });
             }
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id === 'server_action_rewebhooks') {
          ctx.waitUntil((async () => {
            const webhooks = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/webhooks`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
            for (const wh of webhooks) { await fetch(`https://discord.com/api/v10/webhooks/${wh.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }); }
            await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/webhooks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ name: 'ValiantShop Manager' }) });
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "🔄 Webhooks do canal refeitos com sucesso!" }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id === 'server_action_export') {
           ctx.waitUntil((async () => {
             const res = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages?limit=100`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
             if (res.ok) {
               const msgs = await res.json();
               const data = JSON.stringify(msgs, null, 2);
               // Send as file via webhook or message
               await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages`, { method: 'POST', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "📄 Exportação do canal concluída (Últimas 100 mensagens):", files: [{ name: 'export.json', data: btoa(data) }] }) });
             }
           })());
           return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id.startsWith('server_env_')) {
          const mode = interaction.data.custom_id.split('_')[2];
          ctx.waitUntil((async () => {
            const channel = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
            let name = channel.name.replace('🛠️-', '').replace('🚀-', '');
            name = (mode === 'dev' ? '🛠️-' : '🚀-') + name;
            await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ name }) });
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `✅ Ambiente alterado para **${mode.toUpperCase()}**!` }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id === 'server_back_main') {
          return jsonResponse({ type: 7, data: { embeds: [{ title: '🛡️ Central de Comando ValiantShop', description: 'Bem-vindo ao centro de operações privadas...', color: 0xef4444 }], components: [{ type: 1, components: [{ type: 3, custom_id: "server_category_select", options: [{ label: "Segurança & Moderação", value: "server_cat_security", emoji: { name: "🔒" } }, { label: "Infraestrutura", value: "server_cat_infra", emoji: { name: "☢️" } }, { label: "Workspace & Ferramentas", value: "server_cat_tools", emoji: { name: "📂" } }], placeholder: "Selecione a área de atuação..." }] }] } });
        }

        if (interaction.data.custom_id === 'server_action_clearuser') {
          return jsonResponse({ type: 9, data: { title: '🧹 Limpar Usuário', custom_id: 'modal_server_clearuser', components: [
            { type: 1, components: [{ type: 4, custom_id: 'user_id', label: 'ID do Usuário', placeholder: 'Cole o ID aqui...', style: 1, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'server_action_note') {
          return jsonResponse({ type: 9, data: { title: '📝 Nota do Canal', custom_id: 'modal_server_note', components: [
            { type: 1, components: [{ type: 4, custom_id: 'note', label: 'Nova Nota (Tópico)', style: 2, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'server_action_env') {
          return jsonResponse({ type: 4, data: { flags: 64, content: "Selecione o ambiente para este canal:", components: [{ type: 1, components: [{ type: 2, label: 'Modo DEV 🛠️', style: 1, custom_id: 'server_env_dev' }, { type: 2, label: 'Modo PROD 🚀', style: 3, custom_id: 'server_env_prod' }] }] } });
        }

        // ─── Handlers Legados e Replicados ────────────────────────────────────
        if (interaction.data.custom_id === 'server_action_clear') {
          return jsonResponse({ type: 9, data: { title: '🧹 Limpar Mensagens', custom_id: 'modal_server_clear', components: [
            { type: 1, components: [{ type: 4, custom_id: 'quantidade', label: 'Quantas mensagens apagar? (1–100)', placeholder: 'Ex: 50', style: 1, min_length: 1, max_length: 3, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'server_action_nuke') {
          return jsonResponse({ type: 9, data: { title: '☢️ Nuke Canal', custom_id: 'modal_server_nuke', components: [
            { type: 1, components: [{ type: 4, custom_id: 'confirmar', label: 'Digite CONFIRMAR para prosseguir', placeholder: 'CONFIRMAR', style: 1, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'server_action_purge') {
          return jsonResponse({ type: 9, data: { title: '🗑️ Purgar Categoria', custom_id: 'modal_server_purge', components: [
            { type: 1, components: [{ type: 4, custom_id: 'cat_id', label: 'ID da Categoria', placeholder: 'Cole aqui o ID da categoria...', style: 1, min_length: 15, max_length: 20, required: true }] }
          ] } });
        }

        parts = interaction.data.custom_id ? interaction.data.custom_id.split('_') : [];

        if (interaction.data.custom_id === "config_category_select") {
          const category = interaction.data.values[0];
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
            
            let embed, components;
            
            if (category === 'config_notif') {
              embed = {
                title: "📢 Configurações de Notificação",
                description: "Gerencie como o bot se comunica com a equipe e registra atividades.",
                color: 0x3b82f6,
                fields: [
                  { name: "Status Atual", value: `🔔 Notificações: ${s.notif ? '✅' : '❌'}\n📣 Pings: ${s.pings ? '✅' : '❌'}\n📺 Logs: <#${s.logChannel || '0'}>` }
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
                title: "👤 Perfil & Identidade",
                description: "Personalize a presença do bot no servidor.",
                color: 0xa855f7,
                fields: [
                  { name: "Instruções", value: "Clique nos botões abaixo para abrir os formulários de alteração de identidade." }
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
                title: "🛡️ Configurações de Sistema",
                description: "Controles de segurança e manutenção global.",
                color: 0xef4444,
                fields: [
                  { name: "Modo Manutenção", value: s.maintenance ? "⚠️ O bot está em modo de manutenção. Apenas administradores podem interagir." : "✅ O bot está operando normalmente." }
                ]
              };
              components = [{
                type: 1,
                components: [
                  { type: 2, label: s.maintenance ? 'Desativar Manutenção' : 'Ativar Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' },
                  { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }
                ]
              }];
            }
            
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ embeds: [embed], components })
            });
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id === 'config_edit_identity') {
          return jsonResponse({ type: 9, data: { title: 'Editar Identidade', custom_id: 'modal_bot_identity', components: [
            { type: 1, components: [{ type: 4, custom_id: 'username', label: 'Nome do Bot', style: 1, min_length: 2, max_length: 32, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'config_edit_avatar') {
          return jsonResponse({ type: 9, data: { title: 'Alterar Avatar', custom_id: 'modal_bot_avatar', components: [
            { type: 1, components: [{ type: 4, custom_id: 'avatar', label: 'URL da Imagem', placeholder: 'https://...', style: 1, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'config_edit_status') {
          return jsonResponse({ type: 9, data: { title: 'Definir Status', custom_id: 'modal_bot_status', components: [
            { type: 1, components: [{ type: 4, custom_id: 'status', label: 'Mensagem de Status', style: 1, max_length: 128, required: true }] },
            { type: 1, components: [{ type: 4, custom_id: 'type', label: 'Tipo (0: Jogando, 1: Transmitindo, 2: Ouvindo, 3: Assistindo)', placeholder: '0', style: 1, min_length: 1, max_length: 1, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'config_set_logchannel') {
          return jsonResponse({ type: 9, data: { title: 'Canal de Logs', custom_id: 'modal_config_logchannel', components: [
            { type: 1, components: [{ type: 4, custom_id: 'val', label: 'ID do Canal', style: 1, min_length: 15, max_length: 20, required: true }] }
          ] } });
        }

        if (interaction.data.custom_id === 'back_to_config') {
          ctx.waitUntil((async () => {
             const embed = {
               title: "⚙️ Central de Configurações - ValiantShop",
               description: "Selecione uma categoria abaixo para ajustar as funcionalidades do bot.",
               color: 0x2b2d31,
               fields: [
                 { name: "📢 Notificações", value: "Logs, Pings e Canais de aviso.", inline: true },
                 { name: "👤 Identidade", value: "Nome, Avatar, Bio e Status do bot.", inline: true },
                 { name: "🛡️ Sistema", value: "Manutenção e permissões críticas.", inline: true }
               ],
               footer: { text: "ValiantShop • Gestão de Infraestrutura" }
             };
             const components = [{
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
             }];
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
               method: 'PATCH',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ embeds: [embed], components })
             });
          })());
          return jsonResponse({ type: 6 });
        }

        const type = parts[parts.length - 1];
        const orderId = parts.slice(2).join('_');

        if (interaction.data.custom_id === 'help_tools_info') {
          return jsonResponse({
            type: 4,
            data: {
              flags: 64,
              embeds: [{
                title: "📖 Guia de Variáveis & Ferramentas",
                description: "Use estas variáveis nos campos de texto para exibir dados dinâmicos das encomendas.",
                color: 0x2ECC71,
                fields: [
                  { name: "👤 Cliente", value: "`{treinador}`: Nick do jogador\n`{discord}`: Tag do Discord", inline: true },
                  { name: "👾 Pokémon", value: "`{pokemon}`: Nome da espécie\n`{sprite}`: Imagem do Pokémon", inline: true },
                  { name: "📊 Atributos", value: "`{ivs}`: Formato F5/F6\n`{ivs_detalhe}`: IVs faltantes\n`{genero}`: M/F/N", inline: true },
                  { name: "🧬 Genética", value: "`{ability}`: Habilidade\n`{egg}`: Egg Groups\n`{b/c}`: Breed/Castrado", inline: true },
                  { name: "💰 Financeiro", value: "`{total}`: Valor total (ex: 80k)\n`{caixa}`: Lucro total acumulado", inline: true },
                  { name: "⚔️ Competitivo", value: "`{evs}`: Distribuição de EVs\n`{item}`: Item equipado\n`{moveset}`: Lista de ataques\n`{level}`: Nível alvo\n`{ppmax}`: PP Max Sim/Não", inline: false },
                  { name: "💡 Dica", value: "O campo **Canal** deve conter o ID numérico (Ex: 123456789).", inline: false }
                ]
              }]
            }
          });
        }

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
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL (Opcional)', placeholder: 'https://...', style: 1, required: false }] }
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
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL', value: btn.url || '', style: 1, required: false }] }
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

        if (parts[0] === 'menu' && parts[1] === 'selects') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { components: buildSelectDeleteMenu(type, cfg.selects || []) } });
           return jsonResponse({ type: 7, data: { components: buildSelectButtons(type, cfg.selects || []) } });
        }
        
        if (parts[0] === 'editselect' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Menu Suspenso', custom_id: `modalselect_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'placeholder', label: 'Texto Padrão (Placeholder)', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado (Ação)', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'options', label: 'Opções (separadas por vírgula)', placeholder: 'Opção 1, Opção 2', style: 2, required: true }] }
           ]}});
        }
        
        if (parts[0] === 'editselect' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const s = cfg.selects[index];
           const optionsStr = s.options.map(o => o.label).join(', ');
           return jsonResponse({ type: 9, data: { title: 'Editar Menu Suspenso', custom_id: `modalselect_edit_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'placeholder', label: 'Texto Padrão', value: s.placeholder, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado', value: s.custom_id, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'options', label: 'Opções (separadas por vírgula)', value: optionsStr, style: 2, required: true }] }
           ]}});
        }
        
        if (parts[0] === 'editselect' && parts[1] === 'delete' && parts[2] === 'select') {
           const idToken = await getFirebaseToken(env);
           const index = parseInt(interaction.data.values[0]);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           cfg.selects.splice(index, 1);
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           return jsonResponse({ type: 7, data: { components: buildSelectButtons(type, cfg.selects) } });
        }

        if (parts[0] === 'menu' && parts[1] === 'modals') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { components: buildModalDeleteMenu(type, cfg.modals || []) } });
           return jsonResponse({ type: 7, data: { components: buildModalButtons(type, cfg.modals || []) } });
        }
        
        if (parts[0] === 'editmodal' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Modal', custom_id: `modalconfig_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'title', label: 'Título do Modal', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'trigger_id', label: 'ID Gatilho (comece com custommodal_)', placeholder: 'custommodal_ticket', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'questions', label: 'Perguntas (separadas por vírgula, máx 5)', placeholder: 'Nome, Idade, Email', style: 2, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'log_channel', label: 'Canal de Respostas (Log ID)', style: 1, required: true }] }
           ]}});
        }
        
        if (parts[0] === 'editmodal' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const m = cfg.modals[index];
           return jsonResponse({ type: 9, data: { title: 'Editar Modal', custom_id: `modalconfig_edit_${index}_${type}`, components: [
              { type: 1, components: [{ type: 4, custom_id: 'title', label: 'Título do Modal', value: m.title, style: 1, required: true }] },
              { type: 1, components: [{ type: 4, custom_id: 'trigger_id', label: 'ID Gatilho (comece com custommodal_)', value: m.trigger_id, style: 1, required: true }] },
              { type: 1, components: [{ type: 4, custom_id: 'questions', label: 'Perguntas (separadas por vírgula)', value: m.questions, style: 2, required: true }] },
              { type: 1, components: [{ type: 4, custom_id: 'log_channel', label: 'Canal de Logs', value: m.log_channel, style: 1, required: true }] }
            ]}});
         }
         
         if (parts[0] === 'editmodal' && parts[1] === 'delete' && parts[2] === 'select') {
            const idToken = await getFirebaseToken(env);
            const index = parseInt(interaction.data.values[0]);
            const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
            const cfg = JSON.parse(draftDoc.fields.config.stringValue);
            cfg.modals.splice(index, 1);
            await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
            return jsonResponse({ type: 7, data: { components: buildModalButtons(type, cfg.modals) } });
         }

        if (cid === 'config_toggle_notif' || cid === 'config_toggle_pings' || cid === 'config_toggle_maint') {
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
            
            const field = interaction.data.custom_id === "config_toggle_notif" ? "notif" : (interaction.data.custom_id === "config_toggle_pings" ? "pings" : "maintenance");
            s[field] = !s[field];
            
            await updateFirestore(env, 'bot_config', 'settings', Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v.toString() }])), idToken);
            
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
                 const res = await fetch(`https://discord.com/api/v10/channels/${ARCHIVE_CHANNEL_ID}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: '📦 Encomenda Arquivada', embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else if (parts[1] !== 'Entregue' && interaction.channel_id === ARCHIVE_CHANNEL_ID) {
                 const targetChannelId = cfg.channel || DEFAULT_EMBEDS['notificacao'].channel;
                 const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
                 if (res.ok) {
                   const newMsg = await res.json();
                   newMessageId = newMsg.id;
                   await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                 }
               } else {
                 await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${interaction.message.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
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

        if (cid === 'modal_bot_identity' || cid === 'modal_bot_avatar' || cid === 'modal_bot_status') {
           ctx.waitUntil((async () => {
             const body = {};
             if (cid === 'modal_bot_identity') {
               body.username = getVal('username');
             }
             if (cid === 'modal_bot_avatar') {
               const avatarUrl = getVal('avatar');
               const res = await fetch(avatarUrl);
               const buf = await res.arrayBuffer();
               const type = res.headers.get('content-type');
               const base64 = btoa(Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join(''));
               body.avatar = `data:${type};base64,${base64}`;
             }
             
             if (body.username || body.avatar) {
               await fetch('https://discord.com/api/v10/users/@me', {
                 method: 'PATCH',
                 headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
                 body: JSON.stringify(body)
               });
             }
             
             if (cid === 'modal_bot_status') {
               const status = getVal('status');
               const type = parseInt(getVal('type'));
               await updateFirestore(env, 'bot_config', 'settings', { status: { stringValue: status }, statusType: { integerValue: type } }, idToken);
             }
             
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
               method: 'PATCH', 
               headers: { 'Content-Type': 'application/json' }, 
               body: JSON.stringify({ content: "✅ Perfil atualizado com sucesso! Pode demorar alguns minutos para refletir em todos os servidores.", embeds: [], components: [] }) 
             });
           })());
           return jsonResponse({ type: 6 });
        }

        // ─── Handlers dos Modais do /server ───────────────────────────────────
        if (cid === 'modal_server_clear') {
          const amount = parseInt(getVal('quantidade'));
          if (isNaN(amount) || amount < 1 || amount > 100) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Quantidade inválida! Escolha entre 1 e 100." } });
          
          ctx.waitUntil((async () => {
            const res = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages?limit=${amount}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
            if (res.ok) {
              const msgs = await res.json();
              const ids = msgs.map(m => m.id);
              if (ids.length > 0) {
                await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ messages: ids }) });
              }
            }
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: `🧹 Iniciando limpeza de ${amount} mensagens...` } });
        }

        if (cid === 'modal_server_nuke') {
          const confirm = getVal('confirmar').toUpperCase();
          if (confirm !== 'CONFIRMAR') return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Confirmação incorreta! Operação cancelada." } });
          
          ctx.waitUntil((async () => {
            const channel = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
            const newChannel = await fetch(`https://discord.com/api/v10/guilds/${interaction.guild_id}/channels`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ name: channel.name, type: channel.type, topic: channel.topic, parent_id: channel.parent_id, permission_overwrites: channel.permission_overwrites, position: channel.position }) }).then(r => r.json());
            if (newChannel.id) {
              await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
              await fetch(`https://discord.com/api/v10/channels/${newChannel.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: `☢️ **Canal Recriado** por <@${interaction.member.user.id}>` }) });
            }
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: "☢️ Iniciando reconstrução do canal..." } });
        }

        if (cid === 'modal_server_purge') {
          const catId = getVal('cat_id');
          ctx.waitUntil((async () => {
            const guildChannels = await fetch(`https://discord.com/api/v10/guilds/${interaction.guild_id}/channels`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }).then(r => r.json());
            const targets = Array.isArray(guildChannels) ? guildChannels.filter(c => c.parent_id === catId) : [];
            for (const c of targets) {
              await fetch(`https://discord.com/api/v10/channels/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
            }
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: `🗑️ Iniciando purga da categoria \`${catId}\`...` } });
        }

        if (cid === 'modal_server_clearuser') {
          const userId = getVal('user_id');
          ctx.waitUntil((async () => {
            const res = await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages?limit=100`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
            if (res.ok) {
              const msgs = await res.json();
              const ids = msgs.filter(m => m.author.id === userId).map(m => m.id);
              if (ids.length > 0) {
                await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ messages: ids }) });
              }
            }
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: `🧹 Limpando mensagens de <@${userId}> (últimas 100 do canal)...` } });
        }

        if (cid === 'modal_server_note') {
          const note = getVal('note');
          ctx.waitUntil(fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ topic: note }) }));
          return jsonResponse({ type: 4, data: { flags: 64, content: `📝 Tópico do canal atualizado para: **${note}**` } });
        }
        const mockOrder = { pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User' };

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
                }}})) }},
                selects: { arrayValue: { values: (cfg.selects || []).map(s => ({ mapValue: { fields: {
                  placeholder: { stringValue: s.placeholder },
                  custom_id: { stringValue: s.custom_id },
                  options: { stringValue: s.options.map(o => o.label).join(',') }
                }}})) }},
                modals: { arrayValue: { values: (cfg.modals || []).map(m => ({ mapValue: { fields: {
                  title: { stringValue: m.title },
                  trigger_id: { stringValue: m.trigger_id },
                  questions: { stringValue: m.questions },
                  log_channel: { stringValue: m.log_channel }
                }}})) }}
              }}}};
              await updateFirestore(env, 'bot_config', 'embeds', fields, idToken);
              
              // Automatic patch original message
              ctx.waitUntil((async () => {
                const cfg = JSON.parse(draftDoc.fields.config.stringValue);
                const embed = buildEmbedFromConfig(cfg, mockOrder);
                const channelId = cfg.channel || DEFAULT_EMBEDS[type]?.channel;
                
                // Fetch last message from channel to find our official embed
                const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
                if (res.ok) {
                   const msgs = await res.json();
                   const target = msgs.find(m => m.author.id === (interaction.application_id || '1498061638941806833'));
                   if (target) {
                      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${target.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
                        body: JSON.stringify({ content: cfg.content, embeds: [embed], components: buildMainMenuComponents('PREVIEW', cfg.components, cfg.selects) })
                      });
                   }
                }
              })());

              return jsonResponse({ type: 7, data: { content: `✅ Configuração salva e sincronizada!`, embeds: [], components: [] } });
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
           const val = getVal('val');
           ctx.waitUntil((async () => {
             const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
             const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
             s.logChannel = val;
             await updateFirestore(env, 'bot_config', 'settings', Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v }])), idToken);
             
             const cfg = await getEmbedConfig(env, 'config', idToken);
             const desc = `${cfg.description}\n\n` +
               `🔔 **Notificações:** ${s.notif ? '✅ Ativo' : '❌ Inativo'}\n` +
               `📣 **Pings de Equipe:** ${s.pings ? '✅ Ativo' : '❌ Inativo'}\n` +
               `🛠️ **Manutenção:** ${s.maintenance ? '⚠️ Ativado' : '✅ Normal'}\n` +
               `📺 **Canal de Logs:** <#${val}>`;
             const embed = buildEmbedFromConfig(cfg, {}); embed.description = desc;
             const components = [
               { type: 1, components: [
                 { type: 2, label: '🔔 Notificações', style: s.notif ? 3 : 4, custom_id: 'config_toggle_notif' },
                 { type: 2, label: '📣 Pings', style: s.pings ? 3 : 4, custom_id: 'config_toggle_pings' },
                 { type: 2, label: '🛠️ Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' }
               ]},
               { type: 1, components: [
                 { type: 2, label: '📺 Set Log Channel', style: 2, custom_id: 'config_set_logchannel' },
                 { type: 2, label: '⬅️ Voltar', style: 2, custom_id: 'menu_back_home' }
               ]}
             ];
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed], components } ) });
           })());
           return jsonResponse({ type: 6 });
        }

        if (cid.startsWith('submitmodal_')) {
           const trigger_id = cid.substring('submitmodal_'.length);
           ctx.waitUntil((async () => {
             const idToken = await getFirebaseToken(env);
             const embedsDoc = await getFirestoreDoc(env, 'bot_config', 'embeds', idToken);
             let targetModal = null;
             for (const type of Object.keys(embedsDoc.fields)) {
               const f = embedsDoc.fields[type].mapValue.fields;
               if (f.modals && f.modals.arrayValue && f.modals.arrayValue.values) {
                 const modals = f.modals.arrayValue.values.map(v => ({
                   trigger_id: v.mapValue.fields.trigger_id.stringValue,
                   title: v.mapValue.fields.title.stringValue,
                   questions: v.mapValue.fields.questions.stringValue,
                   log_channel: v.mapValue.fields.log_channel.stringValue
                 }));
                 targetModal = modals.find(m => m.trigger_id === trigger_id);
                 if (targetModal) break;
               }
             }
             if (targetModal) {
               const qList = targetModal.questions.split(',').map(q => q.trim()).filter(q => q.length > 0).slice(0, 5);
               const fields = qList.map((q, i) => ({ name: q, value: getVal(`q_${i}`) || 'N/A', inline: false }));
               const embed = { title: targetModal.title, color: 0x3498DB, author: { name: interaction.member?.user?.username || 'Usuário' }, fields };
               await fetch(`https://discord.com/api/v10/channels/${targetModal.log_channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ embeds: [embed] }) });
               await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 4, data: { content: "✅ Resposta enviada com sucesso!", flags: 64 } }) });
             }
           })());
           return jsonResponse({ type: 5, data: { flags: 64 } });
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

        if (cid.startsWith('modalselect_')) {
           const parts = cid.split('_'); const action = parts[1]; const type = parts.pop();
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (!cfg.selects) cfg.selects = [];
           
           const optionsRaw = getVal('options').split(',');
           const options = optionsRaw.map(o => ({ label: o.trim(), value: o.trim() })).filter(o => o.label.length > 0);
           
           const newSelect = { placeholder: getVal('placeholder'), custom_id: getVal('custom_id'), options };
           if (action === 'add') cfg.selects.push(newSelect);
           else { const index = parseInt(parts[2]); cfg.selects[index] = newSelect; }
           
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           return jsonResponse({ type: 7, data: { embeds: [preview], components: buildSelectButtons(type, cfg.selects) } });
        }

        if (cid.startsWith('modalconfig_')) {
           const parts = cid.split('_'); const action = parts[1]; const type = parts.pop();
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           if (!cfg.modals) cfg.modals = [];
           
           const newModal = { title: getVal('title'), trigger_id: getVal('trigger_id'), questions: getVal('questions'), log_channel: getVal('log_channel') };
           if (action === 'add') cfg.modals.push(newModal);
           else { const index = parseInt(parts[2]); cfg.modals[index] = newModal; }
           
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           return jsonResponse({ type: 7, data: { embeds: [preview], components: buildModalButtons(type, cfg.modals) } });
        }

         if (cid === 'modal_bot_identity') {
            const username = getVal('username');
            ctx.waitUntil((async () => {
              await fetch(`https://discord.com/api/v10/users/@me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ username }) });
              await updateFirestore(env, 'bot_config', 'settings', { username: { stringValue: username } }, idToken);
            })());
            return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Nome do bot atualizado para **${username}**!` } });
         }

         if (cid === 'modal_bot_avatar') {
            const avatarUrl = getVal('avatar');
            ctx.waitUntil((async () => {
              const res = await fetch(avatarUrl);
              const blob = await res.blob();
              const reader = new FileReader();
              const base64 = await new Promise((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result);
                r.readAsDataURL(blob);
              });
              await fetch(`https://discord.com/api/v10/users/@me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ avatar: base64 }) });
              await updateFirestore(env, 'bot_config', 'settings', { avatar: { stringValue: avatarUrl } }, idToken);
            })());
            return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Avatar do bot atualizado!` } });
         }

         if (cid === 'modal_bot_status') {
            const status = getVal('status');
            const typeStatus = parseInt(getVal('type')) || 0;
            ctx.waitUntil((async () => {
              await fetch(`https://discord.com/api/v10/gateway/bot`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } }); // Not enough to set status, usually requires WSS, but we can store it
              await updateFirestore(env, 'bot_config', 'settings', { status: { stringValue: status }, statusType: { integerValue: typeStatus } }, idToken);
              // For Workers, we rely on the next interaction or a scheduled task to 'show' status if using a library, 
              // but here we at least persist it. 
            })());
            return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Status definido para: **${status}**` } });
         }

        if (cid.startsWith('modaleditor_')) {
           const parts = cid.split('_'); const action = parts[1]; const type = parts.pop();
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);

           const valRaw = getVal('val');
           const validation = validateVars(valRaw, type);
           const val = validation.cleaned;
           let warning = validation.hasProhibited ? '⚠️ **AVISO:** Algumas variáveis competitivas foram removidas por serem incompatíveis com este tipo de notificação. Elas ficarão ocultas para garantir a limpeza do log.' : '';

           if (action === 'field') {
              const index = parseInt(parts[2]); 
              cfg.fields[index] = { name: getVal('name'), value: val, inline: getVal('inline').toUpperCase() === 'S' };
           } else if (action === 'channel') {
              cfg.channel = val;
           } else {
              if (action === 'color') cfg.color = '0x' + val.replace('#', '').toUpperCase();
              else cfg[action] = val;
           }
           
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           
           if (action === 'field') return jsonResponse({ type: 7, data: { content: warning, embeds: [preview], components: buildFieldButtons(type, cfg.fields) } });
           if (action === 'channel') return jsonResponse({ type: 4, data: { flags: 64, content: warning || `✅ Canal de envio atualizado para \`${val}\`!` } });
           return jsonResponse({ type: 7, data: { content: warning || cfg.content, embeds: [preview], components: buildEmbedEditorButtons(type) } });
        }
      }
    }
    return new Response('Unauthorized', { status: 401 });
  },
};
