// Script to fetch all Pokémon (Gen 1-9) types from PokeAPI
// Run: node fetchAllPokemon.mjs

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const typeMap = {
  normal: 'Normal', fire: 'Fire', water: 'Water', grass: 'Grass',
  electric: 'Electric', ice: 'Ice', fighting: 'Fighting', poison: 'Poison',
  ground: 'Ground', flying: 'Flying', psychic: 'Psychic', bug: 'Bug',
  rock: 'Rock', ghost: 'Ghost', dragon: 'Dragon', dark: 'Dark',
  steel: 'Steel', fairy: 'Fairy',
};

async function fetchPokemon(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  const name = data.species?.name
    ? capitalize(data.species.name)
    : capitalize(data.name);
  const types = data.types.map(t => typeMap[t.type.name]).filter(Boolean);
  return { id, name, types };
}

async function main() {
  const MAX_ID = 1025; // Gen 9 ends at 1025
  const BATCH = 50;
  const all = [];

  for (let start = 1; start <= MAX_ID; start += BATCH) {
    const end = Math.min(start + BATCH - 1, MAX_ID);
    const promises = [];
    for (let i = start; i <= end; i++) {
      promises.push(fetchPokemon(i));
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r) all.push(r);
    }
    console.error(`Fetched ${end}/${MAX_ID}...`);
  }

  // Build TS file
  let ts = `/**
 * Complete Pokédex (Gen 1-9, #001-#1025) with types.
 * Auto-generated from PokeAPI.
 */

export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric'
  | 'Ice' | 'Fighting' | 'Poison' | 'Ground' | 'Flying'
  | 'Psychic' | 'Bug' | 'Rock' | 'Ghost' | 'Dragon'
  | 'Dark' | 'Steel' | 'Fairy';

export interface PokemonEntry {
  id: number;
  name: string;
  types: PokemonType[];
}

export const ALL_TYPES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric',
  'Ice', 'Fighting', 'Poison', 'Ground', 'Flying',
  'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon',
  'Dark', 'Steel', 'Fairy'
];

export function getSpriteUrl(id: number): string {
  return \`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/\${id}.png\`;
}

export const POKEMON_TYPE_DATA: PokemonEntry[] = [\n`;

  for (const p of all) {
    const typesStr = p.types.map(t => `"${t}"`).join(', ');
    ts += `  { id: ${p.id}, name: "${p.name}", types: [${typesStr}] },\n`;
  }

  ts += `];\n`;

  process.stdout.write(ts);
}

main().catch(console.error);
