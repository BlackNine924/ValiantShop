/**
 * ValiantShop - Discord Bot Worker
 * Cloudflare Workers implementation
 */

const DEFAULT_EMBEDS = {
  notificacao: {
    title: '📦 NOVA ENCOMENDA REGISTRADA 📦',
    description: '<@USER>, você tem um novo pedido aguardando processamento.',
    color: '0x3B82F6',
    banner: 'https://wallpaperaccess.com/full/21035.jpg',
    footer: 'ValiantShop — Central de Logística',
    author: 'Aviso de Venda',
    thumbnail: 'https://valiantshop.pages.dev/assets/images/bot_logo.png',
    content: '📦 Novo pedido recebido!',
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
    ],
    selects: [
      {
        placeholder: 'Selecione uma categoria...',
        custom_id: 'help_menu',
        options: [
          { label: '🏠 Início', value: 'help_home', description: 'Voltar para a tela inicial.' },
          { label: '📦 Logística & Pedidos', value: 'help_logistics', description: 'Comandos de balanço, resumo e histórico.' },
          { label: '🛠️ Ferramentas & Estoque', value: 'help_tools', description: 'Tabela de preços, salas de estoque e utilitários.' },
          { label: '⚙️ Configurações', value: 'help_settings', description: 'Ajustes de identidade, avatar e status.' },
          { label: '📄 Personalização', value: 'help_system', description: 'Edição de embeds, modais e botões.' }
        ]
      }
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
    body: JSON.stringify({ structuredQuery: query })
  });
  return res.ok ? res.json() : [];
}

function replacePlaceholders(text, order) {
  if (!text) return '';
  return text
    .replace(/{treinador}/g, order.playerNick || 'N/A')
    .replace(/{discord}/g, order.discordNick || 'N/A')
    .replace(/{pokemon}/g, order.pokemon || 'N/A')
    .replace(/{sprite}/g, `https://img.pokemondb.net/sprites/home/normal/${(order.pokemon || 'pikachu').toLowerCase()}.png`)
    .replace(/{ivs}/g, order.ivs || 'N/A')
    .replace(/{ability}/g, order.ability || 'N/A')
    .replace(/{genero}/g, order.gender || 'N/A')
    .replace(/{total}/g, (order.totalPrice || 0).toLocaleString() + 'k')
    .replace(/{obs}/g, order.observations || 'N/A')
    .replace(/{egg}/g, order.eggGroups || 'N/A')
    .replace(/{evs}/g, order.evs || 'N/A')
    .replace(/{item}/g, order.item || 'N/A')
    .replace(/{level}/g, order.level || 'N/A')
    .replace(/{moveset}/g, order.moveset || 'N/A');
}

function buildEmbedFromConfig(cfg, order) {
  return {
    title: replacePlaceholders(cfg.title, order),
    description: replacePlaceholders(cfg.description, order),
    color: parseInt(cfg.color || '0x3B82F6'),
    image: cfg.banner ? { url: cfg.banner } : null,
    thumbnail: cfg.thumbnail ? { url: replacePlaceholders(cfg.thumbnail, order) } : null,
    footer: { text: replacePlaceholders(cfg.footer, order) },
    author: cfg.author ? { name: replacePlaceholders(cfg.author, order) } : null,
    fields: (cfg.fields || []).map(f => ({
      name: replacePlaceholders(f.name, order),
      value: replacePlaceholders(f.value, order),
      inline: f.inline
    }))
  };
}

function buildFinalComponents(cfg) {
  const rows = [];
  if (cfg.selects && cfg.selects.length > 0) {
    cfg.selects.forEach(s => {
      rows.push({
        type: 1,
        components: [{
          type: 3,
          custom_id: s.custom_id,
          placeholder: s.placeholder,
          options: s.options.map(o => ({
            label: o.label.substring(0, 100),
            value: o.value.substring(0, 100),
            description: o.description ? o.description.substring(0, 100) : undefined
          })).slice(0, 25)
        }]
      });
    });
  }
  if (cfg.components && cfg.components.length > 0) {
    const btns = cfg.components.map((b, i) => {
      let btn = { type: 2, label: b.label.substring(0, 80), style: b.style };
      if (b.emoji) btn.emoji = b.emoji;
      if (b.style === 5) btn.url = b.url;
      else btn.custom_id = b.custom_id || `custom_btn_${i}`;
      return btn;
    });
    for (let i = 0; i < btns.length; i += 5) {
      rows.push({ type: 1, components: btns.slice(i, i + 5) });
    }
  }
  return rows.slice(0, 5);
}

async function getEmbedConfig(env, type, idToken) {
  const doc = await getFirestoreDoc(env, 'bot_config', 'embeds', idToken);
  let cfg = DEFAULT_EMBEDS[type] || { fields: [], components: [], selects: [], modals: [] };
  if (doc && doc.fields && doc.fields[type]) {
    const f = doc.fields[type].mapValue.fields;
    cfg = {
      ...cfg,
      title: f.title?.stringValue || cfg.title,
      description: f.description?.stringValue || cfg.description,
      color: f.color?.stringValue || cfg.color,
      author: f.author?.stringValue || cfg.author,
      thumbnail: f.thumbnail?.stringValue || cfg.thumbnail,
      banner: f.banner?.stringValue || cfg.banner,
      footer: f.footer?.stringValue || cfg.footer,
      content: f.content?.stringValue || cfg.content,
      channel: f.channel?.stringValue || cfg.channel,
      fields: f.fields?.arrayValue?.values?.map(v => ({
        name: v.mapValue.fields.name.stringValue,
        value: v.mapValue.fields.value.stringValue,
        inline: v.mapValue.fields.inline.booleanValue
      })) || cfg.fields || [],
      components: f.components?.arrayValue?.values?.map(v => ({
        label: v.mapValue.fields.label.stringValue,
        style: parseInt(v.mapValue.fields.style.integerValue || v.mapValue.fields.style.stringValue),
        custom_id: v.mapValue.fields.custom_id.stringValue,
        url: v.mapValue.fields.url?.stringValue || undefined,
        emoji: v.mapValue.fields.emoji?.mapValue?.fields?.name?.stringValue ? { name: v.mapValue.fields.emoji.mapValue.fields.name.stringValue } : null
      })) || cfg.components || [],
      selects: f.selects?.arrayValue?.values?.map(v => ({
        placeholder: v.mapValue.fields.placeholder.stringValue,
        custom_id: v.mapValue.fields.custom_id.stringValue,
        options: v.mapValue.fields.options.stringValue.split(',').map(o => {
          const parts = o.split('|');
          return { label: parts[0].trim(), value: parts[0].trim(), description: parts[1] ? parts[1].trim() : undefined };
        })
      })) || cfg.selects || [],
      modals: f.modals?.arrayValue?.values?.map(v => ({
        title: v.mapValue.fields.title.stringValue,
        trigger_id: v.mapValue.fields.trigger_id.stringValue,
        questions: v.mapValue.fields.questions.stringValue,
        log_channel: v.mapValue.fields.log_channel.stringValue
      })) || cfg.modals || []
    };
  }
  cfg.fields = cfg.fields || [];
  cfg.components = cfg.components || [];
  cfg.selects = cfg.selects || [];
  cfg.modals = cfg.modals || [];
  return cfg;
}

