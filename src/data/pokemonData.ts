export interface Pokemon {
  name: string;
  id: number;
  abilities: string[];
  hiddenAbility: string;
  isGenderless: boolean;
  eggGroups: string[];
}

export const POKEMON_DATA: Pokemon[] = [
  { name: "Bulbasaur", id: 1, abilities: ["Overgrow"], hiddenAbility: "Chlorophyll", isGenderless: false, eggGroups: ["Monster", "Grass"] },
  { name: "Ivysaur", id: 2, abilities: ["Overgrow"], hiddenAbility: "Chlorophyll", isGenderless: false, eggGroups: ["Monster", "Grass"] },
  { name: "Venusaur", id: 3, abilities: ["Overgrow"], hiddenAbility: "Chlorophyll", isGenderless: false, eggGroups: ["Monster", "Grass"] },
  { name: "Charmander", id: 4, abilities: ["Blaze"], hiddenAbility: "Solar Power", isGenderless: false, eggGroups: ["Monster", "Dragon"] },
  { name: "Charmeleon", id: 5, abilities: ["Blaze"], hiddenAbility: "Solar Power", isGenderless: false, eggGroups: ["Monster", "Dragon"] },
  { name: "Charizard", id: 6, abilities: ["Blaze"], hiddenAbility: "Solar Power", isGenderless: false, eggGroups: ["Monster", "Dragon"] },
  { name: "Squirtle", id: 7, abilities: ["Torrent"], hiddenAbility: "Rain Dish", isGenderless: false, eggGroups: ["Monster", "Water 1"] },
  { name: "Wartortle", id: 8, abilities: ["Torrent"], hiddenAbility: "Rain Dish", isGenderless: false, eggGroups: ["Monster", "Water 1"] },
  { name: "Blastoise", id: 9, abilities: ["Torrent"], hiddenAbility: "Rain Dish", isGenderless: false, eggGroups: ["Monster", "Water 1"] },
  { name: "Caterpie", id: 10, abilities: ["Shield Dust"], hiddenAbility: "Run Away", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Metapod", id: 11, abilities: ["Shed Skin"], hiddenAbility: "", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Butterfree", id: 12, abilities: ["Compound Eyes"], hiddenAbility: "Tinted Lens", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Weedle", id: 13, abilities: ["Shield Dust"], hiddenAbility: "Run Away", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Kakuna", id: 14, abilities: ["Shed Skin"], hiddenAbility: "", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Beedrill", id: 15, abilities: ["Swarm"], hiddenAbility: "Sniper", isGenderless: false, eggGroups: ["Bug"] },
  { name: "Pidgey", id: 16, abilities: ["Keen Eye", "Tangled Feet"], hiddenAbility: "Big Pecks", isGenderless: false, eggGroups: ["Flying"] },
  { name: "Pikachu", id: 25, abilities: ["Static"], hiddenAbility: "Lightning Rod", isGenderless: false, eggGroups: ["Field", "Fairy"] },
  { name: "Nidoran F", id: 29, abilities: ["Poison Point", "Rivarly"], hiddenAbility: "Hustle", isGenderless: false, eggGroups: ["Monster", "Field"] },
  { name: "Nidoran M", id: 32, abilities: ["Poison Point", "Rivarly"], hiddenAbility: "Hustle", isGenderless: false, eggGroups: ["Monster", "Field"] },
  { name: "Clefairy", id: 35, abilities: ["Cute Charm", "Magic Guard"], hiddenAbility: "Friend Guard", isGenderless: false, eggGroups: ["Fairy"] },
  { name: "Vulpix", id: 37, abilities: ["Flash Fire"], hiddenAbility: "Drought", isGenderless: false, eggGroups: ["Field"] },
  { name: "Meowth", id: 52, abilities: ["Pickup", "Technician"], hiddenAbility: "Unnerve", isGenderless: false, eggGroups: ["Field"] },
  { name: "Psyduck", id: 54, abilities: ["Damp", "Cloud Nine"], hiddenAbility: "Swift Swim", isGenderless: false, eggGroups: ["Water 1", "Field"] },
  { name: "Growlithe", id: 58, abilities: ["Intimidate", "Flash Fire"], hiddenAbility: "Justified", isGenderless: false, eggGroups: ["Field"] },
  { name: "Alakazam", id: 65, abilities: ["Synchronize", "Inner Focus"], hiddenAbility: "Magic Guard", isGenderless: false, eggGroups: ["Human-Like"] },
  { name: "Machamp", id: 68, abilities: ["Guts", "No Guard"], hiddenAbility: "Steadfast", isGenderless: false, eggGroups: ["Human-Like"] },
  { name: "Gengar", id: 94, abilities: ["Cursed Body"], hiddenAbility: "", isGenderless: false, eggGroups: ["Amorphous"] },
  { name: "Magikarp", id: 129, abilities: ["Swift Swim"], hiddenAbility: "Rattled", isGenderless: false, eggGroups: ["Water 2", "Dragon"] },
  { name: "Gyaraodos", id: 130, abilities: ["Intimidate"], hiddenAbility: "Moxie", isGenderless: false, eggGroups: ["Water 2", "Dragon"] },
  { name: "Ditto", id: 132, abilities: ["Limber"], hiddenAbility: "Imposter", isGenderless: true, eggGroups: ["Ditto"] },
  { name: "Eevee", id: 133, abilities: ["Run Away", "Adaptability"], hiddenAbility: "Anticipation", isGenderless: false, eggGroups: ["Field"] },
  { name: "Snorlax", id: 143, abilities: ["Immunity", "Thick Fat"], hiddenAbility: "Gluttony", isGenderless: false, eggGroups: ["Monster"] },
  { name: "Dragonite", id: 149, abilities: ["Inner Focus"], hiddenAbility: "Multiscale", isGenderless: false, eggGroups: ["Water 1", "Dragon"] },
  { name: "Gardevoir", id: 282, abilities: ["Synchronize", "Trace"], hiddenAbility: "Telepathy", isGenderless: false, eggGroups: ["Amorphous", "Human-Like"] },
  { name: "Milotic", id: 350, abilities: ["Marvel Scale", "Competitive"], hiddenAbility: "Cute Charm", isGenderless: false, eggGroups: ["Water 1", "Dragon"] },
  { name: "Metagross", id: 376, abilities: ["Clear Body"], hiddenAbility: "Light Metal", isGenderless: true, eggGroups: ["Mineral"] },
  { name: "Garchomp", id: 445, abilities: ["Sand Veil"], hiddenAbility: "Rough Skin", isGenderless: false, eggGroups: ["Monster", "Dragon"] },
  { name: "Lucario", id: 448, abilities: ["Steadfast", "Inner Focus"], hiddenAbility: "Justified", isGenderless: false, eggGroups: ["Field", "Human-Like"] },
  { name: "Togekiss", id: 468, abilities: ["Hustle", "Serene Grace"], hiddenAbility: "Super Luck", isGenderless: false, eggGroups: ["Flying", "Fairy"] },
  { name: "Rotom", id: 479, abilities: ["Levitate"], hiddenAbility: "", isGenderless: true, eggGroups: ["Amorphous"] },
  { name: "Zoroark", id: 571, abilities: ["Illusion"], hiddenAbility: "", isGenderless: false, eggGroups: ["Field"] },
  { name: "Greninja", id: 658, abilities: ["Torrent"], hiddenAbility: "Protean", isGenderless: false, eggGroups: ["Water 1"] },
  { name: "Sylveon", id: 700, abilities: ["Cute Charm"], hiddenAbility: "Pixilate", isGenderless: false, eggGroups: ["Field"] },
  { name: "Mimikyu", id: 778, abilities: ["Disguise"], hiddenAbility: "", isGenderless: false, eggGroups: ["Amorphous"] },
  { name: "Dragapult", id: 887, abilities: ["Clear Body", "Infiltrator"], hiddenAbility: "Cursed Body", isGenderless: false, eggGroups: ["Amorphous", "Dragon"] },
];

export const NATURES = [
  "Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"
];

export const BREEDING_RULES = {
  isBreedable: (pokemon: Pokemon) => {
    if (pokemon.eggGroups.includes("Undiscovered")) return false;
    // Legendaries and Mythicals usually have Undiscovered group, but I'll filter by name just in case if group is missing
    const legends = ["Mew", "Mewtwo", "Zapdos", "Moltres", "Articuno", "Entei", "Raikou", "Suicune", "Lugia", "Ho-Oh", "Celebi"];
    if (legends.includes(pokemon.name)) return false;
    return true;
  }
};
