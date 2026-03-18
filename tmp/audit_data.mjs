import fs from 'fs';

const content = fs.readFileSync('c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/data/pokemonTypes.ts', 'utf-8');

const megaMapMatch = content.match(/const MEGA_NAME_MAP: Record<number, string> = ({[\s\S]+?});/);
const dynaMapMatch = content.match(/const DYNAMAX_NAME_MAP: Record<number, string> = ({[\s\S]+?});/);
const typeDataMatch = content.match(/export const POKEMON_TYPE_DATA: PokemonEntry\[\] = (\[[\s\S]+?\]);/);

if (!megaMapMatch || !dynaMapMatch || !typeDataMatch) {
  console.log("Failed to parse some sections");
  process.exit(1);
}

const megaMap = eval('(' + megaMapMatch[1] + ')');
const dynaMap = eval('(' + dynaMapMatch[1] + ')');
const typeDataRaw = eval('(' + typeDataMatch[1] + ')');

const typeDataIds = new Set(typeDataRaw.map(p => p.id));

console.log("Checking MEGA_NAME_MAP IDs...");
for (const id in megaMap) {
  if (!typeDataIds.has(Number(id))) {
    console.log(`ID ${id} (${megaMap[id]}) missing from POKEMON_TYPE_DATA`);
  }
}

console.log("\nChecking DYNAMAX_NAME_MAP IDs...");
for (const id in dynaMap) {
  if (!typeDataIds.has(Number(id))) {
    console.log(`ID ${id} (${dynaMap[id]}) missing from POKEMON_TYPE_DATA`);
  }
}

const officialMegas = [
    { id: 20003, name: "Mega Venusaur", types: ["Grass", "Poison"] },
    { id: 20006, name: "Mega Charizard X", types: ["Fire", "Dragon"] },
    { id: 21006, name: "Mega Charizard Y", types: ["Fire", "Flying"] },
    { id: 20009, name: "Mega Blastoise", types: ["Water"] },
    { id: 20015, name: "Mega Beedrill", types: ["Bug", "Poison"] },
    { id: 20018, name: "Mega Pidgeot", types: ["Normal", "Flying"] },
    { id: 20065, name: "Mega Alakazam", types: ["Psychic"] },
    { id: 20080, name: "Mega Slowbro", types: ["Water", "Psychic"] },
    { id: 20094, name: "Mega Gengar", types: ["Ghost", "Poison"] },
    { id: 20115, name: "Mega Kangaskhan", types: ["Normal"] },
    { id: 20127, name: "Mega Pinsir", types: ["Bug", "Flying"] },
    { id: 20130, name: "Mega Gyarados", types: ["Water", "Dark"] },
    { id: 20142, name: "Mega Aerodactyl", types: ["Rock", "Flying"] },
    { id: 20150, name: "Mega Mewtwo X", types: ["Psychic", "Fighting"] },
    { id: 21150, name: "Mega Mewtwo Y", types: ["Psychic"] },
    { id: 20181, name: "Mega Ampharos", types: ["Electric", "Dragon"] },
    { id: 20208, name: "Mega Steelix", types: ["Steel", "Ground"] },
    { id: 20212, name: "Mega Scizor", types: ["Bug", "Steel"] },
    { id: 20214, name: "Mega Heracross", types: ["Bug", "Fighting"] },
    { id: 20229, name: "Mega Houndoom", types: ["Dark", "Fire"] },
    { id: 20248, name: "Mega Tyranitar", types: ["Rock", "Dark"] },
    { id: 20254, name: "Mega Sceptile", types: ["Grass", "Dragon"] },
    { id: 20257, name: "Mega Blaziken", types: ["Fire", "Fighting"] },
    { id: 20260, name: "Mega Swampert", types: ["Water", "Ground"] },
    { id: 20282, name: "Mega Gardevoir", types: ["Psychic", "Fairy"] },
    { id: 20302, name: "Mega Sableye", types: ["Dark", "Ghost"] },
    { id: 20303, name: "Mega Mawile", types: ["Steel", "Fairy"] },
    { id: 20306, name: "Mega Aggron", types: ["Steel"] },
    { id: 20308, name: "Mega Medicham", types: ["Fighting", "Psychic"] },
    { id: 20310, name: "Mega Manectric", types: ["Electric"] },
    { id: 20319, name: "Mega Sharpedo", types: ["Water", "Dark"] },
    { id: 20323, name: "Mega Camerupt", types: ["Fire", "Ground"] },
    { id: 20334, name: "Mega Altaria", types: ["Dragon", "Fairy"] },
    { id: 20354, name: "Mega Banette", types: ["Ghost"] },
    { id: 20359, name: "Mega Absol", types: ["Dark"] },
    { id: 20362, name: "Mega Glalie", types: ["Ice"] },
    { id: 20373, name: "Mega Salamence", types: ["Dragon", "Flying"] },
    { id: 20376, name: "Mega Metagross", types: ["Steel", "Psychic"] },
    { id: 20380, name: "Mega Latias", types: ["Dragon", "Psychic"] },
    { id: 20381, name: "Mega Latios", types: ["Dragon", "Psychic"] },
    { id: 20384, name: "Mega Rayquaza", types: ["Dragon", "Flying"] },
    { id: 20428, name: "Mega Lopunny", types: ["Normal", "Fighting"] },
    { id: 20445, name: "Mega Garchomp", types: ["Dragon", "Ground"] },
    { id: 20448, name: "Mega Lucario", types: ["Fighting", "Steel"] },
    { id: 20460, name: "Mega Abomasnow", types: ["Grass", "Ice"] },
    { id: 20475, name: "Mega Gallade", types: ["Psychic", "Fighting"] },
    { id: 20531, name: "Mega Audino", types: ["Normal", "Fairy"] },
    { id: 20719, name: "Mega Diancie", types: ["Rock", "Fairy"] }
];

console.log("\nChecking for missing Official Megas...");
officialMegas.forEach(m => {
  if (!typeDataIds.has(m.id)) {
    console.log(`Official Mega ${m.id} (${m.name}) missing from POKEMON_TYPE_DATA`);
  }
});

const officialPrimals = [
    { id: 20382, name: "Primal Kyogre", types: ["Water"] },
    { id: 20383, name: "Primal Groudon", types: ["Ground", "Fire"] }
];

console.log("\nChecking for missing Official Primals...");
officialPrimals.forEach(p => {
  if (!typeDataIds.has(p.id)) {
    console.log(`Official Primal ${p.id} (${p.name}) missing from POKEMON_TYPE_DATA`);
  }
});
