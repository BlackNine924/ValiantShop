/**
 * PokeGrid game logic: grid generation, validation, and state management.
 * Supports many criteria beyond just types: generations, megas, weaknesses, etc.
 */
import { POKEMON_TYPE_DATA, ALL_TYPES } from './pokemonTypes';
import type { PokemonEntry, PokemonType } from './pokemonTypes';

export interface GridCell {
  row: number;
  col: number;
  guessedPokemon: PokemonEntry | null;
  isCorrect: boolean;
}

export interface GameGrid {
  rowLabels: Criterion[];
  colLabels: Criterion[];
  cells: GridCell[][];
}

// ─── Criterion system ──────────────────────────────────────────
export interface Criterion {
  id: string;
  label: string;      // Portuguese display label
  emoji: string;       // Icon emoji
  color: string;       // Hex color for the header
  matches: (p: PokemonEntry) => boolean;
}

// ─── Pokémon with Mega Evolutions ──────────────────────────────
// ─── Pokémon with Mega Evolutions ──────────────────────────────
const MEGA_POKEMON_IDS = new Set([
  3, 6, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 150, 181,
  208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306,
  308, 310, 318, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384,
  428, 445, 448, 460, 475, 531, 719,
]);

// ─── Gen boundaries ────────────────────────────────────────────
function getGen(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

// ─── Legendary / Mythical IDs ─────────────────────────────────
const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  638, 639, 640, 641, 642, 643, 644, 645, 646,
  716, 717, 718, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,
  888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017,
  1020, 1021, 1022, 1023, 1024
]);

const MYTHICAL_IDS = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649,
  719, 720, 721, 801, 802, 807, 808, 809, 893, 1025
]);

// ─── Starter lines (fully evolved) ────────────────────────────
const STARTER_IDS = new Set([
  1,4,7, 152,155,158, 252,255,258, 387,390,393,
  495,498,501, 650,653,656, 722,725,728, 810,813,816, 906,909,912
]);

// ─── Single-type Pokémon ──────────────────────────────────────
function isSingleType(p: PokemonEntry): boolean {
  return p.types.length === 1;
}

// ─── Dual-type Pokémon ────────────────────────────────────────
function isDualType(p: PokemonEntry): boolean {
  return p.types.length === 2;
}

// ─── Pokémon weak to a given type (defensive) ─────────────────
const TYPE_CHART: Record<PokemonType, { weak: PokemonType[], resist: PokemonType[], immune: PokemonType[] }> = {
  Normal:   { weak: ['Fighting'], resist: [], immune: ['Ghost'] },
  Fire:     { weak: ['Water', 'Ground', 'Rock'], resist: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immune: [] },
  Water:    { weak: ['Electric', 'Grass'], resist: ['Fire', 'Water', 'Ice', 'Steel'], immune: [] },
  Grass:    { weak: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resist: ['Water', 'Electric', 'Grass', 'Ground'], immune: [] },
  Electric: { weak: ['Ground'], resist: ['Electric', 'Flying', 'Steel'], immune: [] },
  Ice:      { weak: ['Fire', 'Fighting', 'Rock', 'Steel'], resist: ['Ice'], immune: [] },
  Fighting: { weak: ['Flying', 'Psychic', 'Fairy'], resist: ['Bug', 'Rock', 'Dark'], immune: [] },
  Poison:   { weak: ['Ground', 'Psychic'], resist: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immune: [] },
  Ground:   { weak: ['Water', 'Grass', 'Ice'], resist: ['Poison', 'Rock'], immune: ['Electric'] },
  Flying:   { weak: ['Electric', 'Ice', 'Rock'], resist: ['Grass', 'Fighting', 'Bug'], immune: ['Ground'] },
  Psychic:  { weak: ['Bug', 'Ghost', 'Dark'], resist: ['Fighting', 'Psychic'], immune: [] },
  Bug:      { weak: ['Fire', 'Flying', 'Rock'], resist: ['Grass', 'Fighting', 'Ground'], immune: [] },
  Rock:     { weak: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resist: ['Normal', 'Fire', 'Poison', 'Flying'], immune: [] },
  Ghost:    { weak: ['Ghost', 'Dark'], resist: ['Poison', 'Bug'], immune: ['Normal', 'Fighting'] },
  Dragon:   { weak: ['Ice', 'Dragon', 'Fairy'], resist: ['Fire', 'Water', 'Electric', 'Grass'], immune: [] },
  Dark:     { weak: ['Fighting', 'Bug', 'Fairy'], resist: ['Ghost', 'Dark'], immune: ['Psychic'] },
  Steel:    { weak: ['Fire', 'Fighting', 'Ground'], resist: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immune: ['Poison'] },
  Fairy:    { weak: ['Poison', 'Steel'], resist: ['Fighting', 'Bug', 'Dark'], immune: ['Dragon'] },
};

