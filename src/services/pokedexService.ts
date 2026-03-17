export interface PokemonSpecies {
  flavor_text: string;
  egg_groups: string[];
  generation: string;
  evolution_chain_url: string;
  habitat: string;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  baseTotal: number;
}

export interface EvolutionStage {
  species_name: string;
  id: number;
  min_level?: number;
  trigger?: string;
  item?: string;
}


export interface Variation {
  id: number;
  name: string;
  types: string[];
  sprites: {
    official: string;
    shiny: string;
  };
  stats: PokemonStats;
}

export interface TypeRelations {
  weaknesses: { name: string; label: string }[];
  resistances: { name: string; label: string }[];
  immunities: { name: string; label: string }[];
}

export interface CompetitiveInfo {
  role: string;
  description: string;
  smogonUrl: string;
}

export interface DetailedPokemon {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  stats: PokemonStats;
  sprites: {
    official: string;
    shiny: string;
    animated?: string;
  };
  species?: PokemonSpecies;
  abilities: { name: string; isHidden: boolean }[];
  evolutionChain?: EvolutionStage[];
  typeRelations?: TypeRelations;
  variations?: Variation[];
  competitive?: CompetitiveInfo;
}

const POKE_API_BASE = 'https://pokeapi.co/api/v2';
import { translateDescription } from '../utils/translationHelper';
const pokemonCache: Record<string, DetailedPokemon> = {};

export const TYPE_TRADUCOES: Record<string, string> = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico',
  ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno', ground: 'Terra', flying: 'Voador',
  psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão',
  dark: 'Noturno', steel: 'Aço', fairy: 'Fada'
};