// ─── Component Builders ─────────────────────────────────────────────────────

function buildMainMenuButtons(orderId, customButtons = []) {
  const base = [
    { type: 2, label: '⚙️ Status', style: 1, custom_id: `menu_status_${orderId}` },
    { type: 2, label: '❌ Cancelar', style: 4, custom_id: `confirm_cancel_${orderId}` }
  ];
  const buttons = [...base];
  if (customButtons && customButtons.length > 0) {
    customButtons.forEach(b => buttons.push({ type: 2, label: b.label, style: b.style, custom_id: b.custom_id || `custom_${b.label.toLowerCase()}`, url: b.url }));
  }
  
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }
  return rows;
}

function buildMainMenuComponents(orderId, buttons = [], selects = []) {
  const rows = buildMainMenuButtons(orderId, buttons);
  if (selects && selects.length > 0) {
    selects.forEach(s => {
      rows.unshift({ type: 1, components: [{ type: 3, custom_id: s.custom_id, placeholder: s.placeholder, options: s.options.slice(0, 25) }] });
    });
  }
  return rows.slice(0, 5);
}

function buildStatusSelectionButtons(orderId, currentStatus) {
  const statuses = ['Pendente', 'Breeding', 'Finalizado', 'Entregue'];
  const buttons = statuses.map(s => ({
    type: 2,
    label: s,
    style: s === currentStatus ? 3 : 2,
    custom_id: `setstatus_${s}_${orderId}`
  }));
  return [{ type: 1, components: buttons }, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_${orderId}` }] }];
}

function buildConfirmCancelButtons(orderId) {
  return [{ type: 1, components: [
    { type: 2, label: 'SIM, CANCELAR', style: 4, custom_id: `verify_delete_${orderId}` },
    { type: 2, label: 'NÃO, VOLTAR', style: 2, custom_id: `menu_back_${orderId}` }
  ]}];
}

function buildEmbedEditorButtons(type) {
  return [
    { type: 1, components: [
      { type: 2, label: 'Título', style: 2, custom_id: `editembed_title_${type}`, emoji: { name: '📝' } },
      { type: 2, label: 'Descrição', style: 2, custom_id: `editembed_description_${type}`, emoji: { name: '📄' } },
      { type: 2, label: 'Cor', style: 2, custom_id: `editembed_color_${type}`, emoji: { name: '🎨' } },
      { type: 2, label: 'Autor', style: 2, custom_id: `editembed_author_${type}`, emoji: { name: '👤' } }
    ]},
    { type: 1, components: [
      { type: 2, label: 'Thumbnail', style: 2, custom_id: `editembed_thumbnail_${type}`, emoji: { name: '🖼️' } },
      { type: 2, label: 'Banner', style: 2, custom_id: `editembed_banner_${type}`, emoji: { name: '🎇' } },
      { type: 2, label: 'Rodapé', style: 2, custom_id: `editembed_footer_${type}`, emoji: { name: '🦶' } },
      { type: 2, label: 'Mensagem', style: 2, custom_id: `editembed_content_${type}`, emoji: { name: '💬' } }
    ]},
    { type: 1, components: [
      { type: 2, label: 'Campos', style: 1, custom_id: `menu_fields_${type}`, emoji: { name: '🗂️' } },
      { type: 2, label: 'Botões', style: 1, custom_id: `menu_buttons_${type}`, emoji: { name: '🔘' } },
      { type: 2, label: 'Menus', style: 1, custom_id: `menu_selects_${type}`, emoji: { name: '📜' } },
      { type: 2, label: 'Modais', style: 1, custom_id: `menu_modals_${type}`, emoji: { name: '📦' } }
    ]},
    { type: 1, components: [
      { type: 2, label: 'Canal', style: 2, custom_id: `editembed_channel_${type}`, emoji: { name: '📺' } },
      { type: 2, label: 'SALVAR', style: 3, custom_id: `verify_saveconfig_${type}`, emoji: { name: '💾' } },
      { type: 2, label: 'CANCELAR', style: 4, custom_id: `action_cancelconfig_${type}`, emoji: { name: '❌' } }
    ]}
  ];
}

function buildFieldButtons(type, fields) {
  const btns = fields.map((f, i) => ({ type: 2, label: `Campo ${i + 1}`, style: 2, custom_id: `editfield_modal_${i}_${type}` }));
  const rows = [];
  for (let i = 0; i < btns.length; i += 5) rows.push({ type: 1, components: btns.slice(i, i + 5) });
  rows.push({ type: 1, components: [
    { type: 2, label: '➕ Adicionar', style: 3, custom_id: `editfield_add_${type}` },
    { type: 2, label: '🗑️ Deletar', style: 4, custom_id: `menu_fields_delete_${type}` },
    { type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_back_config_${type}` }
  ]});
  return rows;
}

function buildFieldDeleteMenu(type, fields) {
  return [{ type: 1, components: [{
    type: 3, custom_id: `editfield_delete_select_${type}`,
    options: fields.map((f, i) => ({ label: `Deletar: ${f.name.slice(0, 50)}`, value: i.toString() })),
    placeholder: 'Selecione o campo para excluir...'
  }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_fields_${type}` }] }];
}

function buildButtonButtons(type, buttons) {
  const btns = buttons.map((b, i) => ({ 
    type: 2, 
    label: b.label.slice(0, 15), 
    style: 2, // Force style 2 (Secondary) in editor to allow clicking any button to edit
    custom_id: `editbutton_modal_${i}_${type}`,
    emoji: b.emoji || { name: '🔘' }
  }));
  const rows = [];
  for (let i = 0; i < btns.length; i += 5) rows.push({ type: 1, components: btns.slice(i, i + 5) });
  rows.push({ type: 1, components: [
    { type: 2, label: 'Adicionar', style: 3, custom_id: `editbutton_add_${type}`, emoji: { name: '➕' } },
    { type: 2, label: 'Deletar', style: 4, custom_id: `menu_buttons_delete_${type}`, emoji: { name: '🗑️' } },
    { type: 2, label: 'Voltar', style: 2, custom_id: `menu_back_config_${type}`, emoji: { name: '⬅️' } }
  ]});
  return rows;
}

function buildButtonDeleteMenu(type, buttons) {
  return [{ type: 1, components: [{
    type: 3, custom_id: `editbutton_delete_select_${type}`,
    options: buttons.map((b, i) => ({ label: `Deletar: ${b.label.slice(0, 50)}`, value: i.toString() })),
    placeholder: 'Selecione o botão para excluir...'
  }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_buttons_${type}` }] }];
}

function buildSelectButtons(type, selects) {
  const btns = selects.map((s, i) => ({ 
    type: 2, 
    label: `Menu ${i + 1}`, 
    style: 2, 
    custom_id: `editselect_modal_${i}_${type}`,
    emoji: { name: '📜' }
  }));
  const rows = [];
  for (let i = 0; i < btns.length; i += 5) rows.push({ type: 1, components: btns.slice(i, i + 5) });
  rows.push({ type: 1, components: [
    { type: 2, label: 'Adicionar', style: 3, custom_id: `editselect_add_${type}`, emoji: { name: '➕' } },
    { type: 2, label: 'Deletar', style: 4, custom_id: `menu_selects_delete_${type}`, emoji: { name: '🗑️' } },
    { type: 2, label: 'Voltar', style: 2, custom_id: `menu_back_config_${type}`, emoji: { name: '⬅️' } }
  ]});
  return rows;
}