function isWeakTo(p: PokemonEntry, attackType: PokemonType): boolean {
  let multiplier = 1.0;
  for (const pType of p.types) {
    const chart = TYPE_CHART[pType];
    if (chart.weak.includes(attackType)) multiplier *= 2.0;
    if (chart.resist.includes(attackType)) multiplier *= 0.5;
    if (chart.immune.includes(attackType)) multiplier *= 0.0;
  }
  return multiplier > 1.0;
}

// ─── Type visual helpers (must be before buildAllCriteria) ────

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal:   '#A8A77A',
  Fire:     '#EE8130',
  Water:    '#6390F0',
  Grass:    '#7AC74C',
  Electric: '#F7D02C',
  Ice:      '#96D9D6',
  Fighting: '#C22E28',
  Poison:   '#A33EA1',
  Ground:   '#E2BF65',
  Flying:   '#A98FF3',
  Psychic:  '#F95587',
  Bug:      '#A6B91A',
  Rock:     '#B6A136',
  Ghost:    '#735797',
  Dragon:   '#6F35FC',
  Dark:     '#705746',
  Steel:    '#B7B7CE',
  Fairy:    '#D685AD',
};

export const TYPE_LABELS_PT: Record<PokemonType, string> = {
  Normal:   'Normal',
  Fire:     'Fogo',
  Water:    'Água',
  Grass:    'Planta',
  Electric: 'Elétrico',
  Ice:      'Gelo',
  Fighting: 'Lutador',
  Poison:   'Veneno',
  Ground:   'Terra',
  Flying:   'Voador',
  Psychic:  'Psíquico',
  Bug:      'Inseto',
  Rock:     'Pedra',
  Ghost:    'Fantasma',
  Dragon:   'Dragão',
  Dark:     'Noturno',
  Steel:    'Aço',
  Fairy:    'Fada',
};

function getTypeEmoji(type: PokemonType): string {
  const map: Record<PokemonType, string> = {
    Normal: '⚪', Fire: '🔥', Water: '💧', Grass: '🌿',
    Electric: '⚡', Ice: '❄️', Fighting: '🥊', Poison: '☠️',
    Ground: '🏔️', Flying: '🕊️', Psychic: '🔮', Bug: '🐛',
    Rock: '🪨', Ghost: '👻', Dragon: '🐉', Dark: '🌑',
    Steel: '⚙️', Fairy: '✨',
  };
  return map[type] || '❓';
}

// ─── Build all possible criteria ──────────────────────────────

function buildAllCriteria(): Criterion[] {
  const criteria: Criterion[] = [];

  // 1. Type criteria
  for (const t of ALL_TYPES) {
    criteria.push({
      id: `type-${t}`,
      label: TYPE_LABELS_PT[t],
      emoji: getTypeEmoji(t),
      color: TYPE_COLORS[t],
      matches: (p) => p.types.includes(t),
    });
  }

  // 2. Generation criteria (1-9)
  const genColors = [
    '#FF6B6B', '#69DB7C', '#74C0FC', '#FFD43B', '#E599F7',
    '#63E6BE', '#FF922B', '#A9E34B', '#748FFC'
  ];
  for (let gen = 1; gen <= 9; gen++) {
    criteria.push({
      id: `gen-${gen}`,
      label: `Gen ${gen}`,
      emoji: '📅',
      color: genColors[gen - 1] || '#CED4DA',
      matches: (p) => getGen(p.id) === gen,
    });
  }

  // 3. Mega Evolution
  criteria.push({
    id: 'has-mega',
    label: 'Tem Mega',
    emoji: '🧬',
    color: '#E599F7',
    matches: (p) => MEGA_POKEMON_IDS.has(p.id),
  });

  // 4. Legendary
  criteria.push({
    id: 'legendary',
    label: 'Lendário',
    emoji: '👑',
    color: '#FFD43B',
    matches: (p) => LEGENDARY_IDS.has(p.id),
  });

  // 5. Mythical
  criteria.push({
    id: 'mythical',
    label: 'Mítico',
    emoji: '🌟',
    color: '#DA77F2',
    matches: (p) => MYTHICAL_IDS.has(p.id),
  });

  // 6. Starters
  criteria.push({
    id: 'starter',
    label: 'Starter Base',
    emoji: '🎒',
    color: '#63E6BE',
    matches: (p) => STARTER_IDS.has(p.id),
  });

  // 7. Single type
  criteria.push({
    id: 'single-type',
    label: 'Tipo Único',
    emoji: '1️⃣',
    color: '#CED4DA',
    matches: isSingleType,
  });

  // 8. Dual type
  criteria.push({
    id: 'dual-type',
    label: 'Tipo Duplo',
    emoji: '2️⃣',
    color: '#748FFC',
    matches: isDualType,
  });

  // 9. Weakness criteria
  const weaknessTypes: PokemonType[] = ['Fire', 'Water', 'Electric', 'Ice', 'Ground', 'Fairy', 'Fighting', 'Dark'];
  for (const t of weaknessTypes) {
    criteria.push({
      id: `weak-${t}`,
      label: `Fraco vs ${TYPE_LABELS_PT[t]}`,
      emoji: '⚠️',
      color: TYPE_COLORS[t],
      matches: (p) => isWeakTo(p, t),
    });
  }

  return criteria;
}