export async function getDetailedPokemon(idOrName: number | string): Promise<DetailedPokemon> {
  const cacheKey = idOrName.toString().toLowerCase();
  if (pokemonCache[cacheKey]) return pokemonCache[cacheKey];

  // Handle our custom IDs first (Megas/G-Max)
  // For now, these will have limited data from PokeAPI or fallback to local
  const id = typeof idOrName === 'number' ? idOrName : parseInt(idOrName);
  
  const response = await fetch(`${POKE_API_BASE}/pokemon/${id > 10000 ? (id % 10000) : id}`);
  const data = await response.json();

  const stats: Omit<PokemonStats, 'baseTotal'> = {
    hp: data.stats[0].base_stat,
    attack: data.stats[1].base_stat,
    defense: data.stats[2].base_stat,
    specialAttack: data.stats[3].base_stat,
    specialDefense: data.stats[4].base_stat,
    speed: data.stats[5].base_stat,
  };

  const base_total = Object.values(stats).reduce((a, b) => a + b, 0);

  const abilities = data.abilities.map((a: any) => ({
    name: a.ability.name,
    isHidden: a.is_hidden
  }));

  const speciesResponse = await fetch(data.species.url);
  const speciesData = await speciesResponse.json();

  const ptEntries = speciesData.flavor_text_entries.filter((entry: any) => 
    entry.language.name === 'pt' || entry.language.name === 'pt-BR'
  );

  let flavorText = ptEntries.length > 0 
    ? ptEntries[ptEntries.length - 1].flavor_text.replace(/\f/g, ' ')
    : translateDescription(speciesData.flavor_text_entries.find((entry: any) => entry.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || '', data.id);
      
  if (!ptEntries.length && flavorText && !flavorText.includes('é um Pokémon')) {
    // If it's still probably English (no manual translation found), prefix it
    if (/[a-zA-Z]/.test(flavorText) && !flavorText.startsWith('(')) {
       flavorText = `(Trad. Automática) ${flavorText}`;
    }
  }

  const species: PokemonSpecies = {
    flavor_text: flavorText,
    egg_groups: speciesData.egg_groups.map((g: any) => g.name),
    generation: speciesData.generation.name,
    evolution_chain_url: speciesData.evolution_chain.url,
    habitat: speciesData.habitat?.name || 'unknown',
  };

  const evolutionChain = await getEvolutionChain(species.evolution_chain_url);
  const typeRelations = await getTypeRelations(data.types.map((t: any) => t.type.name));

  // Buscar variações reais da espécie (varieties)
  const variations: Variation[] = [];
  const varieties = speciesData.varieties || [];
  
  for (const variety of varieties) {
    if (variety.is_default) continue;
    
    try {
      const vRes = await fetch(variety.pokemon.url);
      if (vRes.ok) {
        const vData = await vRes.json();
        const vStats: Omit<PokemonStats, 'baseTotal'> = {
          hp: vData.stats[0].base_stat,
          attack: vData.stats[1].base_stat,
          defense: vData.stats[2].base_stat,
          specialAttack: vData.stats[3].base_stat,
          specialDefense: vData.stats[4].base_stat,
          speed: vData.stats[5].base_stat,
        };
        variations.push({
          id: vData.id,
          name: vData.name.split('-').map((s: string) => s === 'mega' ? 'Mega' : s === 'gmax' ? 'G-Max' : s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          types: vData.types.map((t: any) => t.type.name),
          sprites: {
            official: vData.sprites.other['official-artwork'].front_default || vData.sprites.front_default,
            shiny: vData.sprites.other['official-artwork'].front_shiny || vData.sprites.front_shiny,
          },
          stats: { ...vStats, baseTotal: Object.values(vStats).reduce((a, b) => a + b, 0) }
        });
      }
    } catch (e) { /* skip faulty variations */ }
  }

  // Geração de Análise Competitiva
  const competitive = generateCompetitiveInfo(data.name, stats, data.types.map((t: any) => t.type.name));

  const result: DetailedPokemon = {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => t.type.name),
    height: data.height / 10,
    weight: data.weight / 10,
    stats: { ...stats, baseTotal: base_total },
    abilities,
    sprites: {
      official: data.sprites.other['official-artwork'].front_default,
      shiny: data.sprites.other['official-artwork'].front_shiny,
      animated: data.sprites.other.showdown?.front_default,
    },
    species,
    evolutionChain,
    typeRelations,
    variations: variations.length > 0 ? variations : undefined,
    competitive,
  };

  pokemonCache[cacheKey] = result;
  return result;
}


function generateCompetitiveInfo(name: string, stats: any, types: string[]): CompetitiveInfo {
  const maxStat = Math.max(stats.attack, stats.specialAttack, stats.speed, stats.hp, stats.defense, stats.specialDefense);
  let role = "All-Rounder";
  let description = "";

  if (stats.attack > stats.specialAttack && stats.attack > 100) role = "Physical Sweeper";
  else if (stats.specialAttack > stats.attack && stats.specialAttack > 100) role = "Special Sweeper";
  else if (stats.hp > 100 && (stats.defense > 90 || stats.specialDefense > 90)) role = "Tank / Wall";
  else if (stats.speed > 110) role = "Fast Attacker";

  const mainType = TYPE_TRADUCOES[types[0]] || types[0];
  const highStatName = stats.attack === maxStat ? "Ataque" : stats.specialAttack === maxStat ? "Ataque Especial" : stats.speed === maxStat ? "Velocidade" : "Resistência";

  description = `Foca em ${highStatName} (${maxStat}) para exercer pressão, aproveitando seu tipo ${mainType}. `;
  if (stats.speed < 70) description += "Possui velocidade baixa, dependendo de suporte ou trocas seguras. ";
  else description += "Tem boa presença em campo e consegue punir adversários despreparados. ";
  
  description += `Ideal contra matchups favoráveis de ${types.map(t => TYPE_TRADUCOES[t] || t).join('/')}.`;

  return {
    role,
    description,
    smogonUrl: `https://www.smogon.com/dex/sv/pokemon/${name.toLowerCase()}/`
  };
}

async function getEvolutionChain(url: string): Promise<EvolutionStage[]> {
  const response = await fetch(url);
  const data = await response.json();
  const stages: EvolutionStage[] = [];

  let current = data.chain;
  while (current) {
    const id = parseInt(current.species.url.split('/').slice(-2, -1)[0]);
    stages.push({
      species_name: current.species.name,
      id,
      min_level: current.evolution_details[0]?.min_level,
      trigger: current.evolution_details[0]?.trigger?.name,
      item: current.evolution_details[0]?.item?.name,
    });
    current = current.evolves_to[0];
  }

  return stages;
}

async function getTypeRelations(types: string[]): Promise<TypeRelations> {
  const weaknesses = new Set<string>();
  const resistances = new Set<string>();
  const immunities = new Set<string>();

  for (const type of types) {
    const response = await fetch(`${POKE_API_BASE}/type/${type}`);
    const data = await response.json();
    
    data.damage_relations.double_damage_from.forEach((t: any) => weaknesses.add(t.name));
    data.damage_relations.half_damage_from.forEach((t: any) => resistances.add(t.name));
    data.damage_relations.no_damage_from.forEach((t: any) => immunities.add(t.name));
  }

  // Filter overlapping: if it's immune, it shouldn't be weak or resistant
  immunities.forEach(i => {
    weaknesses.delete(i);
    resistances.delete(i);
  });
  
  // Neutralize weakness and resistance if both exist
  weaknesses.forEach(w => {
    if (resistances.has(w)) {
      weaknesses.delete(w);
      resistances.delete(w);
    }
  });

  return {
    weaknesses: Array.from(weaknesses).map(t => ({ name: t, label: TYPE_TRADUCOES[t] || t })),
    resistances: Array.from(resistances).map(t => ({ name: t, label: TYPE_TRADUCOES[t] || t })),
    immunities: Array.from(immunities).map(t => ({ name: t, label: TYPE_TRADUCOES[t] || t })),
  };
}