function buildSelectDeleteMenu(type, selects) {
  return [{ type: 1, components: [{
    type: 3, custom_id: `editselect_delete_select_${type}`,
    options: selects.map((s, i) => ({ label: `Deletar: ${s.placeholder.slice(0, 50)}`, value: i.toString() })),
    placeholder: 'Selecione o menu para excluir...'
  }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_selects_${type}` }] }];
}

function buildModalButtons(type, modals) {
  const btns = modals.map((m, i) => ({ 
    type: 2, 
    label: `Modal ${i + 1}`, 
    style: 2, 
    custom_id: `editmodal_modal_${i}_${type}`,
    emoji: { name: '📦' }
  }));
  const rows = [];
  for (let i = 0; i < btns.length; i += 5) rows.push({ type: 1, components: btns.slice(i, i + 5) });
  rows.push({ type: 1, components: [
    { type: 2, label: 'Adicionar', style: 3, custom_id: `editmodal_add_${type}`, emoji: { name: '➕' } },
    { type: 2, label: 'Deletar', style: 4, custom_id: `menu_modals_delete_${type}`, emoji: { name: '🗑️' } },
    { type: 2, label: 'Voltar', style: 2, custom_id: `menu_back_config_${type}`, emoji: { name: '⬅️' } }
  ]});
  return rows;
}

function buildModalDeleteMenu(type, modals) {
  return [{ type: 1, components: [{
    type: 3, custom_id: `editmodal_delete_select_${type}`,
    options: modals.map((m, i) => ({ label: `Deletar: ${m.title.slice(0, 50)}`, value: i.toString() })),
    placeholder: 'Selecione o modal para excluir...'
  }]}, { type: 1, components: [{ type: 2, label: '⬅️ Voltar', style: 2, custom_id: `menu_modals_${type}` }] }];
}

const STATUS_CONFIG = {
  'Pendente': { color: 0xF1C40F },
  'Breeding': { color: 0x9B59B6 },
  'Finalizado': { color: 0x2ECC71 },
  'Entregue': { color: 0x3498DB }
};

// ─── Main Handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');
      const body = await request.text();
      const isValid = await verifyDiscordRequest(env.DISCORD_PUBLIC_KEY, signature, timestamp, body);
      if (!isValid) return new Response('Invalid request', { status: 401 });

      const interaction = JSON.parse(body);
      const mockOrder = { pokemon: 'Pikachu', playerNick: 'Treinador', ivs: 'F6', gender: 'Macho', ability: 'Static', totalPrice: 100000, observations: 'Nenhuma', discordNick: 'User' };

      if (interaction.type === 1) return jsonResponse({ type: 1 });

      if (interaction.type === 2 && interaction.data.name === 'editar_embed') {
        const type = interaction.data.options[0].value;
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, type, idToken);
          await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { 
            method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, 
            body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) 
          });
          
          const embed = buildEmbedFromConfig(cfg, mockOrder);
          const res = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components: buildEmbedEditorButtons(type) }) 
          });
          if (!res.ok) {
             const err = await res.text();
             await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Erro da API Discord ao salvar:\n\`\`\`json\n${err}\n\`\`\`` }) });
          }
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'help') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, 'help', idToken);
          const embed = buildEmbedFromConfig(cfg, mockOrder);
          const components = buildFinalComponents(cfg);

          const res = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components }) 
          });
          if (!res.ok) {
            const err = await res.text();
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Erro na configuração do painel:\n\`\`\`json\n${err}\n\`\`\`` }) });
          }
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'salas_estoque') {
        const filterSalas = interaction.data.options?.find(o => o.name === 'salas')?.value;
        const highlightPoke = interaction.data.options?.find(o => o.name === 'pokemon')?.value?.toLowerCase();
        const hasPokeFilters = interaction.data.options?.some(o => ['shinies', 'legendaries', 'pseudos'].includes(o.name) && o.value === true);

        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          
          // Check for custom modal triggers
          const embedsDoc = await getFirestoreDoc(env, 'bot_config', 'embeds', idToken);
          if (embedsDoc?.fields) {
            for (const type of Object.keys(embedsDoc.fields)) {
              const f = embedsDoc.fields[type].mapValue.fields;
              if (f.modals?.arrayValue?.values) {
                const modals = f.modals.arrayValue.values.map(v => ({
                  trigger_id: v.mapValue.fields.trigger_id.stringValue,
                  title: v.mapValue.fields.title.stringValue,
                  questions: v.mapValue.fields.questions.stringValue
                }));
                const triggerId = interaction.type === 3 ? interaction.data.values?.[0] : interaction.data.custom_id;
                const match = modals.find(m => m.trigger_id === triggerId);
                if (match) {
                  const qList = match.questions.split(',').map(q => q.trim()).filter(q => q.length > 0).slice(0, 5);
                  const components = qList.map((q, i) => ({ type: 1, components: [{ type: 4, custom_id: `q_${i}`, label: q, style: 1, required: true }] }));
                  await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 9, data: { title: match.title, custom_id: `submitmodal_${match.trigger_id}`, components } }) });
                  return;
                }
              }
            }
          }

          const stockDoc = await getFirestoreDoc(env, 'bot_config', 'stock', idToken);
          if (!stockDoc) {
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "❌ Erro ao carregar estoque." }) });
            return;
          }

          let rooms = stockDoc.fields.rooms.arrayValue.values.map(v => ({
            name: v.mapValue.fields.name.stringValue,
            pokemonList: v.mapValue.fields.pokemonList.arrayValue.values.map(p => p.stringValue)
          }));

          // 1. Filtrar por salas específicas
          if (filterSalas) {
            const allowed = filterSalas.split(',').map(s => s.trim().toLowerCase());
            rooms = rooms.filter(room => allowed.includes(room.name.toLowerCase()));
          }

          // 2. Filtrar por tipos especiais (Shinies, Legendaries, Pseudos)
          if (hasPokeFilters) {
            rooms = rooms.map(room => {
              const filteredList = room.pokemonList.filter(p => {
                const name = p.toLowerCase();
                const isShiny = name.includes('shiny');
                if (interaction.data.options?.find(o => o.name === 'shinies')?.value && isShiny) return true;
                
                // Note: Real legendary/pseudo check would need a database, here we mock some common ones
                if (interaction.data.options?.find(o => o.name === 'legendaries')?.value) {
                  const legends = ['mewtwo', 'lugia', 'ho-oh', 'kyogre', 'groudon', 'rayquaza', 'dialga', 'palkia', 'giratina', 'arceus', 'zacian', 'zamazenta'];
                  if (legends.some(l => name.includes(l))) return true;
                }
                
                if (interaction.data.options?.find(o => o.name === 'pseudos')?.value) {
                  const pseudos = ['dragonite', 'tyranitar', 'salamence', 'metagross', 'garchomp', 'hydreigon', 'goodra', 'kommo-o', 'dragapult', 'baxcalibur'];
                  if (pseudos.some(ps => name.includes(ps))) return true;
                }
                return false;
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

          const embeds = rooms.map(room => ({
            title: `📦 SALA: ${room.name.toUpperCase()}`,
            description: room.pokemonList.join(', ') || 'Vazia',
            color: 0x2ecc71
          }));

          await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: embeds.slice(0, 10) }) 
          });
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && (interaction.data.name === 'balance' || interaction.data.name === 'resumo')) {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const type = interaction.data.name;
          const cfg = await getEmbedConfig(env, type, idToken);
          
          let data = { balance: '0k', pendente: 0, breeding: 0, finalizado: 0, entregue: 0, total_dia: '0k', data: new Date().toLocaleDateString('pt-BR') };
          
          const query = { where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'NOT_EQUAL', value: { stringValue: 'Cancelado' } } } };
          const results = await queryFirestore(env, query, idToken);
          
          if (results && results.length > 0) {
            let total = 0;
            results.forEach(r => {
              const f = r.document.fields;
              const price = parseInt(f.totalPrice?.integerValue || f.totalPrice?.stringValue || 0);
              const status = f.status?.stringValue;
              total += price;
              if (status === 'Pendente') data.pendente++;
              else if (status === 'Breeding') data.breeding++;
              else if (status === 'Finalizado') data.finalizado++;
              else if (status === 'Entregue') data.entregue++;
            });
            data.balance = total.toLocaleString() + 'k';
            data.total_dia = total.toLocaleString() + 'k'; // Simplified for this implementation
          }

          const embed = buildEmbedFromConfig(cfg, data);
          const res = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components: buildFinalComponents(cfg) }) 
          });
          if (!res.ok) {
            const err = await res.text();
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Erro da API:\n\`\`\`json\n${err}\n\`\`\`` }) });
          }
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'cliente') {
        const user = interaction.data.options[0].value;
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, 'cliente', idToken);
          
          const query = { where: { fieldFilter: { field: { fieldPath: 'treinador' }, op: 'EQUAL', value: { stringValue: user } } } };
          const results = await queryFirestore(env, query, idToken);
          
          let data = { nick: user, id: '?', gasto: '0k', historico: 'Nenhum pedido encontrado.' };
          if (results && results.length > 0) {
            let total = 0;
            let hist = [];
            results.forEach(r => {
              const f = r.document.fields;
              total += parseInt(f.totalPrice?.integerValue || f.totalPrice?.stringValue || 0);
              hist.push(`• ${f.pokemon?.stringValue} (${f.status?.stringValue})`);
            });
            data.gasto = total.toLocaleString() + 'k';
            data.historico = hist.slice(-5).join('\n');
            data.id = results[0].document.fields.discordId?.stringValue || '?';
          }

          const embed = buildEmbedFromConfig(cfg, data);
          const res = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components: buildFinalComponents(cfg) }) 
          });
          if (!res.ok) {
            const err = await res.text();
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Erro da API:\n\`\`\`json\n${err}\n\`\`\`` }) });
          }
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'tabela') {
        ctx.waitUntil((async () => {
          const idToken = await getFirebaseToken(env);
          const cfg = await getEmbedConfig(env, 'tabela', idToken);
          const embed = buildEmbedFromConfig(cfg, {});
          const res = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ embeds: [embed], components: buildFinalComponents(cfg) }) 
          });
          if (!res.ok) {
            const err = await res.text();
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `❌ Erro da API:\n\`\`\`json\n${err}\n\`\`\`` }) });
          }
        })());
        return jsonResponse({ type: 5 });
      }

      if (interaction.type === 2 && interaction.data.name === 'config_bot') {
        return jsonResponse({
          type: 4,
          data: {
            embeds: [{
              title: "⚙️ Painel de Comando Administrativo",
              description: "Bem-vindo ao **Valiant Hub**. Aqui você pode orquestrar todas as facetas do seu assistente digital.",
              color: 0x3b82f6,
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
                  { label: "Notificações", value: "config_notif", emoji: { name: "📢" } },
                  { label: "Perfil & Identidade", value: "config_profile", emoji: { name: "👤" } },
                  { label: "Configurações de Sistema", value: "config_system", emoji: { name: "🛡️" } }
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
              description: 'Selecione uma categoria abaixo para gerenciar a infraestrutura do seu servidor.',
              color: 0xef4444,
              fields: [
                { name: '🔒 Segurança', value: 'Controle de acesso e limpeza seletiva.', inline: true },
                { name: '☢️ Infraestrutura', value: 'Nuke, Purgar e Canais.', inline: true },
                { name: '📂 Workspace', value: 'Webhooks e Notas.', inline: true }
              ]
            }],
            components: [{
              type: 1,
              components: [{
                type: 3,
                custom_id: "server_category_select",
                options: [
                  { label: "Segurança & Moderação", value: "server_cat_security", emoji: { name: "🔒" } },
                  { label: "Infraestrutura", value: "server_cat_infra", emoji: { name: "☢️" } },
                  { label: "Workspace & Ferramentas", value: "server_cat_tools", emoji: { name: "📂" } }
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

        if (interaction.data.custom_id === 'config_category_select') {
          const cat = interaction.data.values[0];
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
            
            let embed, components;
            if (cat === 'config_notif') {
              embed = { title: "📢 Notificações", description: "Configurar logs e pings.", color: 0x3b82f6, fields: [{ name: "Status Atual", value: `🔔 Notificações: ${s.notif ? '✅' : '❌'}\n📣 Pings: ${s.pings ? '✅' : '❌'}\n📺 Logs: <#${s.logChannel || '0'}>` }] };
              components = [
                { type: 1, components: [{ type: 2, label: 'Alternar Notificações', style: s.notif ? 3 : 4, custom_id: 'config_toggle_notif' }, { type: 2, label: 'Alternar Pings', style: s.pings ? 3 : 4, custom_id: 'config_toggle_pings' }] },
                { type: 1, components: [{ type: 2, label: 'Definir Canal de Logs', style: 2, custom_id: 'config_set_logchannel' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }
              ];
            } else if (cat === 'config_profile') {
              embed = { title: "👤 Perfil & Identidade", description: "Alterar nome, avatar e status.", color: 0x9B59B6 };
              components = [{ type: 1, components: [{ type: 2, label: 'Nome', style: 2, custom_id: 'config_set_name' }, { type: 2, label: 'Avatar', style: 2, custom_id: 'config_set_avatar' }, { type: 2, label: 'Status', style: 2, custom_id: 'config_set_status' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }];
            } else if (cat === 'config_system') {
              embed = { title: "🛡️ Sistema", description: "Manutenção e modo seguro.", color: 0xef4444, fields: [{ name: "Modo Manutenção", value: s.maintenance ? "⚠️ Ativado" : "✅ Normal" }] };
              components = [{ type: 1, components: [{ type: 2, label: s.maintenance ? 'Desativar Manutenção' : 'Ativar Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }];
            }
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed], components }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (interaction.data.custom_id.startsWith('config_toggle_')) {
          ctx.waitUntil((async () => {
            const idToken = await getFirebaseToken(env);
            const settingsDoc = await getFirestoreDoc(env, 'bot_config', 'settings', idToken);
            const s = settingsDoc?.fields ? Object.fromEntries(Object.entries(settingsDoc.fields).map(([k, v]) => [k, v.booleanValue || (v.stringValue && !isNaN(v.stringValue) ? v.stringValue : v.stringValue)])) : { notif: true, pings: true, maintenance: false, logChannel: '' };
            const field = cid.split('_')[2];
            s[field === 'notif' ? 'notif' : (field === 'pings' ? 'pings' : 'maintenance')] = !s[field === 'notif' ? 'notif' : (field === 'pings' ? 'pings' : 'maintenance')];
            await updateFirestore(env, 'bot_config', 'settings', Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v.toString() }])), idToken);
            // Repatch current view
            const isMaint = cid.includes('maint');
            const embed = isMaint ? { title: "🛡️ Sistema", description: "Manutenção e modo seguro.", color: 0xef4444, fields: [{ name: "Modo Manutenção", value: s.maintenance ? "⚠️ Ativado" : "✅ Normal" }] } : { title: "📢 Notificações", description: "Configurar logs e pings.", color: 0x3b82f6, fields: [{ name: "Status Atual", value: `🔔 Notificações: ${s.notif ? '✅' : '❌'}\n📣 Pings: ${s.pings ? '✅' : '❌'}\n📺 Logs: <#${s.logChannel || '0'}>` }] };
            const components = isMaint ? [{ type: 1, components: [{ type: 2, label: s.maintenance ? 'Desativar Manutenção' : 'Ativar Manutenção', style: s.maintenance ? 3 : 4, custom_id: 'config_toggle_maint' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }] : [
              { type: 1, components: [{ type: 2, label: 'Alternar Notificações', style: s.notif ? 3 : 4, custom_id: 'config_toggle_notif' }, { type: 2, label: 'Alternar Pings', style: s.pings ? 3 : 4, custom_id: 'config_toggle_pings' }] },
              { type: 1, components: [{ type: 2, label: 'Definir Canal de Logs', style: 2, custom_id: 'config_set_logchannel' }, { type: 2, label: 'Voltar', style: 2, custom_id: 'back_to_config' }] }
            ];
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed], components }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (cid === 'back_to_config') {
          return jsonResponse({ type: 7, data: { embeds: [{ title: "⚙️ Painel de Comando Administrativo", description: "Selecione uma categoria abaixo para configurar.", color: 0x3b82f6 }], components: [{ type: 1, components: [{ type: 3, custom_id: "config_category_select", options: [{ label: "Notificações", value: "config_notif", emoji: { name: "📢" } }, { label: "Perfil & Identidade", value: "config_profile", emoji: { name: "👤" } }, { label: "Configurações de Sistema", value: "config_system", emoji: { name: "🛡️" } }], placeholder: "Selecione a área de atuação..." }] }] } });
        }

        if (cid === 'config_set_name') return jsonResponse({ type: 9, data: { title: 'Alterar Nome', custom_id: 'modal_bot_identity', components: [{ type: 1, components: [{ type: 4, custom_id: 'username', label: 'Novo Nome', style: 1, required: true }] }] } });
        if (cid === 'config_set_avatar') return jsonResponse({ type: 9, data: { title: 'Alterar Avatar', custom_id: 'modal_bot_avatar', components: [{ type: 1, components: [{ type: 4, custom_id: 'avatar', label: 'Link da Imagem', style: 1, required: true }] }] } });
        if (cid === 'config_set_status') return jsonResponse({ type: 9, data: { title: 'Alterar Status', custom_id: 'modal_bot_status', components: [{ type: 1, components: [{ type: 4, custom_id: 'status', label: 'Mensagem', style: 1, required: true }] }, { type: 1, components: [{ type: 4, custom_id: 'type', label: 'Tipo (0: Jogando, 1: Transmitindo, 2: Ouvindo, 3: Assistindo)', style: 1, required: true }] }] } });
        if (cid === 'config_set_logchannel') return jsonResponse({ type: 9, data: { title: 'Definir Canal de Logs', custom_id: 'modal_config_logchannel', components: [{ type: 1, components: [{ type: 4, custom_id: 'val', label: 'ID do Canal', style: 1, required: true }] }] } });

        // Server handlers
        if (cid === 'server_category_select') {
          const cat = interaction.data.values[0];
          let embed, components = [];
          if (cat === 'server_cat_security') {
            embed = { title: "🔒 Segurança & Moderação", description: "Ações de limpeza e controle.", color: 0x3498DB };
            components = [{ type: 1, components: [{ type: 2, label: 'Limpar Canal', style: 2, custom_id: 'server_action_clear' }, { type: 2, label: 'Limpar Usuário', style: 2, custom_id: 'server_action_clearuser' }, { type: 2, label: 'Alternar Lockdown', style: 4, custom_id: 'server_action_lockdown' }] }, { type: 1, components: [{ type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }] }];
          } else if (cat === 'server_cat_infra') {
            embed = { title: "☢️ Infraestrutura", description: "Nuke e Purge.", color: 0xE74C3C };
            components = [{ type: 1, components: [{ type: 2, label: 'Nuke Canal', style: 4, custom_id: 'server_action_nuke' }, { type: 2, label: 'Purgar Categoria', style: 4, custom_id: 'server_action_purge' }, { type: 2, label: 'Sync Perms', style: 2, custom_id: 'server_action_sync_perms' }] }, { type: 1, components: [{ type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }] }];
          } else if (cat === 'server_cat_tools') {
            embed = { title: "📂 Workspace", description: "Webhooks e Notas.", color: 0xF1C40F };
            components = [{ type: 1, components: [{ type: 2, label: 'Refazer Webhooks', style: 2, custom_id: 'server_action_rewebhooks' }, { type: 2, label: 'Exportar Chat', style: 2, custom_id: 'server_action_export' }, { type: 2, label: 'Nota do Canal', style: 2, custom_id: 'server_action_note' }] }, { type: 1, components: [{ type: 2, label: 'Voltar', style: 2, custom_id: 'server_back_main' }] }];
          }
          return jsonResponse({ type: 7, data: { embeds: [embed], components } });
        }

        if (cid === 'server_back_main') return jsonResponse({ type: 7, data: { embeds: [{ title: '🛡️ Central de Comando ValiantShop', description: 'Selecione uma categoria abaixo.', color: 0xef4444 }], components: [{ type: 1, components: [{ type: 3, custom_id: "server_category_select", options: [{ label: "Segurança & Moderação", value: "server_cat_security", emoji: { name: "🔒" } }, { label: "Infraestrutura", value: "server_cat_infra", emoji: { name: "☢️" } }, { label: "Workspace & Ferramentas", value: "server_cat_tools", emoji: { name: "📂" } }], placeholder: "Selecione a área de atuação..." }] }] } });
        
        if (cid === 'server_action_clear') return jsonResponse({ type: 9, data: { title: 'Limpar Mensagens', custom_id: 'modal_server_clear', components: [{ type: 1, components: [{ type: 4, custom_id: 'quantidade', label: 'Quantas mensagens? (1-100)', style: 1, required: true }] }] } });
        if (cid === 'server_action_clearuser') return jsonResponse({ type: 9, data: { title: 'Limpar Usuário', custom_id: 'modal_server_clearuser', components: [{ type: 1, components: [{ type: 4, custom_id: 'user_id', label: 'ID do Usuário', style: 1, required: true }] }] } });
        if (cid === 'server_action_nuke') return jsonResponse({ type: 9, data: { title: 'Nuke Canal', custom_id: 'modal_server_nuke', components: [{ type: 1, components: [{ type: 4, custom_id: 'confirmar', label: 'Digite CONFIRMAR', style: 1, required: true }] }] } });
        if (cid === 'server_action_purge') return jsonResponse({ type: 9, data: { title: 'Purgar Categoria', custom_id: 'modal_server_purge', components: [{ type: 1, components: [{ type: 4, custom_id: 'cat_id', label: 'ID da Categoria', style: 1, required: true }] }] } });
        if (cid === 'server_action_note') return jsonResponse({ type: 9, data: { title: 'Nota do Canal', custom_id: 'modal_server_note', components: [{ type: 1, components: [{ type: 4, custom_id: 'note', label: 'Tópico', style: 2, required: true }] }] } });

        // Embed Editor Type 3 Handlers
        let type = '';
        if (cid.startsWith('editembed_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('menu_buttons_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('menu_selects_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('menu_modals_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('menu_fields_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editbutton_add_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editbutton_modal_')) type = parts.slice(3).join('_');
        else if (cid.startsWith('editselect_add_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editselect_modal_')) type = parts.slice(3).join('_');
        else if (cid.startsWith('editmodal_add_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editmodal_modal_')) type = parts.slice(3).join('_');
        else if (cid.startsWith('editfield_add_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editfield_modal_')) type = parts.slice(3).join('_');
        else if (cid.startsWith('menu_back_config_')) type = parts.slice(3).join('_');
        else if (cid.startsWith('verify_saveconfig_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('action_cancelconfig_')) type = parts.slice(2).join('_');
        else if (cid.startsWith('editfield_delete_select_')) type = cid.substring('editfield_delete_select_'.length);
        else if (cid.startsWith('editbutton_delete_select_')) type = cid.substring('editbutton_delete_select_'.length);
        else if (cid.startsWith('editselect_delete_select_')) type = cid.substring('editselect_delete_select_'.length);
        else if (cid.startsWith('editmodal_delete_select_')) type = cid.substring('editmodal_delete_select_'.length);

        const orderId = parts.slice(2).join('_');

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

        if (parts[0] === 'menu' && (parts[1] === 'buttons' || parts[1] === 'selects' || parts[1] === 'modals' || parts[1] === 'fields')) {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           
           if (parts[1] === 'buttons') {
             if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { embeds: [preview], components: buildButtonDeleteMenu(type, cfg.components || []) } });
             return jsonResponse({ type: 7, data: { embeds: [preview], components: buildButtonButtons(type, cfg.components || []) } });
           }
           if (parts[1] === 'selects') {
             if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { embeds: [preview], components: buildSelectDeleteMenu(type, cfg.selects || []) } });
             return jsonResponse({ type: 7, data: { embeds: [preview], components: buildSelectButtons(type, cfg.selects || []) } });
           }
           if (parts[1] === 'modals') {
             if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { embeds: [preview], components: buildModalDeleteMenu(type, cfg.modals || []) } });
             return jsonResponse({ type: 7, data: { embeds: [preview], components: buildModalButtons(type, cfg.modals || []) } });
           }
           if (parts[1] === 'fields') {
             if (parts[2] === 'delete') return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldDeleteMenu(type, cfg.fields || []) } });
             return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldButtons(type, cfg.fields || []) } });
           }
        }

        if (parts[0] === 'editbutton' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Botão', custom_id: `modalbutton_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'label', label: 'Texto do Botão', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'style', label: 'Estilo (1-Blurple, 2-Gray, 3-Green, 4-Red, 5-Link)', placeholder: '2', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'emoji', label: 'Emoji (ex: 🔘 ou <:nome:id>)', style: 1, required: false }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado (Ação)', placeholder: 'ex: status_check', style: 1 }] },
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL (Opcional)', placeholder: 'https://...', style: 1, required: false }] }
           ]}});
        }

        if (parts[0] === 'editbutton' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           if (!draftDoc?.fields?.config?.stringValue) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Erro ao carregar rascunho." } });
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const btn = cfg.components[index];
           return jsonResponse({ type: 9, data: { title: 'Editar Botão', custom_id: `modalbutton_edit_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'label', label: 'Texto do Botão', value: btn.label, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'style', label: 'Estilo (1-5)', value: btn.style.toString(), style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'emoji', label: 'Emoji', value: btn.emoji?.name || '', style: 1, required: false }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID Customizado', value: btn.custom_id || '', style: 1 }] },
             { type: 1, components: [{ type: 4, custom_id: 'url', label: 'Link URL', value: btn.url || '', style: 1, required: false }] }
           ]}});
        }

        if (parts[0] === 'editselect' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Menu', custom_id: `modalselect_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'placeholder', label: 'Texto do Menu', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID do Menu', placeholder: 'ex: shop_select', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'options', label: 'Opções (Separadas por vírgula)', placeholder: 'Item 1, Item 2, Item 3', style: 2, required: true }] }
           ]}});
        }

        if (parts[0] === 'editselect' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const sel = cfg.selects[index];
           return jsonResponse({ type: 9, data: { title: 'Editar Menu', custom_id: `modalselect_edit_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'placeholder', label: 'Texto do Menu', value: sel.placeholder, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'custom_id', label: 'ID do Menu', value: sel.custom_id, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'options', label: 'Opções', value: sel.options.map(o => o.label).join(','), style: 2, required: true }] }
           ]}});
        }

        if (parts[0] === 'editmodal' && parts[1] === 'add') {
           return jsonResponse({ type: 9, data: { title: 'Adicionar Modal', custom_id: `modalconfig_add_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'title', label: 'Título do Modal', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'trigger_id', label: 'ID do Botão Gatilho', placeholder: 'ex: custommodal_comprar', style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'questions', label: 'Perguntas (Separadas por vírgula)', style: 2, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'log_channel', label: 'ID do Canal de Logs', style: 1, required: true }] }
           ]}});
        }

        if (parts[0] === 'editmodal' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const m = cfg.modals[index];
           return jsonResponse({ type: 9, data: { title: 'Editar Modal', custom_id: `modalconfig_edit_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'title', label: 'Título', value: m.title, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'trigger_id', label: 'ID Gatilho', value: m.trigger_id, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'questions', label: 'Perguntas', value: m.questions, style: 2, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'log_channel', label: 'Canal de Logs', value: m.log_channel, style: 1, required: true }] }
           ]}});
        }

        if (parts[0] === 'editfield' && parts[1] === 'add') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           cfg.fields.push({ name: 'Novo Campo', value: 'Valor', inline: true });
           await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           return jsonResponse({ type: 7, data: { embeds: [preview], components: buildFieldButtons(type, cfg.fields) } });
        }

        if (parts[0] === 'editfield' && parts[1] === 'modal') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const index = parseInt(parts[2]);
           const f = cfg.fields[index];
           return jsonResponse({ type: 9, data: { title: `Editar Campo ${index + 1}`, custom_id: `modaleditor_field_${index}_${type}`, components: [
             { type: 1, components: [{ type: 4, custom_id: 'name', label: 'Nome do Campo', value: f.name, style: 1, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'val', label: 'Valor', value: f.value, style: 2, required: true }] },
             { type: 1, components: [{ type: 4, custom_id: 'inline', label: 'Lado a Lado? (S/N)', value: f.inline ? 'S' : 'N', style: 1, required: true, min_length: 1, max_length: 1 }] }
           ]}});
        }

        if (parts[0] === 'menu' && parts[1] === 'back' && parts[2] === 'config') {
           const idToken = await getFirebaseToken(env);
           const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
           const cfg = JSON.parse(draftDoc.fields.config.stringValue);
           const preview = buildEmbedFromConfig(cfg, mockOrder);
           return jsonResponse({ type: 7, data: { embeds: [preview], components: buildEmbedEditorButtons(type) } });
        }

        if (parts[0] === 'verify' && parts[1] === 'saveconfig') {
           return jsonResponse({ type: 9, data: { title: 'Salvar Configurações', custom_id: `verify_saveconfig_submit_${type}`, components: [{ type: 1, components: [{ type: 4, custom_id: 'confirm', label: `Digite '${VERIFY_CONFIRM}' para confirmar`, placeholder: VERIFY_CONFIRM, style: 1, required: true }] }] } });
        }

        if (parts[0] === 'action' && parts[1] === 'cancelconfig') {
           return jsonResponse({ type: 7, data: { content: '❌ Edição cancelada.', embeds: [], components: [] } });
        }

        if (parts[0] === 'menu' && parts[1] === 'status') { 
           const idToken = await getFirebaseToken(env);
           const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
           const status = doc?.fields?.status?.stringValue || 'Pendente';
           return jsonResponse({ type: 7, data: { components: buildStatusSelectionButtons(orderId, status) } }); 
        }

        if (parts[0] === 'menu' && parts[1] === 'back') {
           const idToken = await getFirebaseToken(env);
           const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
           if (doc) {
             const order = Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
             const cfg = await getEmbedConfig(env, 'notificacao', idToken);
             return jsonResponse({ type: 7, data: { components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) } });
           }
        }

        if (parts[0] === 'confirm' && parts[1] === 'cancel') {
           return jsonResponse({ type: 7, data: { content: '⚠️ **TEM CERTEZA?**', components: buildConfirmCancelButtons(orderId) } });
        }

        if (parts[0] === 'setstatus') {
           ctx.waitUntil((async () => {
             const idToken = await getFirebaseToken(env);
             const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
             if (doc) {
               const order = Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
               order.status = parts[1];
               const cfg = await getEmbedConfig(env, 'notificacao', idToken);
               const embed = buildEmbedFromConfig(cfg, order);
               embed.color = STATUS_CONFIG[parts[1]]?.color || embed.color;
               await updateFirestore(env, 'orders', orderId, { status: { stringValue: parts[1] } }, idToken);
               await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed], components: buildMainMenuComponents(orderId, cfg.components, cfg.selects) }) });
             }
           })());
           return jsonResponse({ type: 6 });
        }

        if (parts[0] === 'verify' && parts[1] === 'delete') {
           return jsonResponse({ type: 9, data: { title: 'Confirmar Cancelamento', custom_id: `verify_delete_submit_${orderId}`, components: [{ type: 1, components: [{ type: 4, custom_id: 'confirm', label: `Digite '${VERIFY_CONFIRM}' para confirmar`, placeholder: VERIFY_CONFIRM, style: 1, required: true }] }] } });
        }
      }

      if (interaction.type === 5) {
        const idToken = await getFirebaseToken(env);
        const getVal = (cid) => interaction.data.components.find(c => c.components[0].custom_id === cid).components[0].value;
        const cid = interaction.data.custom_id;
        const parts = cid ? cid.split('_') : [];

        if (cid.startsWith('verify_delete_submit_')) {
          const orderId = parts.slice(3).join('_');
          if (getVal('confirm') !== VERIFY_CONFIRM) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Confirmação incorreta!" } });
          ctx.waitUntil((async () => {
            const doc = await getFirestoreDoc(env, 'orders', orderId, idToken);
            if (doc) {
              const order = Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, v.stringValue || v.integerValue || v.doubleValue || v.booleanValue]));
              const cfg = await getEmbedConfig(env, 'cancelamento', idToken);
              const embed = buildEmbedFromConfig(cfg, order);
              await fetch(`https://discord.com/api/v10/channels/${cfg.channel}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ content: replacePlaceholders(cfg.content, order), embeds: [embed] }) });
            }
            await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "✅ Encomenda cancelada e excluída.", embeds: [], components: [] }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (cid.startsWith('verify_saveconfig_submit_')) {
          const type = parts.slice(3).join('_');
          if (getVal('confirm') !== VERIFY_CONFIRM) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Confirmação incorreta!" } });
          ctx.waitUntil((async () => {
            const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
            if (!draftDoc?.fields?.config?.stringValue) {
              await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "❌ Erro: Rascunho não encontrado. Inicie a edição novamente.", embeds: [], components: [] }) });
              return;
            }
            const cfg = JSON.parse(draftDoc.fields.config.stringValue);
            const fields = { [type]: { mapValue: { fields: {
              title: { stringValue: cfg.title || '' }, description: { stringValue: cfg.description || '' }, color: { stringValue: cfg.color },
              banner: { stringValue: cfg.banner || '' }, footer: { stringValue: cfg.footer || '' }, author: { stringValue: cfg.author || '' },
              thumbnail: { stringValue: cfg.thumbnail || '{sprite}' },
              content: { stringValue: cfg.content || '' }, channel: { stringValue: cfg.channel || DEFAULT_EMBEDS[type].channel },
              fields: { arrayValue: { values: cfg.fields.map(f => ({ mapValue: { fields: { name: { stringValue: f.name }, value: { stringValue: f.value }, inline: { booleanValue: f.inline } }}})) }},
              components: { arrayValue: { values: (cfg.components || []).map(b => ({ mapValue: { fields: { label: { stringValue: b.label }, style: { integerValue: b.style.toString() }, custom_id: { stringValue: b.custom_id || '' }, url: { stringValue: b.url || '' } }}})) }},
              selects: { arrayValue: { values: (cfg.selects || []).map(s => ({ mapValue: { fields: { placeholder: { stringValue: s.placeholder }, custom_id: { stringValue: s.custom_id }, options: { stringValue: s.options.map(o => o.label).join(',') } }}})) }},
              modals: { arrayValue: { values: (cfg.modals || []).map(m => ({ mapValue: { fields: { title: { stringValue: m.title }, trigger_id: { stringValue: m.trigger_id }, questions: { stringValue: m.questions }, log_channel: { stringValue: m.log_channel } }}})) }}
            }}}};
            await updateFirestore(env, 'bot_config', 'embeds', fields, idToken);
            
            // Sync live bot message
            const embed = buildEmbedFromConfig(cfg, mockOrder);
            const res = await fetch(`https://discord.com/api/v10/channels/${cfg.channel || DEFAULT_EMBEDS[type].channel}/messages?limit=10`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
            if (res.ok) {
              const msgs = await res.json();
              const target = msgs.find(m => m.author.id === interaction.application_id);
              if (target) {
                await fetch(`https://discord.com/api/v10/channels/${target.channel_id}/messages/${target.id}`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
                  body: JSON.stringify({ content: cfg.content, embeds: [embed], components: buildMainMenuComponents('PREVIEW', cfg.components, cfg.selects) })
                });
              }
            }
            
            await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: "✅ Configuração salva e sincronizada!", embeds: [], components: [] }) });
          })());
          return jsonResponse({ type: 6 });
        }

        if (cid.startsWith('modalselect_')) {
          const parts = cid.split('_'); const action = parts[1];
          let index, type;
          if (action === 'add') { type = parts.slice(2).join('_'); }
          else { index = parseInt(parts[2]); type = parts.slice(3).join('_'); }
          
          const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
          if (!draftDoc?.fields?.config?.stringValue) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Erro ao carregar rascunho." } });
          const cfg = JSON.parse(draftDoc.fields.config.stringValue);
          if (!cfg.selects) cfg.selects = [];
          
          const optionsRaw = getVal('options').split(',');
          const options = optionsRaw.map(o => ({ label: o.trim(), value: o.trim() })).filter(o => o.label.length > 0);
          
          const newSelect = { placeholder: getVal('placeholder'), custom_id: getVal('custom_id'), options };
          if (action === 'add') cfg.selects.push(newSelect);
          else cfg.selects[index] = newSelect;
          
          await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
          const preview = buildEmbedFromConfig(cfg, mockOrder);
          return jsonResponse({ type: 7, data: { embeds: [preview], components: buildSelectButtons(type, cfg.selects) } });
        }

        if (cid.startsWith('modalconfig_')) {
          const parts = cid.split('_'); const action = parts[1];
          let index, type;
          if (action === 'add') { type = parts.slice(2).join('_'); }
          else { index = parseInt(parts[2]); type = parts.slice(3).join('_'); }
          
          const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
          if (!draftDoc?.fields?.config?.stringValue) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Erro ao carregar rascunho." } });
          const cfg = JSON.parse(draftDoc.fields.config.stringValue);
          if (!cfg.modals) cfg.modals = [];
          
          const newModal = { title: getVal('title'), trigger_id: getVal('trigger_id'), questions: getVal('questions'), log_channel: getVal('log_channel') };
          if (action === 'add') cfg.modals.push(newModal);
          else cfg.modals[index] = newModal;
          
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
          return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Nome do bot atualizado!` } });
        }

        if (cid === 'modal_bot_avatar') {
          const avatar = getVal('avatar');
          ctx.waitUntil((async () => {
            const res = await fetch(avatar);
            const buf = await res.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            const contentType = res.headers.get('content-type');
            await fetch(`https://discord.com/api/v10/users/@me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }, body: JSON.stringify({ avatar: `data:${contentType};base64,${base64}` }) });
            await updateFirestore(env, 'bot_config', 'settings', { avatar: { stringValue: avatar } }, idToken);
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Avatar do bot atualizado!` } });
        }

        if (cid === 'modal_bot_status') {
          const status = getVal('status');
          const statusType = parseInt(getVal('type'));
          ctx.waitUntil(updateFirestore(env, 'bot_config', 'settings', { status: { stringValue: status }, statusType: { integerValue: statusType } }, idToken));
          return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Status do bot atualizado!` } });
        }

        if (cid === 'modal_config_logchannel') {
          const channelId = getVal('val');
          ctx.waitUntil(updateFirestore(env, 'bot_config', 'settings', { logChannel: { stringValue: channelId } }, idToken));
          return jsonResponse({ type: 4, data: { flags: 64, content: `✅ Canal de logs atualizado!` } });
        }

        if (cid.startsWith('modaleditor_')) {
          const parts = cid.split('_'); const action = parts[1];
          let index, type;
          if (action === 'field') { index = parseInt(parts[2]); type = parts.slice(3).join('_'); }
          else { type = parts.slice(2).join('_'); }
          
          const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
          if (!draftDoc?.fields?.config?.stringValue) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Erro ao carregar rascunho." } });
          const cfg = JSON.parse(draftDoc.fields.config.stringValue);
          
          if (action === 'field') {
            cfg.fields[index] = { name: getVal('name'), value: getVal('val'), inline: getVal('inline').toUpperCase() === 'S' };
          } else if (action === 'channel') {
            cfg.channel = getVal('val');
          } else {
            if (action === 'color') cfg.color = '0x' + getVal('val').replace('#', '').toUpperCase();
            else cfg[action] = getVal('val');
          }
          
          await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
          const preview = buildEmbedFromConfig(cfg, mockOrder);
          return jsonResponse({ type: 7, data: { embeds: [preview], components: buildEmbedEditorButtons(type) } });
        }

        if (cid.startsWith('modalbutton_')) {
          const parts = cid.split('_'); const action = parts[1];
          let index, type;
          if (action === 'add') { type = parts.slice(2).join('_'); }
          else { index = parseInt(parts[2]); type = parts.slice(3).join('_'); }
          
          const draftDoc = await getFirestoreDoc(env, 'bot_config', `draft_${type}`, idToken);
          if (!draftDoc?.fields?.config?.stringValue) return jsonResponse({ type: 4, data: { flags: 64, content: "❌ Erro ao carregar rascunho." } });
          const cfg = JSON.parse(draftDoc.fields.config.stringValue);
          if (!cfg.components) cfg.components = [];
          
          const emojiVal = getVal('emoji');
          let emoji = null;
          if (emojiVal) {
            if (emojiVal.startsWith('<') && emojiVal.includes(':')) {
              const name = emojiVal.split(':')[1];
              const id = emojiVal.split(':')[2].replace('>', '');
              emoji = { name, id };
            } else {
              emoji = { name: emojiVal };
            }
          }
          
          const newBtn = { label: getVal('label'), style: parseInt(getVal('style')), custom_id: getVal('custom_id'), url: getVal('url'), emoji };
          if (action === 'add') cfg.components.push(newBtn);
          else cfg.components[index] = newBtn;
          
          await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/bot_config/draft_${type}?updateMask.fieldPaths=config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(cfg) } } }) });
          const preview = buildEmbedFromConfig(cfg, mockOrder);
          return jsonResponse({ type: 7, data: { embeds: [preview], components: buildButtonButtons(type, cfg.components) } });
        }

        if (cid.startsWith('submitmodal_')) {
          const trigger_id = cid.substring('submitmodal_'.length);
          ctx.waitUntil((async () => {
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
            }
          })());
          return jsonResponse({ type: 4, data: { flags: 64, content: "✅ Resposta enviada!" } });
        }
      }
    }
    return new Response('Unauthorized', { status: 401 });
  }
};
