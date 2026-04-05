import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Swords, AlertTriangle, Lightbulb, Shield, Zap, Star, Target, TrendingUp, CheckCircle2, XCircle, Info, Users, Search, ChevronRight, Hash, ShoppingBag } from 'lucide-react';
import { POKEMON_DATA } from '../data/pokemonData';
import { MOVES_DATA } from '../data/movesData';
import { ITEMS_DATA } from '../data/itemsData';
import { TYPE_COLORS } from '../data/pokemonTypes';

export interface PokemonBuild {
  name: string;
  id: number | null;
  item?: string;
  ability?: string;
  teraType?: string;
  moves: string[];
}

export interface PokemonSlot {
  name: string;
  ability: string;
  item: string;
  moves: string[];
  teraType: string;
}

const INITIAL_SLOT: PokemonSlot = {
  name: '',
  ability: '',
  item: '',
  moves: ['', '', '', ''],
  teraType: ''
};

const TERA_TYPES = [
  'Stellar', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

export type AnalysisMode = 'tournament' | 'casual' | 'antimeta';

// ─── META DATA (VGC 2025 / Regulation H) ─ Último meta oficial ────────────────
// Reg H: sem Lendários, sem Paradoxo. Meta de Balanço e Weather.

const META_STAPLES: Record<string, { tier: 'S' | 'A' | 'B' | 'C', role: string[] }> = {
  // ── S-Tier ─────────────────────────────────────────────────────────
  'incineroar':        { tier: 'S', role: ['support', 'intimidate', 'fake-out'] },
  'gholdengo':         { tier: 'S', role: ['attacker', 'anti-support'] },
  'kingambit':         { tier: 'S', role: ['attacker', 'win-condition'] },
  'amoonguss':         { tier: 'S', role: ['support', 'redirect', 'status'] },
  'sneasler':          { tier: 'S', role: ['attacker', 'speed-control'] },
  // ── A-Tier ─────────────────────────────────────────────────────────
  'dragonite':         { tier: 'A', role: ['attacker', 'win-condition'] },
  'rillaboom':         { tier: 'A', role: ['support', 'terrain', 'fake-out'] },
  'pelipper':          { tier: 'A', role: ['support', 'weather', 'rain'] },
  'archaludon':        { tier: 'A', role: ['attacker', 'terrain'] },
  'ursaluna-bloodmoon':{ tier: 'A', role: ['attacker', 'win-condition'] },
  'ursaluna':          { tier: 'A', role: ['attacker', 'trick-room', 'win-condition'] },
  'porygon2':          { tier: 'A', role: ['support', 'trick-room', 'tank'] },
  'tornadus':          { tier: 'A', role: ['support', 'speed-control', 'tailwind'] },
  'tornadus-therian':  { tier: 'A', role: ['support', 'speed-control', 'tailwind'] },
  'whimsicott':        { tier: 'A', role: ['support', 'speed-control', 'tailwind'] },
  'grimmsnarl':        { tier: 'A', role: ['support', 'tailwind'] },
  'urshifu-rapid-strike': { tier: 'A', role: ['attacker'] },
  'urshifu':           { tier: 'A', role: ['attacker'] },
  'ogerpon-wellspring':{ tier: 'A', role: ['attacker', 'redirect'] },
  'ogerpon':           { tier: 'A', role: ['attacker', 'redirect'] },
  'hydreigon':         { tier: 'A', role: ['attacker', 'support'] },
  'tsareena':          { tier: 'A', role: ['support', 'fake-out', 'redirect'] },
  // ── B-Tier ─────────────────────────────────────────────────────────
  'basculegion':       { tier: 'B', role: ['attacker', 'rain'] },
  'primarina':         { tier: 'B', role: ['attacker', 'rain'] },
  'alolan ninetales':  { tier: 'B', role: ['support', 'weather', 'tailwind'] },
  'ninetales-alola':   { tier: 'B', role: ['support', 'weather', 'tailwind'] },
  'jumpluff':          { tier: 'B', role: ['support', 'tailwind'] },
  'charizard':         { tier: 'B', role: ['attacker', 'weather'] },
  'torkoal':           { tier: 'B', role: ['support', 'weather'] },
  'tyranitar':         { tier: 'B', role: ['attacker', 'weather'] },
  'electabuzz':        { tier: 'B', role: ['attacker'] },
  'volcarona':         { tier: 'B', role: ['attacker'] },
  'arcanine':          { tier: 'B', role: ['support', 'intimidate', 'fake-out'] },
  'arcanine-hisui':    { tier: 'B', role: ['support', 'intimidate'] },
  'smeargle':          { tier: 'B', role: ['support'] },
  'farigiraf':         { tier: 'B', role: ['support', 'trick-room'] },
  'indeedee-f':        { tier: 'B', role: ['support', 'trick-room', 'redirect'] },
  'indeedee':          { tier: 'B', role: ['support', 'trick-room', 'redirect'] },
  'hatterene':         { tier: 'B', role: ['support', 'trick-room', 'attacker'] },
  'flutter mane':      { tier: 'B', role: ['attacker', 'speed-control'] },  // banned in official Reg H but allowed here
  // ── C-Tier (niche / archetype-specific) ────────────────────────────
  'tauros-paldea':     { tier: 'C', role: ['attacker'] },
  'dragapult':         { tier: 'C', role: ['attacker', 'speed-control'] },
  'togekiss':          { tier: 'C', role: ['support', 'redirect'] },
  'clefairy':          { tier: 'C', role: ['support', 'redirect'] },
  'sylveon':           { tier: 'C', role: ['support', 'redirect'] },
  'politoed':          { tier: 'C', role: ['support', 'weather', 'rain'] },
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  'Sitrus Berry': 'Restaura 25% do HP quando o HP cai abaixo de 50%.',
  'Life Orb': 'Aumenta o dano em 30%, mas perde 10% do HP por ataque.',
  'Choice Specs': 'Aumenta Sp.Atk em 50%, mas prende o usuário em um move.',
  'Choice Scarf': 'Aumenta Speed em 50%, mas prende o usuário em um move.',
  'Choice Band': 'Aumenta Attack em 50%, mas prende o usuário em um move.',
  'Assault Vest': 'Aumenta Sp.Def em 50%, mas impede o uso de Status moves.',
  'Focus Sash': 'Sobrevive com 1 HP se atingido por um golpe fatal com HP cheio.',
  'Leftovers': 'Restaura 1/16 do HP máximo ao final de cada turno.',
  'Rocky Helmet': 'Causa 1/6 de dano ao atacante que usar golpes de contato.',
  'Safety Goggles': 'Imunidade a danos de clima (Sand/Hail) e golpes de pó (Spore).',
  'Clear Amulet': 'Impede que os atributos do usuário sejam reduzidos por rivais.',
  'Covert Cloak': 'Protege o usuário de efeitos secundários de ataques (ex: flinch).',
  'Mental Herb': 'Cura o usuário de efeitos como Taunt, Encore e Infatuation.',
  'White Herb': 'Restaura atributos reduzidos uma única vez.',
  'Eject Button': 'Troca o usuário imediatamente após receber dano.',
  'Red Card': 'Troca o oponente após o usuário receber dano do mesmo.',
  'Air Balloon': 'Torna o usuário imune a golpes do tipo Ground até estourar.',
};

// No restricted list in Regulation H — all legendaries and paradox are banned
const RESTRICTED_LIST: string[] = []; // kept for compatibility; not used for scoring

const TYPE_CHART: Record<string, string[]> = {
  fire:     ['water', 'rock', 'ground'],
  water:    ['grass', 'electric'],
  grass:    ['fire', 'ice', 'poison', 'flying', 'bug'],
  electric: ['ground'],
  ice:      ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison:   ['ground', 'psychic'],
  ground:   ['water', 'grass', 'ice'],
  flying:   ['electric', 'ice', 'rock'],
  psychic:  ['bug', 'ghost', 'dark'],
  bug:      ['fire', 'flying', 'rock'],
  rock:     ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost:    ['ghost', 'dark'],
  dragon:   ['ice', 'dragon', 'fairy'],
  dark:     ['fighting', 'bug', 'fairy'],
  steel:    ['fire', 'fighting', 'ground'],
  fairy:    ['poison', 'steel'],
  normal:   ['fighting'],
};

const POKEMON_TYPES: Record<string, string[]> = {
  // S/A-tier Reg H
  'incineroar': ['fire', 'dark'],
  'gholdengo': ['steel', 'ghost'],
  'kingambit': ['dark', 'steel'],
  'amoonguss': ['grass', 'poison'],
  'sneasler': ['poison', 'fighting'],
  'dragonite': ['dragon', 'flying'],
  'rillaboom': ['grass'],
  'pelipper': ['water', 'flying'],
  'archaludon': ['steel', 'dragon'],
  'ursaluna-bloodmoon': ['ground', 'normal'],
  'ursaluna': ['ground', 'normal'],
  'porygon2': ['normal'],
  'tornadus': ['flying'],
  'tornadus-therian': ['flying'],
  'whimsicott': ['grass', 'fairy'],
  'grimmsnarl': ['dark', 'fairy'],
  'urshifu-rapid-strike': ['water', 'fighting'],
  'urshifu': ['dark', 'fighting'],
  'ogerpon-wellspring': ['grass', 'water'],
  'ogerpon': ['grass'],
  'hydreigon': ['dark', 'dragon'],
  'tsareena': ['grass'],
  // B/C-tier
  'basculegion': ['water', 'ghost'],
  'primarina': ['water', 'fairy'],
  'alolan ninetales': ['ice', 'fairy'],
  'ninetales-alola': ['ice', 'fairy'],
  'ninetales': ['fire'],
  'jumpluff': ['grass', 'flying'],
  'charizard': ['fire', 'flying'],
  'charizard-mega-x': ['fire', 'dragon'],
  'charizard-mega-y': ['fire', 'flying'],
  'torkoal': ['fire'],
  'tyranitar': ['rock', 'dark'],
  'electabuzz': ['electric'],
  'electivire': ['electric'],
  'volcarona': ['bug', 'fire'],
  'arcanine': ['fire'],
  'arcanine-hisui': ['fire', 'rock'],
  'smeargle': ['normal'],
  'farigiraf': ['normal', 'psychic'],
  'indeedee-f': ['psychic', 'normal'],
  'indeedee': ['psychic', 'normal'],
  'hatterene': ['psychic', 'fairy'],
  'dragapult': ['dragon', 'ghost'],
  'togekiss': ['normal', 'flying'],
  'clefairy': ['normal'],
  'sylveon': ['fairy'],
  'politoed': ['water'],
  'tauros-paldea': ['fighting'],
  // Extra common Pokémon
  'garchomp': ['dragon', 'ground'],
  'garchomp-mega': ['dragon', 'ground'],
  'salamence': ['dragon', 'flying'],
  'salamence-mega': ['dragon', 'flying'],
  'metagross': ['steel', 'psychic'],
  'metagross-mega': ['steel', 'psychic'],
  'alakazam': ['psychic'],
  'alakazam-mega': ['psychic'],
  'gengar': ['ghost', 'poison'],
  'gengar-mega': ['ghost', 'poison'],
  'scizor': ['bug', 'steel'],
  'scizor-mega': ['bug', 'steel'],
  'lucario': ['fighting', 'steel'],
  'lucario-mega': ['fighting', 'steel'],
  'blaziken': ['fire', 'fighting'],
  'blaziken-mega': ['fire', 'fighting'],
  'gyarados': ['water', 'flying'],
  'gyarados-mega': ['water', 'dark'],
  'tyranitar-mega': ['rock', 'dark'],
  'blissey': ['normal'],
  'chansey': ['normal'],
  'ferrothorn': ['grass', 'steel'],
  'rotom-wash': ['electric', 'water'],
  'rotom-heat': ['electric', 'fire'],
  'corviknight': ['flying', 'steel'],
  'toxapex': ['poison', 'water'],
  'gliscor': ['ground', 'flying'],
  'landorus-therian': ['ground', 'flying'],
  'landorus': ['ground', 'flying'],
  'clefable': ['normal'],
  'flutter mane': ['ghost', 'fairy'],
  'iron hands': ['fighting', 'electric'],
  'great tusk': ['ground', 'fighting'],
  'iron valiant': ['fairy', 'fighting'],
};


// ─── TEAMMATE SUGGESTIONS (VGC 2025 / Reg H) ──────────────────────────────────

interface TeammateRec {
  name: string;
  reason: string;
  tier: 'S' | 'A' | 'B' | 'C';
}

function getTeammateRecommendations(lowerList: string[]): TeammateRec[] {
  const allRoles = lowerList.flatMap(p => META_STAPLES[p]?.role || []);
  const hasFakeOut = allRoles.includes('fake-out') || lowerList.some(p => ['incineroar','rillaboom','tsareena','hariyama','hitmontop','arcanine'].includes(p));
  const hasSpeedControl = allRoles.includes('tailwind') || allRoles.includes('speed-control') || lowerList.some(p => ['tornadus','tornadus-therian','whimsicott','grimmsnarl','jumpluff','alolan ninetales','ninetales-alola'].includes(p));
  const hasTrickRoom = allRoles.includes('trick-room') || lowerList.some(p => ['porygon2','farigiraf','hatterene','indeedee','indeedee-f'].includes(p));
  const hasRedirect = allRoles.includes('redirect') || lowerList.some(p => ['amoonguss','togekiss','clefairy','sylveon','tsareena','indeedee','indeedee-f','ogerpon','ogerpon-wellspring'].includes(p));
  const hasAttacker = allRoles.includes('attacker') || allRoles.includes('win-condition');
  const hasWeather = allRoles.includes('rain') || allRoles.includes('weather') || lowerList.some(p => ['pelipper','politoed','torkoal','tyranitar','alolan ninetales','ninetales-alola'].includes(p));

  const recs: TeammateRec[] = [];

  if (!hasFakeOut) {
    recs.push({ name: 'Incineroar', reason: 'Fake Out + Intimidate + Parting Shot: o suporte mais universal do VGC 2025', tier: 'S' });
    recs.push({ name: 'Tsareena', reason: 'Fake Out + Aromatherapy + redirect: suporte premium no Reg H', tier: 'A' });
  }

  if (!hasSpeedControl && !hasTrickRoom) {
    recs.push({ name: 'Tornadus', reason: 'Tailwind com Prankster — garantia de prioridade no turno crítico', tier: 'A' });
    recs.push({ name: 'Whimsicott', reason: 'Tailwind + Encore para travar setups — versátil e rápido', tier: 'A' });
  }

  if (!hasRedirect) {
    recs.push({ name: 'Amoonguss', reason: 'Rage Powder + Spore: o melhor Redirect do meta Reg H', tier: 'S' });
    recs.push({ name: 'Ogerpon-Wellspring', reason: 'Redirect + pressão ofensiva Water — core excelente com Incineroar', tier: 'A' });
  }

  if (!hasAttacker) {
    recs.push({ name: 'Kingambit', reason: 'Win condition física S-tier — Supreme Overlord + Sucker Punch', tier: 'S' });
    recs.push({ name: 'Dragonite', reason: 'ExtremeSpeed + Multiscale: attacker consistente e difícil de abater', tier: 'A' });
  }

  if (!hasWeather && recs.length < 3) {
    recs.push({ name: 'Pelipper', reason: 'Rain + Tailwind num só: core de Chuva com Archaludon ou Basculegion', tier: 'A' });
  }

  // Generic fillers
  if (recs.length < 4) {
    if (!lowerList.includes('gholdengo')) recs.push({ name: 'Gholdengo', reason: 'Bom Olhar garante suporte único — bloqueia moves que afetam aliados e pressiona ofensivamente', tier: 'S' });
    if (!lowerList.includes('incineroar')) recs.push({ name: 'Incineroar', reason: 'Suporte universal S-tier — entrará em qualquer composição Reg H', tier: 'S' });
    if (!lowerList.includes('amoonguss')) recs.push({ name: 'Amoonguss', reason: 'Redirect + Spore S-tier — dueto favorito com Gholdengo ou Sneasler', tier: 'S' });
  }

  const seen = new Set<string>();
  return recs.filter(r => {
    const key = r.name.toLowerCase();
    if (seen.has(key) || lowerList.includes(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

interface Criterion {
  name: string;
  score: number;
  max: number;
  detail: string;
}

interface AnalysisResult {
  score: number;
  rank: string;
  rankColor: string;
  mode: AnalysisMode;
  teamPokemon: PokemonBuild[];
  metaStaples: string[];
  restrictedCount: number;
  hasSpeedControl: boolean;
  hasRedirect: boolean;
  hasFakeOut: boolean;
  hasTrickRoom: boolean;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  typeWeaknesses: string[];
  isSingleMode: boolean;
  teammateRecs: TeammateRec[];
  criteria: Criterion[];
  archetype?: string;
}

// ─── SHOWDOWN PARSER ──────────────────────────────────────────────────────────
function parseShowdownTeam(text: string): PokemonSlot[] {
  const slots: PokemonSlot[] = [];
  const sections = text.split('\n\n');
  
  for (const sect of sections) {
    if (slots.length >= 6) break;
    const lines = sect.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const namePart = firstLine.split('@')[0].split('(');
    let name = (namePart.length > 1 ? namePart[1].split(')')[0] : namePart[0]).trim();
    const item = firstLine.includes('@') ? firstLine.split('@')[1].trim() : '';
    
    let ability = '';
    let teraType = '';
    const moves: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('Ability:')) ability = line.replace('Ability:', '').trim();
      if (line.startsWith('Tera Type:')) teraType = line.replace('Tera Type:', '').trim();
      if (line.startsWith('-')) moves.push(line.replace('-', '').trim());
    }
    
    while(moves.length < 4) moves.push('');
    
    slots.push({
      name,
      ability,
      item,
      teraType,
      moves: moves.slice(0, 4) as [string, string, string, string]
    });
  }

  while (slots.length < 6) slots.push({ ...INITIAL_SLOT });
  return slots;
}

function analyzeTeam(teamBuilds: PokemonBuild[], mode: AnalysisMode = 'tournament'): AnalysisResult {
  const lowerList = teamBuilds.map(p => p.name);
  const isSingleMode = lowerList.length === 1;
  const hasMoves = teamBuilds.some(b => b.moves.length > 0);

  const metaStaples = lowerList.filter(p => META_STAPLES[p]);
  const restrictedPokemon = lowerList.filter(p =>
    RESTRICTED_LIST.some(r => p.includes(r) || r.includes(p))
  );
  const restrictedCount = restrictedPokemon.length;

  const allRoles = metaStaples.flatMap(p => META_STAPLES[p]?.role || []);
  const explicitTailwind = teamBuilds.some(b => b.moves.includes('tailwind'));
  const explicitTR = teamBuilds.some(b => b.moves.includes('trick room'));
  const explicitRedirect = teamBuilds.some(b => b.moves.includes('rage powder') || b.moves.includes('follow me'));
  const explicitFakeOut = teamBuilds.some(b => b.moves.includes('fake out'));
  const explicitTaunt = teamBuilds.some(b => b.moves.includes('taunt'));
  const explicitEncore = teamBuilds.some(b => b.moves.includes('encore'));
  const hasGoggles = teamBuilds.some(b => b.item?.toLowerCase().includes('goggles'));

  const hasSpeedControl = hasMoves ? explicitTailwind :
    (allRoles.includes('speed-control') || allRoles.includes('tailwind') ||
    lowerList.some(p => ['tornadus','tornadus-therian','whimsicott','grimmsnarl','talonflame','murkrow'].includes(p)));
  const hasTrickRoom = hasMoves ? explicitTR :
    (allRoles.includes('trick-room') ||
    lowerList.some(p => ['porygon2','farigiraf','hatterene','aromatisse','indeedee'].includes(p)));
  const hasRedirect = hasMoves ? explicitRedirect :
    (allRoles.includes('redirect') ||
    lowerList.some(p => ['amoonguss','togekiss','clefairy','indeedee','sylveon'].includes(p)));
  const hasFakeOut = hasMoves ? explicitFakeOut :
    (allRoles.includes('fake-out') ||
    lowerList.some(p => ['incineroar','rillaboom','tsareena','hariyama','hitmontop','ambipom','persian','sneasler'].includes(p)));

  const typeWeaknessMap: Record<string, number> = {};
  const teraSynergies: string[] = [];

  for (const b of teamBuilds) {
    const p = b.name.toLowerCase();
    const types = POKEMON_TYPES[p] || [];
    const tera = b.teraType && b.teraType !== 'Selecione...' ? b.teraType : null;
    
    let defensiveTypes = [...types];
    
    if (tera && tera !== 'Stellar') {
      defensiveTypes = [tera.toLowerCase()];
      
      // Detect if Tera covers a base weakness
      const baseWeaks = new Set(types.flatMap(t => TYPE_CHART[t] || []));
      const teraWeaks = new Set(TYPE_CHART[tera.toLowerCase()] || []);
      
      // Check if any base weakness is NOT a tera weakness
      const covered = [...baseWeaks].filter(w => !teraWeaks.has(w));
      if (covered.length > 0) {
        teraSynergies.push(`Tera ${tera} em ${b.name} cobre fraquezas a ${covered.slice(0, 2).join(', ')}`);
      }
    }

    for (const type of defensiveTypes) {
      for (const w of TYPE_CHART[type] || []) {
        typeWeaknessMap[w] = (typeWeaknessMap[w] || 0) + 1;
      }
    }
  }

  const typeWeaknesses = Object.entries(typeWeaknessMap)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type.charAt(0).toUpperCase() + type.slice(1)} (${count} Pokémon fracos)`);

  const criteria: Criterion[] = [];

  // ── WEIGHT CONFIGURATION BY MODE ───────────────────────────────
  const weights = {
    tournament: { meta: 30, coverage: 10, weakness: 10, speed: 20, support: 10, turn: 10, redirect: 10, win: 0, antimeta: 0 },
    casual:     { meta: 10, coverage: 25, weakness: 25, speed: 10, support: 10, turn: 10, redirect: 5,  win: 5, antimeta: 0 },
    antimeta:   { meta: 10, coverage: 10, weakness: 10, speed: 15, support: 15, turn: 10, redirect: 10, win: 0, antimeta: 20 }
  };
  const w = weights[mode];

  // 1. Meta Picks
  let c1 = 0;
  for (const p of lowerList) {
    const tier = META_STAPLES[p]?.tier;
    if (tier === 'S') c1 += 5;
    else if (tier === 'A') c1 += 3;
    else if (tier === 'B') c1 += 2;
    else if (tier === 'C') c1 += 1;
  }
  c1 = Math.min(w.meta, c1 * (w.meta / 20)); // Normalized scale
  criteria.push({
    name: 'Meta-Game Compliance', score: Math.round(c1), max: w.meta,
    detail: mode === 'casual' ? 'Peso reduzido para picks casuais' : `${metaStaples.length} meta picks identificados`
  });

  // 2. Cobertura de Tipos
  const offTypes = new Set<string>();
  lowerList.forEach(p => (POKEMON_TYPES[p] || []).forEach(t => offTypes.add(t)));
  let c2 = offTypes.size >= 8 ? w.coverage : offTypes.size >= 6 ? w.coverage * 0.8 : offTypes.size >= 4 ? w.coverage * 0.6 : w.coverage * 0.3;
  criteria.push({ name: 'Cobertura Ofensiva', score: Math.round(c2), max: w.coverage, detail: `${offTypes.size} tipos cobertos` });

  // 3. Fraquezas Repetidas
  const sev = Object.values(typeWeaknessMap).filter(v => v >= 3).length;
  const med = Object.values(typeWeaknessMap).filter(v => v === 2).length;
  let c3 = Math.max(0, w.weakness - (sev * (w.weakness/3)) - (med * (w.weakness/10)));
  criteria.push({ name: 'Sólidez Defensiva', score: Math.round(c3), max: w.weakness, detail: sev > 0 ? `${sev} fraquezas críticas` : 'Distribuição equilibrada' });

  // 4. Speed Control
  let c4 = 0;
  if (hasSpeedControl || hasTrickRoom) c4 = w.speed;
  else if (lowerList.some(p => META_STAPLES[p]?.role.includes('speed-control'))) c4 = w.speed * 0.5;
  criteria.push({ name: 'Controle de Velocidade', score: Math.round(c4), max: w.speed, detail: hasSpeedControl ? 'Tailwind/TR ativo' : 'Vulnerável' });

  // 5. Suporte & Utilitários
  const hasIntimidate = lowerList.some(p => ['incineroar','arcanine','gyarados','landorus-therian'].includes(p));
  const hasTerrain = lowerList.some(p => ['rillaboom','indeedee'].includes(p));
  const supportTools = [hasIntimidate, hasTerrain, hasMoves && (explicitTaunt || explicitEncore)].filter(Boolean).length;
  const c5 = Math.min(w.support, supportTools * (w.support/2));
  criteria.push({ name: 'Ferramentas de Suporte', score: Math.round(c5), max: w.support, detail: `${supportTools} utilitários de campo` });

  // 6. Pressão de Turno (Fake Out)
  const c6 = hasFakeOut ? w.turn : 0;
  criteria.push({ name: 'Pressão de Turno', score: c6, max: w.turn, detail: hasFakeOut ? 'Fake Out presente' : 'Sem Fake Out' });

  // 7. Redirecionamento
  const c7 = hasRedirect ? w.redirect : 0;
  criteria.push({ name: 'Redirecionamento', score: c7, max: w.redirect, detail: hasRedirect ? 'Redirect ativo' : 'Sem proteção' });

  // 8. Win Condition (Só para Casual/Tournament base)
  let c8 = 0;
  if (w.win > 0) {
    const hasWin = lowerList.some(p => META_STAPLES[p]?.role.includes('win-condition'));
    c8 = hasWin ? w.win : w.win * 0.4;
  }
  if (w.win > 0) criteria.push({ name: 'Condição de Vitória', score: c8, max: w.win, detail: 'Foco em finalização' });

  // 9. Anti-Meta Mode Bonus
  let c9 = 0;
  if (mode === 'antimeta') {
    const antiMetaTools = [];
    if (lowerList.some(p => ['kingambit','milotic','annihilape'].includes(p))) antiMetaTools.push('Anti-Intimidate');
    if (explicitTaunt || explicitEncore) antiMetaTools.push('Anti-Setup/Status');
    if (hasGoggles || lowerList.some(p => POKEMON_TYPES[p]?.includes('grass'))) antiMetaTools.push('Anti-Spore');
    if (lowerList.some(p => ['gholdengo','farigiraf','tsareena'].includes(p))) antiMetaTools.push('Anti-Priority/Effect');
    c9 = Math.min(w.antimeta, antiMetaTools.length * (w.antimeta/3));
    criteria.push({ name: 'Fator Anti-Meta', score: Math.round(c9), max: w.antimeta, detail: antiMetaTools.length > 0 ? antiMetaTools.join(', ') : 'Poucos counters detectados' });
  }

  let score: number;
  if (isSingleMode) {
    const p = lowerList[0];
    const info = META_STAPLES[p];
    score = !info ? 20 : info.tier === 'S' ? 70 : info.tier === 'A' ? 55 : 40;
    if (mode === 'casual') score += 15;
  } else {
    score = criteria.reduce((s, c) => s + c.score, 0);
    // Tera Synergy Bonus
    if (teraSynergies.length > 0) score += Math.min(10, teraSynergies.length * 3);
  }
  score = Math.min(100, Math.max(0, Math.round(score)));

  let rank: string;
  let rankColor: string;
  if (score >= 85) { rank = 'S'; rankColor = 'text-yellow-400'; }
  else if (score >= 70) { rank = 'A'; rankColor = 'text-green-400'; }
  else if (score >= 55) { rank = 'B'; rankColor = 'text-blue-400'; }
  else if (score >= 40) { rank = 'C'; rankColor = 'text-orange-400'; }
  else { rank = 'D'; rankColor = 'text-red-400'; }

  // ── STRENGTHS / WEAKNESSES / SUGGESTIONS ───────────────────────────
  const strengths: string[] = [];
  const weaknessList: string[] = [];
  const suggestions: string[] = [];

  if (isSingleMode) {
    const p = lowerList[0];
    const info = META_STAPLES[p];
    const displayName = p.charAt(0).toUpperCase() + p.slice(1);
    if (info) {
      const roleLabels: Record<string, string> = {
        attacker:'Atacante',support:'Suporte','fake-out':'Fake Out',redirect:'Redirect',
        tailwind:'Tailwind','speed-control':'Speed Control','trick-room':'Trick Room',
        terrain:'Terrain',intimidate:'Intimidate',tank:'Tank',weather:'Weather',rain:'Chuva',sun:'Sol',water:'Pressão Água',
      };
      strengths.push(`Tier ${info.tier} no meta VGC 2025 — ${info.role.map(r => roleLabels[r]||r).join(', ')}`);
      if (info.tier === 'S') strengths.push('Presente nos principais times de 2025');
    } else {
      weaknessList.push(`${displayName} não é um pick comum no meta VGC 2025 (Reg H)`);
      suggestions.push('Considere opções tier S/A que atendam a esse papel no seu time');
    }
    const pokTypes = POKEMON_TYPES[p] || [];
    if (pokTypes.length > 0) {
      const uniqueWeaks = [...new Set(pokTypes.flatMap(t => TYPE_CHART[t] || []))];
      if (uniqueWeaks.length > 0) weaknessList.push(`Fraco a: ${uniqueWeaks.map(t => t.charAt(0).toUpperCase()+t.slice(1)).join(', ')}`);
    }
    suggestions.push(`Monte o time cobrindo as mecânicas de ${displayName}`);
  } else {
    if (metaStaples.length >= 3) strengths.push(`Meta-staples sólidos: ${metaStaples.slice(0,3).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(', ')}`);
    if (hasFakeOut) strengths.push('Fake Out garantido');
    if (hasRedirect) strengths.push('Redirect ativo');
    if (hasSpeedControl) strengths.push('Tailwind ativo');
    if (hasTrickRoom) strengths.push('Trick Room identificado');
    const hasWinCond = lowerList.some(p => META_STAPLES[p]?.role.includes('win-condition'));
    if (hasWinCond) strengths.push('Win condition identificada');
    
    // Core Detections
    if (offTypes.has('fire') && offTypes.has('water') && offTypes.has('grass')) {
        strengths.push('Sinergia: Core FWG (Fire-Water-Grass) ativo');
    }
    if (offTypes.has('fairy') && offTypes.has('dragon') && offTypes.has('steel')) {
        strengths.push('Sinergia: Fantasy Core (Fairy-Dragon-Steel) ativo');
    }

    if (strengths.length === 0) strengths.push('Time em fase inicial de planejamento');
    
    // Tera Synergies
    teraSynergies.forEach(s => strengths.push(`Sinergia Tera: ${s}`));
    if (!hasSpeedControl && !hasTrickRoom) weaknessList.push('Vulnerável à falta de Speed Control');
    if (!hasRedirect) weaknessList.push('Sem Redirect — core vulnerável');
    if (!hasFakeOut) weaknessList.push('Sem Fake Out');
    if (metaStaples.length === 0 && mode !== 'casual') weaknessList.push('Nenhum pick de tier S/A identificado');
    if (typeWeaknesses.length > 0) weaknessList.push(`Fraqueza crítica defensiva: ${typeWeaknesses[0]}`);
    if (lowerList.length < 6) weaknessList.push(`Time com menos de 6 Pokémon detectados`);
    if (!hasFakeOut) suggestions.push('Incineroar ou Rillaboom provêm Fake Out essencial');
    if (!hasSpeedControl && !hasTrickRoom) suggestions.push('Adicione Tailwind (Ex: Whimsicott/Tornadus) ou Trick Room');
    if (!hasRedirect) suggestions.push('Amoonguss ou Volcarona para oferecer Redirect');
    if (sev > 0) suggestions.push(`Reavalie Tipos ou adicione Tera Types mitigando: ${typeWeaknesses[0]}`);
    if (suggestions.length === 0) suggestions.push('O core está excelente! Foco agora nos spreads de EVs.');
  }

  // Archetype Detection
  let archetype = 'General Balance';
  const hasRain = lowerList.includes('pelipper') || lowerList.includes('politoed') || teamBuilds.some(b => b.moves.includes('rain dance'));
  const hasSun = lowerList.includes('torkoal') || lowerList.includes('ninetales') || teamBuilds.some(b => b.moves.includes('sunny day'));
  const hasTrickRoomArchetype = hasTrickRoom && (lowerList.includes('ursaluna') || lowerList.includes('kingambit') || lowerList.includes('hatterene'));
  const hasTailwindArchetype = hasSpeedControl && !hasTrickRoom && (lowerList.includes('gholdengo') || lowerList.includes('sneasler'));

  if (hasRain && lowerList.includes('archaludon')) archetype = 'Rain Offense';
  else if (hasRain) archetype = 'Rain Core';
  else if (hasSun && lowerList.includes('venusaur')) archetype = 'Sun Core';
  else if (hasSun) archetype = 'Sun-based Team';
  else if (hasTrickRoomArchetype) archetype = 'Trick Room';
  else if (hasTailwindArchetype) archetype = 'Fast Tailwind';
  else if (lowerList.includes('grimmsnarl') || lowerList.includes('alolan ninetales') || lowerList.includes('ninetales-alola')) archetype = 'Screen/Support';

  const teammateRecs = getTeammateRecommendations(lowerList);

  return {
    score,
    rank,
    rankColor,
    mode,
    teamPokemon: teamBuilds,
    metaStaples,
    restrictedCount,
    hasSpeedControl,
    hasRedirect,
    hasFakeOut,
    hasTrickRoom,
    strengths,
    weaknesses: weaknessList,
    suggestions,
    typeWeaknesses,
    isSingleMode,
    teammateRecs,
    criteria,
    archetype,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

// ─── SUB-COMPONENTS FOR INPUT ──────────────────────────────────────────────

const PortalDropdown = ({ isOpen, anchorRef, children }: { isOpen: boolean, anchorRef: React.RefObject<HTMLDivElement | null>, children: React.ReactNode }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed z-[9999]" 
      style={{ top: coords.top + 4, left: coords.left, width: coords.width }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
};

const AutocompleteInput = ({ value, onChange, placeholder, icon: Icon }: any) => {
  const [search, setSearch] = useState(value);
  const [showList, setShowList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search || search.length < 2) return [];
    return POKEMON_DATA.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
  }, [search]);

  useEffect(() => {
    const clickOut = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowList(true); onChange(e.target.value); }}
          onFocus={() => setShowList(true)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold text-white outline-none focus:border-primary/50 transition-all"
        />
      </div>
      <PortalDropdown isOpen={showList && filtered.length > 0} anchorRef={containerRef}>
        {filtered.map(p => (
          <button 
            key={p.id}
            onMouseDown={(e) => { e.preventDefault(); setSearch(p.name); onChange(p.name); setShowList(false); }}
            className="w-full px-4 py-2 text-left text-[10px] font-bold text-gray-400 hover:bg-primary/10 hover:text-white transition-colors flex items-center gap-2 border-b border-white/5 last:border-0"
          >
            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} className="w-6 h-6 [image-rendering:pixelated]" alt="" />
            {p.name}
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
};

const ItemAutocompleteInput = ({ value, onChange, placeholder }: any) => {
  const [search, setSearch] = useState(value);
  const [showList, setShowList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search || search.length < 2) return [];
    return ITEMS_DATA.filter(it => it.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
  }, [search]);

  useEffect(() => {
    const clickOut = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  // Normalização para PokeAPI (lowercase, hyphens)
  const getItemSprite = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowList(true); onChange(e.target.value); }}
          onFocus={() => setShowList(true)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold text-white outline-none focus:border-primary/50 transition-all"
        />
      </div>
      <PortalDropdown isOpen={showList && filtered.length > 0} anchorRef={containerRef}>
        {filtered.map(it => (
          <button 
            key={it}
            onMouseDown={(e) => { e.preventDefault(); setSearch(it); onChange(it); setShowList(false); }}
            className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 group"
          >
            <div className="flex items-center gap-3">
              <img 
                 src={getItemSprite(it)} 
                 className="w-6 h-6 [image-rendering:pixelated] shrink-0" 
                 onError={(e: any) => { e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'; }}
                 alt="" 
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white group-hover:text-primary transition-colors">{it}</span>
                {ITEM_DESCRIPTIONS[it] && (
                  <span className="text-[8px] text-gray-500 font-medium truncate italic leading-tight">{ITEM_DESCRIPTIONS[it]}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
};

const MoveAutocompleteInput = ({ value, onChange, placeholder, selectedMoves = [] }: any) => {
  const [search, setSearch] = useState(value);
  const [showList, setShowList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search || search.length < 2) return [];
    return MOVES_DATA.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase()) && 
      !selectedMoves.some((sm: string) => sm.toLowerCase() === m.name.toLowerCase())
    ).slice(0, 5);
  }, [search, selectedMoves]);

  useEffect(() => {
    const clickOut = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const getCategoryIcon = (cat: string) => {
    if (cat === 'Physical') return <Swords size={10} className="text-orange-400" />;
    if (cat === 'Special') return <Target size={10} className="text-blue-400" />;
    return <Shield size={10} className="text-gray-400" />;
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <Star size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
        <input 
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowList(true); onChange(e.target.value); }}
          onFocus={() => setShowList(true)}
          placeholder={placeholder}
          className="w-full bg-black/20 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-[9px] font-bold text-gray-300 outline-none focus:border-white/20 transition-all"
        />
      </div>
      <PortalDropdown isOpen={showList && filtered.length > 0} anchorRef={containerRef}>
        {filtered.map(m => (
          <button 
            key={m.name}
            onMouseDown={(e) => { e.preventDefault(); setSearch(m.name); onChange(m.name); setShowList(false); }}
            className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-white group-hover:text-primary transition-colors">{m.name}</span>
              <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                {getCategoryIcon(m.category)}
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${TYPE_COLORS[m.type as keyof typeof TYPE_COLORS]}44`, color: TYPE_COLORS[m.type as keyof typeof TYPE_COLORS] }}>
                   {m.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[8px] font-bold text-gray-500">
              <span className="flex items-center gap-1"><Zap size={8} /> {m.power || '--'}</span>
              <span className="flex items-center gap-1"><Target size={8} /> {m.accuracy || '--'}%</span>
            </div>
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
};

const CustomMiniSelect = ({ label, value, options, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 ml-1">{label}</p>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-bold text-left flex justify-between items-center group hover:border-white/10 transition-all"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{value || placeholder}</span>
        <ChevronDown size={12} className={`text-gray-500 group-hover:text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <PortalDropdown isOpen={isOpen} anchorRef={containerRef}>
        <div className="max-h-48 overflow-y-auto custom-scrollbar">
          {options.map((opt: string) => (
            <button 
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 hover:bg-primary/20 hover:text-white transition-colors border-b border-white/5 last:border-0"
            >
              {opt}
            </button>
          ))}
        </div>
      </PortalDropdown>
    </div>
  );
};
const PokemonSlotEditor = ({ index, slot, isOpen, onToggle, onUpdate }: { index: number, slot: PokemonSlot, isOpen: boolean, onToggle: () => void, onUpdate: (upd: Partial<PokemonSlot>) => void }) => {
  const selectedPoke = useMemo(() => POKEMON_DATA.find(p => p.name.toLowerCase() === slot.name.toLowerCase()), [slot.name]);
  
  const abilityOptions = useMemo(() => {
    if (!selectedPoke) return ['Seleção necessária'];
    const opts = [...selectedPoke.abilities];
    if (selectedPoke.hiddenAbility) opts.push(selectedPoke.hiddenAbility + ' (HA)');
    return opts;
  }, [selectedPoke]);

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-white/[0.03] border-primary/30' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
      <button 
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isOpen ? 'bg-primary text-black' : 'bg-white/5 text-gray-500'}`}>
            {index + 1}
          </div>
          <div className="text-left">
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${slot.name ? 'text-white' : 'text-gray-600'}`}>
              {slot.name || `Vaga ${index + 1}`}
            </h4>
            {slot.name && (
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                {slot.ability || 'Sem Habilidade'} · {slot.item || 'Sem Item'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {slot.name && selectedPoke && (
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPoke.id}.png`} 
              className="w-10 h-10 [image-rendering:pixelated]" 
              alt=""
            />
          )}
          <ChevronRight size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-90 text-primary' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Espécie</p>
                  <AutocompleteInput 
                    value={slot.name} 
                    onChange={(val: string) => onUpdate({ name: val })} 
                    placeholder="Nome do Pokémon (Ex: Incineroar)"
                    icon={Search}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Item Segurado</p>
                  <ItemAutocompleteInput 
                    value={slot.item} 
                    onChange={(val: string) => onUpdate({ item: val })} 
                    placeholder="Ex: Sitrus Berry"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomMiniSelect 
                  label="Habilidade"
                  value={slot.ability}
                  options={abilityOptions}
                  onChange={(val: string) => onUpdate({ ability: val })}
                  placeholder="Selecione..."
                />
                <CustomMiniSelect 
                  label="Tera Type"
                  value={slot.teraType}
                  options={TERA_TYPES}
                  onChange={(val: string) => onUpdate({ teraType: val })}
                  placeholder="Selecione..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1 text-center">Moveset</p>
                <div className="grid grid-cols-2 gap-2">
                   {slot.moves.map((move, mIdx) => (
                      <MoveAutocompleteInput 
                        key={mIdx}
                        value={move}
                        selectedMoves={slot.moves}
                        onChange={(val: string) => {
                          const newMoves = [...slot.moves];
                          newMoves[mIdx] = val;
                          onUpdate({ moves: newMoves });
                        }}
                        placeholder={`Move ${mIdx + 1}`}
                      />
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ConsultoriaSystem = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('tournament');
  const [teamDraft, setTeamDraft] = useState<PokemonSlot[]>(Array(6).fill(null).map(() => ({ ...INITIAL_SLOT })));
  const [activeSlot, setActiveSlot] = useState<number | null>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const updateSlot = (index: number, updates: Partial<PokemonSlot>) => {
    const newDraft = [...teamDraft];
    newDraft[index] = { ...newDraft[index], ...updates };
    setTeamDraft(newDraft);
  };

  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  const handleImportPaste = () => {
    const newSlots = parseShowdownTeam(pasteText);
    setTeamDraft(newSlots);
    setShowPasteArea(false);
    setPasteText('');
  };

  const handleBuy = (slot: any) => {
    if (!slot.name) return;
    const isPurchasable = POKEMON_DATA.some(p => p.name.toLowerCase() === slot.name.toLowerCase());
    if (!isPurchasable) {
       alert("Este Pokémon não está disponível para encomenda direta no momento.");
       return;
    }

    // Sugerir IVs (0 Spe se tiver Trick Room ou for lento)
    let ivs = '5';
    let ignoredIvs = ['Atk'];
    if (slot.moves?.includes('trick room') || ['ursaluna', 'torkoal', 'hatterene'].includes(slot.name.toLowerCase())) {
        ignoredIvs = ['Spe'];
    }

    navigate('/order', { 
        state: { 
            pokemon: slot.name.charAt(0).toUpperCase() + slot.name.slice(1).toLowerCase(),
            ability: slot.ability.replace(' (HA)', ''),
            hasHA: slot.ability.includes('(HA)'),
            ivs: ivs,
            ignoredIvs: ignoredIvs,
            nature: 'Aleatória'
        } 
    });
  };

  const handleAnalyze = () => {
    const filledSlots = teamDraft.filter(s => s.name.trim() !== '');
    if (filledSlots.length === 0) return;
    
    setIsAnalyzing(true);

    setTimeout(() => {
      const builds: PokemonBuild[] = filledSlots.map(s => {
        const pokeObj = POKEMON_DATA.find(p => p.name.toLowerCase() === s.name.trim().toLowerCase());
        return {
          name: s.name.trim().toLowerCase(),
          id: pokeObj?.id || null,
          ability: s.ability,
          item: s.item,
          teraType: s.teraType,
          moves: s.moves.filter(m => m.trim() !== '').map(m => m.toLowerCase())
        };
      });

      const analysis = analyzeTeam(builds, analysisMode);
      setResult(analysis);
      setShowModal(false);
      setIsAnalyzing(false);
    }, 1200);
  };

  const ScoreRing = ({ score }: { score: number }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 85 ? '#facc15' : score >= 70 ? '#4ade80' : score >= 55 ? '#60a5fa' : score >= 40 ? '#fb923c' : '#f87171';
    return (
      <svg width="140" height="140" className="rotate-[-90deg]">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
    );
  };

  const tierColor = (tier: 'S' | 'A' | 'B' | 'C') =>
    tier === 'S' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : tier === 'A' ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : tier === 'B' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    : 'text-orange-400 bg-orange-400/10 border-orange-400/20';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 animate-fade min-h-[85vh]">
      {/* Back */}
      <button
        onClick={() => navigate('/hub/competitivo')}
        className="mb-8 text-[10px] font-black text-gray-500 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest"
      >
        <ChevronDown size={14} className="rotate-90" /> Voltar para Competitivo
      </button>

      {/* Header */}
      <div className="flex items-center gap-5 mb-12">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-primary/20 text-primary border border-primary/20 shadow-[0_0_30px_var(--primary-glow)] shrink-0">
          <Swords size={40} />
        </div>
        <div>
          <h1 className="pixel-title text-4xl tracking-tighter mb-1">CONSULTORIA <span className="text-primary">COMPETITIVA</span></h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Meta VGC 2025 · Regulação H · Análise baseada no metagame atual
          </p>
        </div>
      </div>

      {/* Action Hero Card */}
      {!result && (
        <div className="glow-card p-12 text-center border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_40px_var(--primary-glow)] group-hover:scale-105 transition-transform duration-500">
              <Target size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="pixel-title text-2xl mb-3">ANALISE SEU TIME</h2>
              <p className="text-gray-400 font-bold text-sm leading-relaxed max-w-lg mx-auto">
                Cole seu time no formato <span className="text-primary">Pokémon Showdown</span> ou insira os nomes. Receberá uma nota de 0 a 100, fraquezas identificadas e sugestões estratégicas baseadas no <span className="text-secondary">meta competitivo atual</span>.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-[9px] font-black uppercase tracking-widest">
              {['Meta VGC 2025', 'Regulação H', 'Sinergia', 'Coverage'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-500">{tag}</span>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-manda !bg-primary !text-black shadow-[0_0_25px_var(--primary-glow)] mx-auto !py-4 !px-12 text-sm hover:scale-105 transition-transform"
            >
              INSERIR TIME E CONSULTAR
            </button>
          </div>
        </div>
      )}

      {/* Result Dashboard */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score Card */}
            <div className="glow-card p-8 border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Ring */}
                <div className="relative shrink-0">
                  <ScoreRing score={result.score} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-4xl font-black text-white"
                    >
                      {result.score}
                    </motion.span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">/100</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    <h2 className="pixel-title text-3xl">
                      RANK <span className={result.rankColor}>{result.rank}</span>
                    </h2>
                    <span className="px-3 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest">
                       Modo: {result.mode === 'tournament' ? '🏆 Torneio' : result.mode === 'casual' ? '🎮 Casual' : '🛡️ Anti-Meta'}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                       Arquétipo: {result.archetype}
                    </span>
                    {result.isSingleMode && (
                      <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase">
                        Análise Individual
                      </span>
                    )}
                    {result.restrictedCount > 1 && (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[9px] font-black uppercase animate-pulse">
                        ⚠️ TIME ILEGAL
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 font-bold text-sm">
                    {result.isSingleMode
                      ? (result.score >= 70
                          ? (result.mode === 'tournament' 
                              ? `Excelente! ${result.teamPokemon[0].name.charAt(0).toUpperCase() + result.teamPokemon[0].name.slice(1)} brilha intensamente no meta VGC 2025.`
                              : result.mode === 'casual'
                              ? `Ótima escolha! ${result.teamPokemon[0].name.charAt(0).toUpperCase() + result.teamPokemon[0].name.slice(1)} é extremamente sólido e divertido para o modo Casual.`
                              : `Estratégico! ${result.teamPokemon[0].name.charAt(0).toUpperCase() + result.teamPokemon[0].name.slice(1)} é uma resposta de elite para lidar com o Meta atual.`)
                          : result.score >= 50
                          ? `Opção viável. Garanta que seus parceiros ofereçam suporte adequado para que este Pokémon performe bem.`
                          : `Pick mais nichado. Use o fator surpresa a seu favor para extrair o melhor deste Pokémon.`)
                      : (result.score >= 85 ? 'Time fortíssimo! Combinação digna de torneios de alto nível.' :
                         result.score >= 70 ? 'Time robusto! Boa presença de staples e core definido.' :
                         result.score >= 55 ? 'Time mediano. Falta controle de speed ou pressão ofensiva constante.' :
                         result.score >= 40 ? 'Time com graves deficiências contra os times padrão.' :
                         'Time incompatível com o peso do meta. Revise suas escolhas ou estratégia central.')
                    }
                  </p>
                  {/* Detected Pokémon Visuals */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                    {result.teamPokemon.map((p, idx) => (
                      <div key={idx} className="relative flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] min-w-[80px] group/poke">
                        {p.id && (
                           <button 
                             onClick={() => handleBuy(p)}
                             className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-black rounded-lg flex items-center justify-center opacity-0 group-hover/poke:opacity-100 transition-all z-20 hover:scale-110 shadow-lg"
                             title="Comprar Pokémon"
                           >
                             <ShoppingBag size={12} />
                           </button>
                        )}
                        {p.id ? (
                           <img 
                             src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} 
                             alt={p.name} 
                             className="w-16 h-16 [image-rendering:pixelated]"
                           />
                        ) : (
                           <div className="w-16 h-16 flex items-center justify-center text-gray-600 opacity-50">
                             <Swords size={24} />
                           </div>
                        )}
                        <span className="text-[10px] font-black uppercase text-gray-300 mt-1 truncate max-w-[70px]">
                          {p.name}
                        </span>
                        {p.teraType && (
                           <div className="absolute top-1 right-1 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm font-bold uppercase border border-primary/30">
                             Tera {p.teraType}
                           </div>
                        )}
                        {p.item && (
                           <div className="text-[7px] text-gray-500 mt-1 uppercase text-center max-w-[70px] truncate" title={p.item}>
                             {p.item}
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Criteria Grid — only for team mode */}
                {!result.isSingleMode && (
                  <div className="shrink-0 space-y-2 min-w-[160px]">
                    {result.criteria.map(c => {
                      const pct = Math.round((c.score / c.max) * 100);
                      const barColor = pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : pct >= 25 ? 'bg-orange-400' : 'bg-red-500';
                      return (
                        <div key={c.name}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider truncate max-w-[110px]">{c.name}</span>
                            <span className="text-[9px] font-black text-white ml-1 shrink-0">{c.score}<span className="text-gray-600">/{c.max}</span></span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glow-card p-6 border-green-500/20">
                <h3 className="pixel-title text-xs text-green-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> PONTOS FORTES
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-gray-300">
                      <Star size={10} className="text-green-400 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glow-card p-6 border-red-500/20">
                <h3 className="pixel-title text-xs text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> FRAQUEZAS DETECTADAS
                </h3>
                <ul className="space-y-2">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-gray-300">
                      <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                  {result.weaknesses.length === 0 && (
                    <li className="text-[10px] text-gray-600 italic font-bold">Nenhuma fraqueza crítica identificada.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Type Weaknesses — only for team mode */}
            {!result.isSingleMode && result.typeWeaknesses.length > 0 && (
              <div className="glow-card p-6 border-orange-500/20">
                <h3 className="pixel-title text-xs text-orange-400 mb-4 flex items-center gap-2">
                  <Shield size={16} /> COBERTURA DE TIPO
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.typeWeaknesses.map((tw, i) => (
                    <span key={i} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-[10px] font-black uppercase">
                      {tw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Teammate Recommendations */}
            <div className="glow-card p-6 border-secondary/20">
              <h3 className="pixel-title text-xs text-secondary mb-4 flex items-center gap-2">
                <Users size={16} /> {result.isSingleMode ? 'TEAMMATES RECOMENDADOS PARA COMPLETAR O TIME' : 'SUGESTÕES DE PARCEIROS'}
              </h3>
              <div className="space-y-3">
                {result.teammateRecs.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-secondary/20 transition-all">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border shrink-0 mt-0.5 ${tierColor(rec.tier)}`}>
                      {rec.tier}
                    </span>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-wide">{rec.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="glow-card p-6 border-primary/20">
              <h3 className="pixel-title text-xs text-primary mb-4 flex items-center gap-2">
                <Lightbulb size={16} /> SUGESTÕES ESTRATÉGICAS
              </h3>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                      <span className="text-[8px] font-black text-primary">{i + 1}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-300 leading-relaxed">{s}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Meta Context */}
            <div className="glow-card p-6 border-white/5">
              <h3 className="pixel-title text-xs text-gray-400 mb-4 flex items-center gap-2">
                <Info size={16} /> CONTEXTO DO META (VGC 2024 / REG G)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Top S-Tier Restritos', names: 'Calyrex-S, Miraidon, Kyogre' },
                  { label: 'Suporte Universal', names: 'Incineroar, Amoonguss, Rillaboom' },
                  { label: 'Speed Control Premier', names: 'Tornadus, Whimsicott, Grimmsnarl' },
                  { label: 'Attackers Tier S', names: 'Flutter Mane, Urshifu-RS' },
                  { label: 'Trick Room Core', names: 'Porygon2, Farigiraf, Iron Hands' },
                  { label: 'Restricted Permitidos', names: 'Máximo 1 por time (Reg G)' },
                ].map(({ label, names }) => (
                  <div key={label} className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-[10px] font-bold text-gray-400">{names}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pb-8">
              <button
                onClick={() => { 
                  setShowModal(true); 
                  setTeamDraft(Array(6).fill(null).map(() => ({ ...INITIAL_SLOT })));
                  setActiveSlot(0);
                }}
                className="btn-manda !bg-primary !text-black shadow-primary-glow flex-1 !py-4"
              >
                <TrendingUp size={16} className="inline mr-2" /> ANALISAR NOVO TIME
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-6 py-4 bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl font-black text-[10px] uppercase transition-all hover:bg-white/10"
              >
                <X size={14} className="inline mr-2" /> LIMPAR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glow-card max-w-4xl w-full p-8 border-primary/40 relative space-y-6 flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>

              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_var(--primary-glow)]">
                    <Swords size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="pixel-title text-xl text-primary">CONFIGURAR TIME</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Preencha ou importe do Showdown
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Star size={14} /> {showPasteArea ? 'VOLTAR AOS SLOTS' : 'IMPORTAR SHOWDOWN'}
                </button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                {[
                  { id: 'tournament', icon: <Swords size={14} />, label: 'TORNEIO', desc: 'Rigor VGC' },
                  { id: 'casual', icon: <Target size={14} />, label: 'CASUAL', desc: 'Diversão' },
                  { id: 'antimeta', icon: <Shield size={14} />, label: 'ANTI-META', desc: 'Counter-Pick' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAnalysisMode(m.id as AnalysisMode)}
                    className={`p-3 rounded-xl border transition-all text-left group ${
                       analysisMode === m.id 
                       ? 'bg-primary/20 border-primary shadow-[0_0_15px_var(--primary-glow)]' 
                       : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`${analysisMode === m.id ? 'text-primary' : 'text-gray-500'} mb-2`}>{m.icon}</div>
                    <p className={`text-[10px] font-black uppercase tracking-tight ${analysisMode === m.id ? 'text-white' : 'text-gray-500'}`}>{m.label}</p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* Pokémon Slots / Paste Area */}
              <AnimatePresence mode="wait">
                {showPasteArea ? (
                  <motion.div 
                    key="paster"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col space-y-4"
                  >
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6">
                       <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-tighter">Cole o formato Export do Showdown aqui</p>
                       <textarea 
                         className="w-full h-full bg-transparent border-none outline-none text-[11px] font-mono text-primary/80 resize-none custom-scrollbar"
                         placeholder="Incineroar @ Sitrus Berry&#10;Ability: Intimidate&#10;Tera Type: Grass&#10;- Fake Out&#10;- Flare Blitz&#10;- Knock Off&#10;- Parting Shot"
                         value={pasteText}
                         onChange={(e) => setPasteText(e.target.value)}
                         spellCheck={false}
                       />
                    </div>
                    <button 
                      onClick={handleImportPaste}
                      disabled={!pasteText.trim()}
                      className="w-full py-4 bg-primary text-black font-black text-xs rounded-xl shadow-[0_0_15px_var(--primary-glow)] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                    >
                      PROCESSAR E PREENCHER AUTOMATICAMENTE
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="slts"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4"
                  >
                    {teamDraft.map((slot, idx) => (
                      <PokemonSlotEditor 
                        key={idx} 
                        index={idx} 
                        slot={slot} 
                        isOpen={activeSlot === idx}
                        onToggle={() => setActiveSlot(activeSlot === idx ? null : idx)}
                        onUpdate={(upd) => updateSlot(idx, upd)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 shrink-0 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={teamDraft.every(s => !s.name.trim()) || isAnalyzing}
                  className="flex-1 btn-manda !bg-primary !text-black shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      ANALISANDO...
                    </>
                  ) : (
                    <>
                      <Zap size={16} /> ANALISAR TIME
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
