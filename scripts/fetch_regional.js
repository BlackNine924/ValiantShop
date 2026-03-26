import fs from 'fs';

async function fetchRegionalForms() {
  console.log("Iniciando busca de formas regionais...");
  
  // As formas regionais na PokeAPI geralmente estão nos IDs > 10000
  // Puxar uma lista grande de Pokémon (ex: até o 10250) e filtrar
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
  const data = await response.json();
  
  const regionalKeywords = ['alola', 'galar', 'hisui', 'paldea'];
  const excludeKeywords = ['totem', 'cap', 'busted', 'gmax', 'mega', 'primal', 'eternamax'];
  
  const regionalUrls = data.results.filter(p => {
    const name = p.name.toLowerCase();
    // Rejeitar se for Mega, Gmax, etc.
    if (excludeKeywords.some(ex => name.includes(ex))) return false;
    
    // Aceitar apenas se tiver as palavras-chave regionais
    return regionalKeywords.some(rk => name.includes(rk));
  });

  console.log(`Encontradas ${regionalUrls.length} potenciais formas regionais.`);

  const newPokemonData = [];
  const newPokemonTypes = [];

  for (const item of regionalUrls) {
    try {
      const res = await fetch(item.url);
      const poke = await res.json();
      
      const id = poke.id;
      // Formatar o nome. Ex: "darumaka-galar" -> "Darumaka de Galar"
      let formattedName = poke.name.split('-');
      const baseName = formattedName[0].charAt(0).toUpperCase() + formattedName[0].slice(1);
      
      // Encontrar a região no nome da API
      const region = regionalKeywords.find(r => poke.name.includes(r));
      const regionFormatted = region ? region.charAt(0).toUpperCase() + region.slice(1) : '';
      
      const finalName = `${baseName} de ${regionFormatted}`;

      // Extrair habilidades
      const abilities = [];
      let hiddenAbility = null;

      poke.abilities.forEach(a => {
        // Formatar o nome da habilidade (ex: "ice-body" -> "Ice Body")
        const abilityName = a.ability.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        if (a.is_hidden) {
          hiddenAbility = abilityName;
        } else {
          abilities.push(abilityName);
        }
      });

      // Extrair tipos
      const types = poke.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));

      newPokemonData.push({
        id,
        name: finalName,
        abilities,
        hiddenAbility
      });

      newPokemonTypes.push({
        id,
        name: finalName,
        types
      });

      console.log(`Processado: ${finalName} (ID: ${id})`);
    } catch (e) {
      console.error(`Erro ao buscar ${item.name}:`, e);
    }
  }

  // formatar output para o arquivo TS
  fs.writeFileSync('./tmp_regional_data.json', JSON.stringify({
    pokemonData: newPokemonData,
    pokemonTypes: newPokemonTypes
  }, null, 2));

  console.log('✅ Finalizado! Dados salvos em tmp_regional_data.json');
}

fetchRegionalForms();
