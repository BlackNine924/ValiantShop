export const POKEMON_DATA = [
  // Geração 1
  { id: 1, name: "Bulbasaur", abilities: ["Overgrow"], hiddenAbility: "Chlorophyll" },
  { id: 4, name: "Charmander", abilities: ["Blaze"], hiddenAbility: "Solar Power" },
  { id: 7, name: "Squirtle", abilities: ["Torrent"], hiddenAbility: "Rain Dish" },
  { id: 25, name: "Pikachu", abilities: ["Static"], hiddenAbility: "Lightning Rod" },
  { id: 133, name: "Eevee", abilities: ["Run Away", "Adaptability"], hiddenAbility: "Anticipation" },
  { id: 147, name: "Dratini", abilities: ["Shed Skin"], hiddenAbility: "Marvel Scale" },
  
  // Geração 2
  { id: 152, name: "Chikorita", abilities: ["Overgrow"], hiddenAbility: "Leaf Guard" },
  { id: 155, name: "Cyndaquil", abilities: ["Blaze"], hiddenAbility: "Flash Fire" },
  { id: 158, name: "Totodile", abilities: ["Torrent"], hiddenAbility: "Sheer Force" },
  { id: 214, name: "Heracross", abilities: ["Swarm", "Guts"], hiddenAbility: "Moxie" },
  
  // Geração 3
  { id: 252, name: "Treecko", abilities: ["Overgrow"], hiddenAbility: "Unburden" },
  { id: 255, name: "Torchic", abilities: ["Blaze"], hiddenAbility: "Speed Boost" },
  { id: 258, name: "Mudkip", abilities: ["Torrent"], hiddenAbility: "Damp" },
  { id: 280, name: "Ralts", abilities: ["Synchronize", "Trace"], hiddenAbility: "Telepathy" },
  { id: 374, name: "Beldum", abilities: ["Clear Body"], hiddenAbility: "Light Metal" },
  
  // Geração 4
  { id: 387, name: "Turtwig", abilities: ["Overgrow"], hiddenAbility: "Shell Armor" },
  { id: 390, name: "Chimchar", abilities: ["Blaze"], hiddenAbility: "Iron Fist" },
  { id: 393, name: "Piplup", abilities: ["Torrent"], hiddenAbility: "Defiant" },
  { id: 443, name: "Gible", abilities: ["Sand Veil"], hiddenAbility: "Rough Skin" },
  { id: 447, name: "Riolu", abilities: ["Steadfast", "Inner Focus"], hiddenAbility: "Prankster" },
  
  // Geração 5
  { id: 495, name: "Snivy", abilities: ["Overgrow"], hiddenAbility: "Contrary" },
  { id: 498, name: "Tepig", abilities: ["Blaze"], hiddenAbility: "Thick Fat" },
  { id: 501, name: "Oshawott", abilities: ["Torrent"], hiddenAbility: "Shell Armor" },
  { id: 633, name: "Deino", abilities: ["Hustle"], hiddenAbility: null },
  { id: 636, name: "Larvesta", abilities: ["Flame Body"], hiddenAbility: "Swarm" },
  
  // Geração 6
  { id: 650, name: "Chespin", abilities: ["Overgrow"], hiddenAbility: "Bulletproof" },
  { id: 653, name: "Fennekin", abilities: ["Blaze"], hiddenAbility: "Magician" },
  { id: 656, name: "Froakie", abilities: ["Torrent"], hiddenAbility: "Protean" },
  { id: 704, name: "Goomy", abilities: ["Sap Sipper", "Hydration"], hiddenAbility: "Gooey" },
  
  // Geração 7
  { id: 722, name: "Rowlet", abilities: ["Overgrow"], hiddenAbility: "Long Reach" },
  { id: 725, name: "Litten", abilities: ["Blaze"], hiddenAbility: "Intimidate" },
  { id: 728, name: "Popplio", abilities: ["Torrent"], hiddenAbility: "Liquid Voice" },
  { id: 747, name: "Mareanie", abilities: ["Merciless", "Limber"], hiddenAbility: "Regenerator" },
  
  // Geração 8
  { id: 810, name: "Grookey", abilities: ["Overgrow"], hiddenAbility: "Grassy Surge" },
  { id: 813, name: "Scorbunny", abilities: ["Blaze"], hiddenAbility: "Libero" },
  { id: 816, name: "Sobble", abilities: ["Torrent"], hiddenAbility: "Sniper" },
  { id: 885, name: "Dreepy", abilities: ["Clear Body", "Infiltrator"], hiddenAbility: "Cursed Body" },
  
  // Geração 9
  { id: 906, name: "Sprigatito", abilities: ["Overgrow"], hiddenAbility: "Protean" },
  { id: 909, name: "Fuecoco", abilities: ["Blaze"], hiddenAbility: "Unaware" },
  { id: 912, name: "Quaxly", abilities: ["Torrent"], hiddenAbility: "Moxie" },
  { id: 979, name: "Greavard", abilities: ["Pickup"], hiddenAbility: "Fluffy" },
  { id: 1067, name: "Frigibax", abilities: ["Thermal Exchange"], hiddenAbility: "Ice Body" },
  { id: 1006, name: "Iron Valiant", abilities: ["Quark Drive"], hiddenAbility: null },
];

export const NATURES = [
  "Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy",
  "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Naive", "Naughty",
  "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"
];

export const BREEDING_RULES = {
  isBreedable: (pokemon: any) => {
    // Lista de lendários/míticos aproximada para este dataset
    const unbreedables = ["Mewtwo", "Mew", "Lugia", "Ho-Oh", "Ditto"];
    return !unbreedables.includes(pokemon.name);
  }
};
