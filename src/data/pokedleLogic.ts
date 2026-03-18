import type { PokemonEntry } from './pokemonTypes';
import { POKEMON_TYPE_DATA } from './pokemonTypes';
import { MANUAL_DESCRIPTIONS } from './manualDescriptions';
import { 
  FIRST_STAGE_IDS, 
  MIDDLE_STAGE_IDS, 
  FINAL_STAGE_IDS, 
  LEGENDARY_IDS, 
  MYTHICAL_IDS 
} from './categoryMappings';

export type PokedleMode = 'classic' | 'silhouette' | 'description';

export interface PokedleTarget {
  pokemon: PokemonEntry;
  description?: string;
}

export const getEvolutionStage = (id: number): string => {
  if (FIRST_STAGE_IDS.has(id)) return '1';
  if (MIDDLE_STAGE_IDS.has(id)) return '2';
  if (FINAL_STAGE_IDS.has(id)) return '3';
  return 'Base';
};

export const getGeneration = (id: number): number => {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
};

export const isSpecial = (id: number): string => {
  if (LEGENDARY_IDS.has(id)) return 'Lendário';
  if (MYTHICAL_IDS.has(id)) return 'Mítico';
  return 'Normal';
};

// Seeded random for daily selection
const getDailyId = (mode: PokedleMode, max: number): number => {
  const dateStr = new Date().toLocaleDateString('en-CA');
  const seed = dateStr + mode;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % max) + 1;
};

export const getDailyTarget = (mode: PokedleMode): PokedleTarget => {
  const allIds = POKEMON_TYPE_DATA.map(p => p.id).filter(id => id < 10000); // Only base species
  
  // For description mode, filter only those that have descriptions
  let targetIds = allIds;
  if (mode === 'description') {
    targetIds = allIds.filter(id => !!MANUAL_DESCRIPTIONS[id]);
  }

  const dailyId = getDailyId(mode, targetIds.length);
  const targetId = targetIds[dailyId - 1];
  const pokemon = POKEMON_TYPE_DATA.find(p => p.id === targetId)!;
  
  return {
    pokemon,
    description: mode === 'description' ? MANUAL_DESCRIPTIONS[targetId] : undefined
  };
};

export interface ComparisonResult {
  property: string;
  value: string | number;
  status: 'correct' | 'partial' | 'wrong' | 'higher' | 'lower';
}

export const TYPE_PT_TRADUCOES: Record<string, string> = {
  Normal: 'Normal', Fire: 'Fogo', Water: 'Água', Grass: 'Planta', Electric: 'Elétrico',
  Ice: 'Gelo', Fighting: 'Lutador', Poison: 'Veneno', Ground: 'Terra', Flying: 'Voador',
  Psychic: 'Psíquico', Bug: 'Inseto', Rock: 'Pedra', Ghost: 'Fantasma', Dragon: 'Dragão',
  Dark: 'Noturno', Steel: 'Aço', Fairy: 'Fada', Nenhum: 'Nenhum'
};

const translateType = (t: string): string => TYPE_PT_TRADUCOES[t] || t;

export const COLOR_TRADUCOES: Record<string, string> = {
  black: 'Preto', blue: 'Azul', brown: 'Marrom', gray: 'Cinza', green: 'Verde',
  pink: 'Rosa', purple: 'Roxo', red: 'Vermelho', white: 'Branco', yellow: 'Amarelo'
};

export const HABITAT_TRADUCOES: Record<string, string> = {
  cave: 'Caverna', forest: 'Floresta', grassland: 'Campo', mountain: 'Montanha',
  rare: 'Raro', rough_terrain: 'Terreno Acidentado', sea: 'Mar', urban: 'Urbano',
  waters_edge: 'Beira da Água', unknown: 'Desconhecido'
};

export const comparePokemon = (guess: any, target: any): ComparisonResult[] => {
  const results: ComparisonResult[] = [];

  // 1. Geração
  const guessGen = getGeneration(guess.id);
  const targetGen = getGeneration(target.id);
  results.push({
    property: 'Geração',
    value: guessGen,
    status: guessGen === targetGen ? 'correct' : (guessGen < targetGen ? 'higher' : 'lower')
  });

  // 2. Tipo 1
  const guessType1 = guess.types[0];
  const targetType1 = target.types[0];
  const targetTypes = target.types;
  results.push({
    property: 'Tipo 1',
    value: translateType(guessType1),
    status: guessType1 === targetType1 ? 'correct' : (targetTypes.includes(guessType1) ? 'partial' : 'wrong')
  });

  // 3. Tipo 2
  const guessType2 = guess.types[1] || 'Nenhum';
  const targetType2 = target.types[1] || 'Nenhum';
  results.push({
    property: 'Tipo 2',
    value: translateType(guessType2),
    status: guessType2 === targetType2 ? 'correct' : (targetTypes.includes(guessType2) ? 'partial' : 'wrong')
  });

  // 4. Peso
  if (guess.weight !== undefined && target.weight !== undefined) {
    results.push({
      property: 'Peso',
      value: `${guess.weight}kg`,
      status: guess.weight === target.weight ? 'correct' : (guess.weight < target.weight ? 'higher' : 'lower')
    });
  }

  // 5. Altura
  if (guess.height !== undefined && target.height !== undefined) {
    results.push({
      property: 'Altura',
      value: `${guess.height}m`,
      status: guess.height === target.height ? 'correct' : (guess.height < target.height ? 'higher' : 'lower')
    });
  }

  // 6. Cor
  if (guess.color && target.color) {
    results.push({
      property: 'Cor',
      value: COLOR_TRADUCOES[guess.color] || guess.color,
      status: guess.color === target.color ? 'correct' : 'wrong'
    });
  }

  // 7. Habitat
  if (guess.habitat && target.habitat) {
    results.push({
      property: 'Habitat',
      value: HABITAT_TRADUCOES[guess.habitat] || guess.habitat,
      status: guess.habitat === target.habitat ? 'correct' : 'wrong'
    });
  }

  // 8. Estágio
  const guessStage = getEvolutionStage(guess.id);
  const targetStage = getEvolutionStage(target.id);
  results.push({
    property: 'Estágio',
    value: guessStage,
    status: guessStage === targetStage ? 'correct' : 'wrong'
  });

  return results;
};