const ALL_CRITERIA = buildAllCriteria();

// ─── Shuffle ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Intersection checks ─────────────────────────────────────

function hasIntersection(c1: Criterion, c2: Criterion): boolean {
  return POKEMON_TYPE_DATA.some(p => c1.matches(p) && c2.matches(p));
}

export function getPokemonForCell(c1: Criterion, c2: Criterion): PokemonEntry[] {
  return POKEMON_TYPE_DATA.filter(p => c1.matches(p) && c2.matches(p));
}

/**
 * Gets unique reveal answers for all cells that were not guessed.
 * Ensures no duplicates across the whole grid.
 */
export function getUniqueGridAnswers(grid: GameGrid, guessedIds: Set<number>): (PokemonEntry | null)[][] {
  const result: (PokemonEntry | null)[][] = [[], [], []];
  const usedIds = new Set(guessedIds);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = grid.cells[r][c];
      if (cell.isCorrect) {
        result[r][c] = cell.guessedPokemon;
      } else {
        const potential = getPokemonForCell(grid.rowLabels[r], grid.colLabels[c]);
        const available = potential.filter(p => !usedIds.has(p.id));
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          result[r][c] = picked;
          usedIds.add(picked.id);
        } else {
          result[r][c] = potential[0] || null; // Fallback if no unique left
        }
      }
    }
  }
  return result;
}

export function validateGuess(
  pokemon: PokemonEntry,
  rowCriterion: Criterion,
  colCriterion: Criterion
): boolean {
  return rowCriterion.matches(pokemon) && colCriterion.matches(pokemon);
}

// ─── Search ──────────────────────────────────────────────────

export function searchPokemon(query: string): PokemonEntry[] {
  const normalised = query.toLowerCase().trim();
  if (normalised.length < 1) return [];
  return POKEMON_TYPE_DATA.filter(p =>
    p.name.toLowerCase().includes(normalised)
  );
}

// ─── Grid generation ─────────────────────────────────────────

export function generateGrid(): GameGrid {
  const MAX_ATTEMPTS = 500;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffled = shuffle(ALL_CRITERIA);
    const picked: Criterion[] = [];
    const usedIds = new Set<string>();

    for (const c of shuffled) {
      if (usedIds.has(c.id)) continue;
      picked.push(c);
      usedIds.add(c.id);
      if (picked.length === 6) break;
    }

    if (picked.length < 6) continue;

    const rowCandidates = picked.slice(0, 3);
    const colCandidates = picked.slice(3, 6);

    let valid = true;
    for (const r of rowCandidates) {
      for (const c of colCandidates) {
        if (!hasIntersection(r, c)) {
          valid = false;
          break;
        }
      }
      if (!valid) break;
    }

    if (valid) {
      const cells: GridCell[][] = [];
      for (let r = 0; r < 3; r++) {
        const row: GridCell[] = [];
        for (let c = 0; c < 3; c++) {
          row.push({ row: r, col: c, guessedPokemon: null, isCorrect: false });
        }
        cells.push(row);
      }
      return { rowLabels: rowCandidates, colLabels: colCandidates, cells };
    }
  }

  // Fallback
  const fallbackRows = ALL_CRITERIA.filter(c => ['type-Water', 'type-Fire', 'type-Grass'].includes(c.id));
  const fallbackCols = ALL_CRITERIA.filter(c => ['type-Poison', 'type-Flying', 'type-Ground'].includes(c.id));
  const cells: GridCell[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < 3; c++) {
      row.push({ row: r, col: c, guessedPokemon: null, isCorrect: false });
    }
    cells.push(row);
  }
  return { rowLabels: fallbackRows, colLabels: fallbackCols, cells };
}
