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
  height: number;
  weight: number;
  sprites: {
    official: string;
    shiny: string;
  };
  stats: PokemonStats;
  description?: string;
  competitive: CompetitiveInfo;
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
import { MANUAL_DESCRIPTIONS } from '../data/manualDescriptions';
const pokemonCache: Record<string, DetailedPokemon> = {};


export const TYPE_TRADUCOES: Record<string, string> = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico',
  ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno', ground: 'Terra', flying: 'Voador',
  psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão',
  dark: 'Noturno', steel: 'Aço', fairy: 'Fada'
};

const normalizeType = (type: string): string => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

export async function getDetailedPokemon(idOrName: number | string): Promise<DetailedPokemon> {
  const cacheKey = idOrName.toString().toLowerCase();
  if (pokemonCache[cacheKey]) return pokemonCache[cacheKey];

  // Handle our custom IDs first (Megas/G-Max)
  // For now, these will have limited data from PokeAPI or fallback to local
  const id = typeof idOrName === 'number' ? idOrName : parseInt(idOrName);

  // Normalização de busca para IDs oficiais vs customizados
  const requestPath = id > 10000 ? `pokemon/${id}` : `pokemon/${id}`;
  const response = await fetch(`${POKE_API_BASE}/${requestPath}`);
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

  // Use strictly the exact scraped and translated description
  let flavorText = MANUAL_DESCRIPTIONS[data.id] || "Descrição não encontrada em português.";



  const EGG_GROUP_MAP: Record<string, string> = {
    'plant': 'Grass',
    'ground': 'Field',
    'humanshape': 'Human-Like',
    'indeterminate': 'Amorphous',
    'no-eggs': 'No Eggs Discovered',
    'undiscovered': 'No Eggs Discovered',
    'monster': 'Monster',
    'water1': 'Water 1',
    'water2': 'Water 2',
    'water3': 'Water 3',
    'bug': 'Bug',
    'flying': 'Flying',
    'fairy': 'Fairy',
    'mineral': 'Mineral',
    'dragon': 'Dragon',
    'ditto': 'Ditto'
  };

  const species: PokemonSpecies = {
    flavor_text: flavorText,
    egg_groups: speciesData.egg_groups.map((g: any) => EGG_GROUP_MAP[g.name] || g.name),
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

    // FILTROS ESPECÍFICOS:
    const vName = variety.pokemon.name.toLowerCase();
    if (data.id === 25 && ['cap', 'partner', 'starter', 'world', 'original', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'cosplay'].some(b => vName.includes(b))) continue;
    if (data.id === 133 && vName.includes('starter')) continue;
    if (data.id === 1007 || data.id === 1008) continue; // Remove todas variações alternativas de Koraidon/Miraidon
    if (data.id === 718 && vName.includes('power-construct')) continue;

    try {
      const vRes = await fetch(variety.pokemon.url);
      if (vRes.ok) {
        const vData = await vRes.json();

        const vStats: any = {};
        vData.stats.forEach((s: any) => {
          const name = s.stat.name.replace(/-([a-z])/, (_: any, c: any) => c.toUpperCase());
          vStats[name === 'specialAttack' ? 'specialAttack' : name === 'specialDefense' ? 'specialDefense' : name] = s.base_stat;
        });

        const vTypes = vData.types.map((t: any) => t.type.name);
        const vComp = generateCompetitiveInfo(vData.name, vStats, vTypes);

        variations.push({
          id: vData.id,
          name: vData.name.split('-').map((s: string) => s === 'mega' ? 'Mega' : s === 'gmax' ? 'G-Max' : s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          types: vData.types.map((t: any) => normalizeType(t.type.name)),
          height: vData.height / 10,
          weight: vData.weight / 10,
          sprites: {
            official: vData.sprites.other['official-artwork'].front_default || vData.sprites.front_default,
            shiny: vData.sprites.other['official-artwork'].front_shiny || vData.sprites.front_shiny,
          },
          stats: { ...vStats, baseTotal: Object.values(vStats).reduce((a: number, b: any) => a + (b as number), 0) },
          competitive: vComp,
          description: generateVariationDescription(vData.name, variety.pokemon.name)
        });
      }
    } catch (e) { /* skip faulty variations */ }
  }

  // Geração de Análise Competitiva
  const competitive = generateCompetitiveInfo(data.name, stats, data.types.map((t: any) => t.type.name));

  const result: DetailedPokemon = {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => normalizeType(t.type.name)),
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

  // Zygarde (718) Manual Ordering & Renaming Override
  if (result.id === 718 && result.variations) {
    const newVariations: Variation[] = [];

    // 1. Add "Forma 10%" (Existing 10118)
    const v10 = result.variations.find(v => v.id === 10118 || v.id === 10091);
    if (v10) {
      newVariations.push({
        ...v10,
        name: "Forma 10%",
        description: "Uma forma ágil que se assemelha a um cão. É capaz de atingir velocidades incríveis para perseguir seus oponentes."
      });
    }

    // 2. Add "Forma Completa" (Existing 10120)
    const vComplete = result.variations.find(v => v.id === 10120);
    if (vComplete) {
      newVariations.push({
        ...vComplete,
        name: "Forma Completa",
        description: "Quando o ecossistema está em perigo crítico, as células de Zygarde se unem nesta forma para exercer seu poder total."
      });
    }

    // 3. Add "Zygarde Mega" (Custom 20718)
    const zMegaStats = { hp: 108, attack: 150, defense: 141, specialAttack: 111, specialDefense: 125, speed: 115 };
    newVariations.push({
      id: 20718,
      name: "Zygarde Mega",
      types: ["Dragon", "Ground"],
      height: 7.7,
      weight: 610.0,
      sprites: {
        official: "/assets/artwork/mega/20718.png",
        shiny: "/assets/artwork/mega/20718.png"
      },
      stats: { ...zMegaStats, baseTotal: 750 },
      description: "A forma definitiva de Zygarde, alcançada quando seu núcleo se une a 100% de suas células. Seu poder supera até mesmo o de Xerneas e Yveltal.",
      competitive: generateCompetitiveInfo("Zygarde Mega", zMegaStats, ["Dragon", "Ground"])
    });

    result.variations = newVariations;
  }

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

function generateVariationDescription(fullName: string, speciesName: string): string {
  const key = fullName.toLowerCase();

  const overrides: Record<string, string> = {
    "rattata-alola": "Adotou uma rotina noturna para invadir despensas na cidade. Revira sacos inteiros antes que qualquer predador chegue ao local.",
    "raticate-alola": "Devora sementes arredondadas trazidas pelos Rattata subalternos da ilha. Bochechas inchadas indicam que o estoque da colônia está abundante.",
    "raichu-alola": "Utiliza eletricidade concentrada para erguer a própria cauda achatada acima da areia litorânea. Flutua no ar pacificamente sem nunca precisar cansar as patas.",
    "meowth-galar": "A exposição constante ao clima rústico do oceano transformou seus pelos numa couraça dura. O enfeite na testa agora é uma placa escura de metal sólido.",
    "farfetchd-galar": "Carregar os pesados vegetais da região fortaleceu consideravelmente sua musculatura nas asas. Caminha em passos curtos para não tombar sob o peso durante longas patrulhas.",
    "mister-mime-galar": "O contato dos pés com superfícies úmidas forma finas camadas de gelo no solo imediatamente. Cria cercas transparentes dançando ritualmente pelos campos antes do amanhecer.",
    "corsola-galar": "Apenas a estrutura calcificada restou após o recife desaparecer com as mudanças climáticas do norte. Os galhos brancos drenam a vitalidade de peixes lentos que passam perto.",
    "zigzagoon-galar": "Pesquisadores consideram esta forma caótica a origem dos grupos domésticos atuais mais dóceis. Move-se em zigue-zague deliberado pelos campos apenas para instigar brigas com passantes.",
    "linoone-galar": "Unhas enormes foram moldadas exclusivamente para ataques retos em alta velocidade. Avança sem nunca considerar como virar, o que torna suas cargas extremamente difíceis de prever.",
    "darumaka-galar": "O rigoroso ambiente nevado desativou completamente as glândulas de fogo internas. Mastiga porções de neve macia para manter a temperatura corporal dentro de um nível estável.",
    "darmanitan-zen": "Traumas físicos severos ativam imediatamente um mecanismo defensivo que imobiliza o corpo. Permanece como uma pedra quieta até que os ferimentos cicatrizem completamente.",
    "darmanitan-galar-standard": "Um grosso capuz gelado no topo da cabeça abafa os instintos agressivos naturais. Guarda frutas colhidas dentro do espaço oco da calota para o inverno mais severo.",
    "darmanitan-galar-zen": "A raiva extrema racha a proteção glacial expondo brechas que deixam escapar rajadas de fogo. O calor interno derrete o exterior gradualmente até a calma forçada retornar.",
    "yamask-galar": "Um espírito antigo se fundiu a um fragmento de alvenaria de argila rachada esquecida nas minas. Quem toca os entalhes vê clarões rápidos de um templo em ruínas inundando a memória.",
    "stunfisk-galar": "Depósitos de ferro do lamaçal cobriram permanentemente sua superfície superior ao longo dos anos. Deita-se completamente plano nas margens simulando uma velha armadilha metálica enferrujada esquecida.",
    "voltorb-hisui": "A metade inferior foi formada ao redor de uma vagem natural sólida semelhante a apricorns antigos. Descarrega estática violentamente pelo orifício do topo quando qualquer agitação ocorre ao redor.",
    "electrode-hisui": "Altas voltagens queimam lentamente o revestimento interno de madeira deixando carvão acumulado. Esvazia o excesso de energia pelo buraco superior para não incendiar a vegetação ao redor.",
    "qwilfish-hisui": "As correntes frias concentraram e espessaram as toxinas roxas ao longo de muitas gerações. Engole regularmente sedimentos do fundo para manter a afiação correta dos espinhos dorsais.",
    "sneasel-hisui": "As garras curvas possuem dutos que secretam veneno paralisante em doses muito baixas. Escala montanhas nevadas completamente sozinho cravando os ganchos diretamente na face da rocha.",
    "lilligant-hisui": "Pernas musculosas se desenvolveram para suportar os declives íngremes dos picos do norte frio. Salta sobre afloramentos rochosos para escapar de predadores que aguardam no solo.",
    "basculin-blue-striped": "As listras azuis marcam uma variação notavelmente dócil comparada aos outros membros do grupo. Nada em cardumes calmos perto de assentamentos a procura de migalhas descartadas pelas margens.",
    "basculin-white-striped": "O isolamento nas águas geladas do norte direcionou seu metabolismo para conservar gordura essencial. Ignora as guerras de território para preservar energia dentro dos rios congelados do inverno.",
    "zorua-hisui": "A fome extrema do inverno trouxe essas raposas de volta como espectros ressentidos que vagam. A grossa juba cinza projeta ilusões de criaturas maiores para afastar predadores investigando.",
    "braviary-hisui": "Migrou para zonas atmosféricas rarefeitas em busca de correntes de ar completamente solitárias. A crista brilhante no topo foca gritos sônicos extremos diretamente para os vales abaixo.",
    "sliggoo-hisui": "Minerais locais dissolveram o muco protetor e criaram em seu lugar uma cápsula metálica opaca. Retrai o corpo inteiramente dentro da concha pesada quando predadores de grande porte chegam perto.",
    "goodra-hisui": "O isolamento transformou sua natureza naturalmente afetuosa em choros gotejantes constantes. Retrai o abdômen flexível dentro da concha ferrugenta sempre que a solidão se torna insuportável.",
    "avalugg-hisui": "Lâminas rochosas pesadas petrificaram ao longo da mandíbula criando um maxilar cortante estático. Seu peso apachata planícies irregulares durante marchas lentas e constantes para frente.",
    "tauros-paldea-combat-breed": "Tendões curtos e espessos foram otimizados para empurrões físicos pesados com a testa larga. Acelera apenas em linha reta e usa a inércia do próprio corpo para derrubar troncos no caminho.",
    "tauros-paldea-blaze-breed": "A circulação interna aquecida tingiu a pelagem escura de uma tonalidade avermelhada visível. Os chifres laranjas se aqueceram até expelir faíscas compridas em rotinas de exibição agressiva.",
    "tauros-paldea-aqua-breed": "Finos dutos nos ossos do focinho injetam umidade constantemente na pelagem densa e negra. A hidratação diária torna a natação em rios caudalosos incrivelmente fácil e natural para a espécie.",
    "tatsugiri-droopy": "A coloração pálida imita plâncton nas margens rasas dos lagos de lama. Esvazia os pulmões para ficar completamente mole e enganar predadores que buscam presas vivas.",
    "tatsugiri-stretchy": "Estende o corpo para imitar algas escuras flutuando na corrente dos rios. Aguarda em valas encharcadas até que pássaros desavisados mergulhem baixo demais acima da água.",
    "tatsugiri-curly-mega": "A energia acumulada intensifica o pigmento vivo nas escamas da mandíbula inferior. Flutua de barriga para cima no lago para absorver energia solar pelas costas durante horas.",
    "tatsugiri-droopy-mega": "A musculatura antes relaxada adota uma postura permanentemente rígida de vigilância ativa. Afunda sua silhueta na espessa lama do rio para dormir com segurança longe da superfície.",
    "tatsugiri-stretchy-mega": "Espasmos no pescoço dobram a amplitude do saco vocal amarelo expulsando bolhas de oxigênio. Usa essas bolhas para se mover acima das correntes do fundo sem ser notado pelos predadores.",
    "dudunsparce-three-segment": "Um terceiro segmento funcional aparece raramente nesta espécie por razões ainda não documentadas. A arquitetura corporal adicional permite escavar abrigos subterrâneos consideravelmente mais profundos.",
    "venusaur-gmax": "A flor gigantesca gera neblina densa que deposita compostos nutritivos nas plantas do ecossistema ao redor. O peso da estrutura floral faz o solo ceder levemente sob cada um de seus passos lentos.",
    "charizard-gmax": "O núcleo de fogo comprimido no ventre lança clarões que vaporizam a camada superficial do solo. Os rasantes aéreos em alta velocidade criam marcas de vidro derretido nos relevos mais abaixo.",
    "blastoise-gmax": "A carapaça reorganizou a pele superior num sistema de canos de repulsão aquática circular. Os jatos de alta pressão servem para expulsar grandes rochas lançadas durante tempestades costeiras.",
    "butterfree-gmax": "Pólen cristalizado nas asas enormes cobre completamente as escamas de cada pena crescida. A substância brilhante afeta as glândulas olfativas da presa causando desorientação severa imediata.",
    "pikachu-rock-star": "Fricciona as patas ásperas contra cimento seco de manhã para afinar a descarga elétrica. Apresentações intensas com batidas altas ativaram respostas nervosas ansiosas específicas.",
    "pikachu-belle": "Acostumada ao conforto das saias acolchoadas, prefere os recantos silenciosos das áreas arborizadas. Libera uma faísca azul suave depois de cada descanso prolongado na grama.",
    "pikachu-pop-star": "Especialmente saltitante ao avistar novos treinadores em áreas com iluminação artificial forte. A energia estática que acumula flutua pelo teto em tons rosados e prateados nas salas fechadas.",
    "pikachu-phd": "Passa dias inteiros lendo páginas mofadas caídas em ambientes acadêmicos abandonados. Examina cuidadosamente cabos elétricos descascados com interesse técnico intenso e foco total.",
    "pikachu-libre": "Saltos constantes sob as cordas dos ginásios endureceram consideravelmente os músculos do abdômen. Usa seu uniforme específico para proteger a pele das escoriações durante as garras físicas intensas.",
    "machamp-gmax": "Os braços adicionais batem de forma independente criando ritmos imprevisíveis que confundem rivais. Consegue erguer navios cargueiros pelos cascos usando apenas dois dos quatro membros ao mesmo tempo.",
    "gengar-gmax": "A boca alargada conduz sons do exterior para frequências similares ao choro de espectros invisíveis. Pessoas próximas da língua descrevem ouvir ecos de cavernas distantes sem fonte identificável.",
    "kingler-gmax": "A baba altamente alcalina corrói pedras vulcânicas deposited nas margens de forma gradual e constante. Aperta a enorme garra desproporcional repetidamente para triturar areia calcificada que obstrua abrigos.",
    "lapras-gmax": "Camadas geladas na carapaça sobreposta irradiam anéis de frio que iluminam águas escuras. Usa os dias lentos conduzindo filhotes perdidos entre as maiores geleiras oceânicas polares da região.",
    "snorlax-gmax": "Sementes presas na pelagem do ventre germinaram em caules frondosos durante o sono prolongado. Engole montanhas de sobras locais antes de cair num sono invernal pacato nos relevos pedregosos.",
    "garbodor-gmax": "Compacta lixo tóxico denso num núcleo pressurizado que vaza gás bioreativo continuamente. A névoa que sobe do corpo murcha plantas nas proximidades dentro de minutos de exposição direta.",
    "melmetal-gmax": "Metal derretido circula internamente criando pulso eletromagnético constante detectável por sensores. Os socos no solo geram vibrações que percorrem o leito rochoso sólido por vários quilômetros.",
    "rillaboom-gmax": "Troncos percutivos brotam dos nós e batem no terreno em ciclos naturais precisos. As reverberações causam germinação imediata em sementes que estavam dormentes há várias estações.",
    "cinderace-gmax": "Comprime queratina combustível das pernas formando uma bola extremamente densa de fogo puro. O impacto da esfera seca rios em contato direto e petrifica o solo ao redor do ponto central.",
    "inteleon-gmax": "A coluna de água erguida da cauda permite vigiar regiões costeiras inteiras simultaneamente. Usa o ponto alto para mirar jatos precisos em alvos que se movem muito distantes abaixo dela.",
    "corviknight-gmax": "Corvos mecânicos se desprendem do corpo e operam em padrões aéreos coordenados no entorno. A criatura principal os guia deslocando correntes de ar com as enormes asas de ferro batendo devagar.",
    "orbeetle-gmax": "A emissão psíquica amplificada pela antena enorme perturba o ciclo de sono das cidades vizinhas. Paira silenciosamente por dias coletando impressões mentais de todos os seres que vivem diretamente abaixo.",
    "drednaw-gmax": "A carapaça rachou em placas pontiagudas que raspam o fundo oceânico durante cada mergulho raso. A força da mordida colapsa sistemas de cavernas subaquáticas formados ao longo de séculos de sedimentação.",
    "coalossal-gmax": "Os depósitos de carvão nas costas se inflamam com o esforço liberando colunas de fumaça pesada. Vales inteiros ficam cobertos de cinza fina após cada uma de suas lentas marchas pelo território.",
    "flapple-gmax": "Néctar ácido escorrendo das pétalas enormes corrói pavimentos de pedra ao longo de semanas. Pássaros migratórios evitam sua trajetória de mergulho pois o respingo cobre vários quarteirões de área.",
    "appletun-gmax": "Xarope secretado pelos poros do ventre imenso atrai insetos de grandes distâncias ao redor. Os insetos pousados afundam gradualmente na superfície e são absorvidos como nutrientes nos dias seguintes.",
    "sandaconda-gmax": "Areia compactada nas espirais cria exterior abrasivo que raspa a casca de troncos ao simples contato. O vórtice interno gera estática que ioniza qualquer precipitação que entre no seu território.",
    "toxtricity-amped-gmax": "A voltagem amplificada deixa o ar ao redor com forte e persistente odor de ozônio e metal. Pulsos elétricos em formato de acorde visualmente lembram partituras musicais irregulares no céu.",
    "toxtricity-low-key": "Tom grave de baixa frequência causa rachaduras progressivas em pilares de concreto armado próximos. A frequência única do sono profundo coloca pequenos mamíferos em transe involuntário ao redor.",
    "toxtricity-low-key-gmax": "Vibrações graves rolam pelo solo perturbando toda colônia de insetos subterrâneos embaixo. O gás roxo pesado emitido pelas costas cria uma segunda sombra visível em dias de muito sol.",
    "centiskorch-gmax": "A temperatura do corpo sobe ao ponto de carbonizar o solo sob cada segmento de pata em contato. Ingere rochas vulcânicas para regular o calor interno e expulsa escória resfriada pelos segmentos traseiros.",
    "hatterene-gmax": "Pessoas próximas sem proteção psíquica experimentam alucinações vívidas de serem observadas sempre. Os tentáculos se estendem por paredes para examinar o estado de sonho dos treinadores dormindo.",
    "grimmsnarl-gmax": "Pelos individuais se desprendem, se enterram e ressurgem ao redor dos inimigos por ângulos inesperados. Usa vibração do solo para rastrear presas enterradas sem depender de qualquer referência visual.",
    "alcremie-gmax": "Camadas de creme solidificadas ao seu redor formam conchas protetoras de sabor adocicado intenso. Os anéis externos contêm sedativo suave que acalma Pokémon que as lambem por engano.",
    "copperajah-gmax": "A tromba funciona como alojamento pressurizado para um sistema hidráulico de base cúprica interna. Pulveriza líquidos com força suficiente para virar grandes embarcações de pesca ancoradas na costa.",
    "duraludon-gmax": "Escamas metálicas cristalinas no torso giram independentemente redirecionando projéteis de volta. Usa a imensa altura para causar interferência eletromagnética que desativa aparelhos eletrônicos próximos.",
    "urshifu-rapid-strike": "Ambos os braços se estendem independentemente e giram correntes em colunas de água em forma de broca. Pratica cada sequência de golpe centenas de vezes em água parada antes de usá-la em combate.",
    "urshifu-single-strike": "O único soco decisivo colapsa qualquer superfície que toca independentemente da dureza do material. Abandona o território imediatamente após cada confronto e nunca retorna à mesma toca duas vezes.",
    "urshifu-rapid-strike-gmax": "Cada corrente de água a quilômetros reage à presença mudando direção em sua direção. O impacto do golpe Gigantamax cria uma maré visível até nos picos de montanhas distantes.",
    "urshifu-single-strike-gmax": "Fecha o único punho lentamente antes de golpear e a mudança de pressão do ar é audível a um campo de distância. A onda de choque viaja pelo solo sólido e divide camadas de rocha abaixo da superfície.",
    "machamp-mega": "Os membros extras batem de forma independente criando ritmos imprevisíveis que confundem lutadores experientes. Com apenas dois dos quatro braços consegue erguer navios cargueiros completamente carregados.",
    "gengar-mega": "A enorme língua espectral se estende envolvedendo criaturas adormecidas para absorver os pesadelos. Aninha-se em edifícios abandonados coletando energia de medo residual dos antigos habitantes assustados.",
    "blastoise-mega": "A carapaça expandida no nível da água prende pequenas presas aquáticas em câmaras seladas. Injeta enzimas digestivas por tubos finos que revestem as paredes internas da concha após selar.",
    "beedrill-mega": "A velocidade do ferrão supera o que o olho nu acompanha durante uma sequência de ataque completa. Patrulha rota fixa ao redor da colmeia toda manhã e expulsa intrusos sem nenhum aviso prévio.",
    "pidgeot-mega": "A crista de penas brilha levemente quando atinge altitude máxima acima da camada de nuvens. Permanece imóvel em correntes térmicas por horas antes de mergulhar sobre presas muito abaixo.",
    "venusaur-mega": "A flor libera sementes com toxina de dissolução lenta absorvida pelos poros foliares de outras plantas. Marca território de alimentação arrastando pontas das vinhas pelo chão antes de descansar nas clareiras.",
    "raichu-mega-x": "A juba dourada conduz descargas elétricas das glândulas espinhais até as quatro patas simultaneamente. Caça arrebanhandando presas em clareiras onde o acúmulo estático impede a fuga lateral segura.",
    "raichu-mega-y": "Ranhuras aerodinâmicas entre as penas dos braços permitem planar completamente silencioso. Caça durante tempestades especificamente porque as presas perdem a capacidade de ouvir a aproximação.",
    "clefable-mega": "O terceiro olho abre completamente apenas quando sente ameaça iminente de alguma fonte oculta próxima. Cada ponta estrelada brilhante rastreia um comprimento de onda único do espectro de luz independentemente.",
    "victreebel-mega": "Ácidos digestivos se acumulam dentro da ampla mandíbula traseira e gotejam dos lábios nas tardes quentes. Engole presas inteiras e pode dissolver uma criatura duas vezes maior em uma única noite.",
    "slowbro-mega": "O Shellder fundido à cauda cresceu muito mais e agora constrange diretamente os músculos da cauda hospedeira. O ritmo mais lento permite consumir mais presas por hora do que em sua forma original.",
    "kangaskhan-mega": "O filhote sai permanentemente da bolsa e assume papel de ataque totalmente independente do adulto. O duo coordena socos com tanta precisão que os oponentes não distinguem qual golpe bloquear.",
    "starmie-mega": "A joia central refrata luz ambiente em feixes circulares rotativos visíveis a vários quilômetros. Esses feixes marcam território impedindo tipos água rivais de entrar na faixa costeira disponível.",
    "pinsir-mega": "Os chifres sobrancelha se encaixam com machos rivais durante competições sazonais por ninhada. Lança-se verticalmente das copas e rasga inimigos com as garras das pernas durante a descida aérea.",
    "aerodactyl-mega": "A crista dentada da mandíbula se afia automaticamente contra substratos rochosos entre as refeições. Estabelece rotas de patrulha sobre cadeias de montanhas e grita para marcar fronteiras ao amanhecer.",
    "dragonite-mega": "As asas compactas ainda geram sustentação suficiente para planar entre altos afloramentos rochosos. Usa padrões estelares para navegar de volta à ilha natal após viagens solitárias pelo oceano aberto.",
    "meganium-mega": "As pétalas das flores nas costas dobram em número e liberam perfume restaurador em fluxo constante. Essa fragrância acelera o reparo tecidual de criaturas descansando a poucos metros de sua presença.",
    "feraligatr-mega": "A mandíbula dilatada aplica força de mordida equivalente a prensas industriais de maquinário pesado. Arrasta presas capturadas para cavernas submarinas e armazena excedente embrulhado em algas frescas.",
    "ampharos-mega": "A cauda de lã estendida armazena muito mais carga do que sua forma base durante os temporais. Acende faróis remotos acidentalmente ao descarregar o acúmulo estático após traversias oceânicas longas.",
    "steelix-mega": "O revestimento de ferro ao longo do ventre reflete campos magnéticos subterrâneos como luz azul suave. Usa esses sinais para localizar veios minerais grandes e então esmaga a pedra para se alimentar.",
    "scizor-mega": "O atrito da tesoura superaquece a borda cortante a um estado próximo ao ponto de fusão do metal. Encerra perseguições abruptamente cortando troncos de várias árvores numa única passagem contínua.",
    "heracross-mega": "O único chifre enorme absorve energia cinética dos impactos e a canaliza de volta como contrataque. Atinge especificamente o solo durante cargas para transmitir ondas de choque pelo solo em direção às presas.",
    "skarmory-mega": "A plumagem nas asas comprime-se em filas em forma de lâmina durante mergulhos aéreos em alta altitude. Constrói ninhos metálicos angulares em penhascos dobrandoplates descartadas de armadura com o bico.",
    "houndoom-mega": "Marcações esqueléticas brilham visivelmente até através de densas copas florestais nas noites sem lua. Busca criaturas feridas e corre ao lado delas até que entrem em colapso pela exaustão acumulada.",
    "tyranitar-mega": "Toda a crista dorsal rachou sob estresse sísmico e endureceu em placas defensivas entrelaçadas. Gera pequenos tremores ao ajustar a postura que gradualmente alteram os contornos das colinas próximas.",
    "sceptile-mega": "O pinheiro da cauda gira e espalha sementes explosivas sempre que identifica dossel fechado ao redor. Dorme ancorado no topo das árvores pela vinha e absorve chuva passivamente pelo colarinho de folhas.",
    "blaziken-mega": "As chamas dos pulsos geram névoa de calor visível ao nível do solo mesmo durante o dia claro. Mapeia padrões de movimento do oponente por trinta segundos antes de se comprometer a qualquer ataque.",
    "swampert-mega": "Músculos das pernas saturados permitem nadar por sedimentos espessos nos deltas sem diminuir. Sela entradas de cavernas com lama comprimida para proteger juvenis de inundações durante tempestades.",
    "sableye-mega": "A pedra preciosa ficou pesada demais, se desprendeu e agora funciona como escudo portátil. Rola a gema à frente antes de entrar em territórios e observa cuidadosamente como outros reagem a ela.",
    "mawile-mega": "Ambas as mandíbulas operam independentemente e mordem em direções diferentes sem coordenação. Ambusca criaturas diretamente de cima ficando completamente imóvel em bordas de penhascos por horas.",
    "aggron-mega": "As placas reforçadas absorvem choques sísmicos durante terremotos e os dispersam pela espinha. Come exclusivamente minério de ferro e evita terrenos rasos durante toda a temporada de alimentação.",
    "medicham-mega": "Entra em estados meditativos onde os membros extras transitam parcialmente para outra dimensão. A atividade combinada das duas formas físicas produz um pulso eletromagnético mensurável ao redor.",
    "manectric-mega": "A juba elétrica dentada é um conjunto externo que absorve raios diretamente durante as tempestades. Carrega reservas nos temporais e entra em estado dormente entre eventos elétricos separados.",
    "sharpedo-mega": "Torpedos dorsais se lançam independentemente e miram mudanças de pressão da presa em fuga. Nunca foi registrado nadando mais devagar que quarenta quilômetros por hora em campo algum.",
    "camerupt-mega": "O vent vulcânico central entra em erupção num ciclo fixo ligado às mudanças de temperatura matutina. Não muda de direção rapidamente mas compensa cuspindo projéteis em arco largo enquanto parado.",
    "altaria-mega": "Os tufos de nuvem nas asas retêm umidade suficiente para gerar aguaceiros localizados conforme necessário. Canta para treinadores dormindo de uma altitude onde a silhueta não pode ser vista à noite.",
    "diance-mega": "A malha de diamante externa refrata impactos de pedra em fragmentos inofensivos em dezenas de direções. Esculpe câmaras geométricas ornamentadas em penhascos de granito para acasalar na estação certa.",
    "banette-mega": "Fios roxos libertados do corpo tornam-se organismos vivos independentes ao longo de vários dias. Morde a costura de madeira interna para liberar esses fios durante exibições de marcação territorial.",
    "chimecho-mega": "As longas fitas emitem tom de altura variável de acordo com a pressão barométrica da área. Alpinistas passaram a usá-lo como indicador de tempo pois o som precede confiavelmente as tempestades.",
    "absol-mega": "As penas-foice chacoalham audivelmente quando sente catástrofes iminentes dias antes de ocorrerem. Comunidades históricamente se instalavam perto de seu habitat porque ele uivava antes de desastres.",
    "glalie-mega": "As bordas estilhaçadas da mandíbula se fragmentam ao morder superfícies duras e se aiam no processo. Exala neblina congelante persistente que cristaliza o ar próximo à boca em folhas frágeis visíveis.",
    "latias-mega": "As barbatanas aerodinâmicas vibram em frequências que acalmam comportamentos agressivos em Pokémon d'água. Planeia em arcos largos sobre o mar aberto e raramente retorna ao mesmo local duas vezes.",
    "latios-mega": "Os chifres varridos para frente geram poço gravitacional que puxa objetos próximos passivamente. Circula a mesma cordilheira por décadas sendo um dos poucos Pokémon que nunca desce ao nível do solo.",
    "staraptor-mega": "Tendões das pernas lançam-no pelas copas em velocidades que o tornam brevemente invisível para observadores. Usa as asas como freios e se prende a galhos com dedos num único movimento fluido.",
    "loppuny-mega": "Tufos de pelo nos calcanhares funcionam como amortecedores naturais durante aterrissagens de alto impacto. Marca caminhos seguros em capim alto achatando hastes específicas em padrões geométricos repetidos.",
    "garchomp-mega": "A barbatana dorsal tornou-se estabilizador poderoso para movimentação precisa em canais fluviais rápidos. Antes de caçar traça círculos lentos ao redor da presa para medir probabilidades de rota de fuga.",
    "lucario-mega": "A aura irradiada corresponde precisamente ao estado emocional do alvo na distância. Identifica lutadores experientes lendo a distribuição de cicatrizes musculares acumuladas à distância.",
    "abomasnow-mega": "Fungos do permafrost crescem ao longo das raízes emergindo das extremidades do tronco aumentadas. Gera tempestades locais expirando rapidamente em clareiras para defender filhotes vizinhos do perigo.",
    "gallade-mega": "As esporas de lâmina dos braços traçam linhas precisas no solo marcando os limites do combate. Recua e abaixa as pontas antes de se comprometer com qualquer movimento ofensivo em qualquer batalha.",
    "froslass-mega": "Cristais de gelo na manga da saia condensam e reformam a cada respiração em temperaturas geladas. O folclore local documentou esta forma aparecendo perto de aldeias antes de invernos severos começarem.",
    "heatran-mega": "Ferro superaquecido vaza pelas juntas cruzadas da concha deixando marcas de queimadura nos pisos. Cava buracos de âncora circulares em encostas vulcânicas e fica dormente neles por estações inteiras.",
    "darkrai-mega": "Os ombros injetam composto que induz pesadelos vívidos prolongados em alvos dormentes próximos. Seleciona o único dorminhoco mais inquieto dentro do alcance e foca exclusivamente nele noturno.",
    "emboar-mega": "Os anéis nos ombros aquecem e brilham em laranja ao entrar no modo de combate agachado. Usa correntes térmicas do próprio cinto em chamas como impulso de emergência durante cargas rápidas.",
    "excadrill-mega": "Depósitos de titânio endureceram a broca da coroa para perfurar granito sólido continuamente. Alimenta-se filtrando minerais do solo compactado por filtros na base da placa de broca frontal.",
    "audino-mega": "A amplificação auditiva detecta sons fracos de reparo celular de criaturas feridas de longa distância. Aborda doentes e senta quietamente por horas criando ambiente sonoro que acelera mensuravelmente a cura.",
    "scolipede-mega": "Os segmentos blindados liberam compostos levemente sedantes pelas juntas em terreno íngreme acidentado. Enrola em troncos grandes durante chuva forte e usa a presa para não ser arrastado pela correnteza.",
    "scrafty-mega": "Reveste os punhos com queratina endurecida da crista da cabeça entre as sessões de briga diuturnamente. À noite esculpe marcações em paredes de concreto próximas ao abrigo usando garras traseiras curtas.",
    "eelektross-mega": "Os braços de alimentação alcançam o dobro do alcance normal e sentem campos elétricos das presas. Ancora-se ao fundo do mar pela raiz da cauda e aguarda imóvel que peixes passem por cima.",
    "chandelure-mega": "A chama de pavio queima com calor variável ligado às emoções irresolvidas das almas que absorveu. Diminui visivelmente ao entrar em locais onde consumiu criaturas de vontade particularmente forte.",
    "golurk-mega": "Os selos de punho foram fundidos com granito endurecido coletado das ruínas que guarda à noite. Compete com outras construções guardiãs medindo cujas pegadas produzem impressão mais profunda no solo.",
    "chesnaught-mega": "Enormes escudos de concha se empilham mais alto quando detecta ataques à distância chegando de cima. Carrega com concha baixa e nivela fileiras de vegetação densa do sub-bosque em passagens únicas.",
    "delphox-mega": "A temperatura da ponta da varinha supera o espectro mensurável ao acender completamente antes do ataque. Transmite previsões futuras como flashes visuais curtos nas mentes dos que ficam próximos.",
    "greninja-battle-bond": "Uma fina concha d'água que imita a silhueta do treinador flutua independentemente durante a batalha. Os dois operam em sincronia perfeita tornando impossível determinar qual alvo atacar primeiro.",
    "greninja-mega": "Os shurikens d'água retêm a forma por vários segundos depois de deixar as pontas dos dedos. Reposiciona no ar usando água expelida para mudar o impulso logo após liberar cada projétil.",
    "pyroar-mega": "A juba expandida queima consistentemente sob a chuva e resiste à submersão até quatro metros. Lidera a alcateia em fila única e coordena manobras de flanqueamento por variações no rugido tonal.",
    "floette-eternal": "Carrega uma única flor rara e circulou o mesmo prado por milênios sem interrupção documentada. A flor que segura nunca murchou e nenhum pesquisador conseguiu explicar por qual mecanismo sobrevive.",
    "floette-mega": "As mãos florais emitem fragrâncias distintas correspondentes ao estado emocional da criatura próxima. Só aparece em prados que jamais foram tocados por construção ou cultivo humano de qualquer tipo.",
    "meowstic-female": "A fêmea esconde os painéis internos dos olhos completamente até detectar ameaça psíquica genuína. A cauda curva para dentro e forma lente focal secundária que amplifica qualquer saída telecinética emitida.",
    "meowstic-mega": "Fileiras de cristais de turmalina negra nos ombros deflectem ataques à distância lateralmente. Viaja exclusivamente por sistemas de cavernas ativas e só aparece à noite perto de fumarolas vulcânicas.",
    "malamar-mega": "O campo gravitacional invertido faz solo solto próximo subir e orbitar seus ombros visivelmente. Animais no nível do solo evitam o território porque a atração magnética perturba instintos de navegação.",
    "barbaracle-mega": "Sete organismos sem vínculo neural direto operam os braços em sequências de caça independentes. Cada unidade migra para colunas de coral separadas na maré baixa e só se reagrupa ao anoitecer.",
    "dragalge-mega": "O muco dracônico secretado corrói redes de pesca de água salgada dentro de um único dia de contato. Ancora em leitos de algas imitando vegetação antes de emboscar qualquer criatura que passa por perto.",
    "hawlucha-mega": "A máscara canaliza resistência do ar para as pontas das asas permitindo mudanças bruscas de direção. Após vencer uma batalha realiza sempre uma sequência específica de pose antes de voar da área.",
    "crabominable-mega": "Gelo compactado nos ombros gera frente fria permanente que segue a criatura onde quer que caminhe. Ataca se enrolando numa esfera densa e rolando pelos oponentes em velocidade sustentada sem parar.",
    "golisopod-mega": "Painéis transparentes no exoesqueleto dorsal exibem movimento dos órgãos internos enquanto ativo. Descansa em tapetes de musgo e ventila a água com amplos movimentos de braço para puxar nutrientes.",
    "drampa-mega": "A juba longa como barba desacelera a descida aérea permitindo pousar em estruturas muito frágeis. Mantém mapa mental de cada assentamento sobrevoado no último século e os revisita sazonalmente.",
    "magearna-original": "A flor gravada no peito pulsa em correspondência rítmica exata com o batimento cardíaco do seu criador. Foi construída para armazenar a alma viva do criador original e ainda procura por esse indivíduo.",
    "magearna-mega": "Os canhões florais no posterior carregam independentemente e sincronizam disparo em sequências programadas. O sistema de propulsão interna foi desenhado para não causar dano à fauna em seu habitat operacional.",
    "magearna-original-mega": "A flor original no peito pulsa com intensidade maior quando aproximada de itens criados pelo fabricante. Exibe padrões de busca sistemática cobrindo vastas regiões antes de retornar ao ponto de partida.",
    "zeraora-mega": "Almofadas de descarga plasmóide nas palmas polarizam superfícies metálicas próximas instantaneamente. Move-se em rajadas retas precisas e nunca reduz velocidade ao dobrar cantos durante perseguições.",
    "falinks-mega": "A formação geométrica nunca quebra o padrão mesmo quando membros individuais são atacados separadamente. A unidade líder comunica ajustes táticos usando vibrações sutis de antena detectáveis apenas pelo grupo.",
    "scovillain-mega": "O óleo irritante disparado causa espirros incontroláveis imediatos em criaturas com tecido nasal funcional. Nunca ataca primeiro e só levanta as duas cabeças quando julga o intruso a menos de três metros.",
    "glimmora-mega": "Cada pétala de cristal carrega independentemente e pode descarregar em alvos separados ao mesmo tempo. Ancora em paredes de crateras vulcânicas e floresce visivelmente apenas durante picos de calor geológico.",
    "baxcalibur-mega": "Espinhos de gelo ao longo da crista acumulam umidade atmosférica e se aiam naturalmente antes do amanhecer. Usa a cauda com lâmina para ancorar em glaciares e resistir ao arrasto durante avalanches.",
    "shaymin-sky": "A flor nas costas semeia nuvens com fragrância que induz chuva para limpar o solo abaixo. Cobre mais de mil quilômetros em planio único usando térmicas de campos iluminados pelo sol.",
    "keldeo-resolute": "O chifre crescido após encontrar determinação brilha quando sente o treinador vinculado se aproximando. Escolhe especificamente corredeiras desafiadoras durante sessões de treino ao cruzar rios da região.",
    "meloetta-pirouette": "Mudanças no ritmo da canção causam alinhamento involuntário nos membros de ouvintes próximos. Usa a forma de combate apenas para remover obstáculos que impeçam chegar onde quer cantar.",
    "hoopa-unbound": "Os anéis abrem dimensões onde acumula itens roubados de mercados humanos ao longo de muitos anos. Na forma sem limites cada braço extra se especializa num tipo separado de ataque à distância simultâneo.",
    "zarude-dada": "As vinhas da capa liberam constantemente compostos de cura absorvidos das raízes da floresta abaixo. Inspeciona filhotes de Pokémon por ferimentos toda manhã e carrega os mais fracos até se recuperarem.",
    "dialga-origin": "Agacha baixo com o rosto quase no nível da água e se move exclusivamente em trajetórias espirais. Sua presença causa relógios em grande raio a funcionar em taxas visivelmente inconsistentes.",
    "palkia-origin": "A silhueta cobre todo o perímetro do território em uma única manhã sem refazer nenhum caminho. Bússolas falham completamente dentro de vários quilômetros de sua presença ativa nesta forma.",
    "giratina-origin": "O conjunto de tentáculos ancora em múltiplas camadas dimensionais ao mesmo tempo durante o voo. Consegue passar por objetos sólidos deixando pós-imagem que persiste no local original por minutos.",
    "tornadus-therian": "A rotação do corpo nunca diminui mesmo enquanto a criatura aparentemente descansa completamente. Aninha exclusivamente em altitudes com pressão de ar menor que metade do nível do mar.",
    "thundurus-therian": "O corpo enrolado armazena cargas eletromagnéticas ao longo de cada fila de escamas de forma independente. Cada escama é independentemente móvel e ajusta ângulo para redirecionar raios conforme o alvo.",
    "landorus-therian": "As listras de tigre estão orientadas em alinhamento preciso com os limites tectônicos do território. O arado que faz pelo solo montanhoso é o principal mecanismo de criação de novas terras agrícolas remotas.",
    "kyurem-black": "Uma metade irradia frio e a outra emite eletricidade crepitante em pulsos alternos constantes. O diferencial de temperatura entre os dois lados impulsiona poderosas correntes de ar ao redor permanentemente.",
    "kyurem-white": "A metade branca fundida queima com corona de calor visível a todo momento independentemente da temperatura externa. Respira gelo e fogo em fluxos alternados que nunca se misturam nem se confundem.",
    "necrozma-dusk": "A juba de leão absorvida brilha em intervalos correspondentes à saída ultravioleta de aglomerados estelares. Sua sombra durante eclipses totais se estende sobre paisagens regionais inteiras além do próprio eclipse.",
    "necrozma-dawn": "As asas de fótons condensados deformam levemente ao redor de corpos com forte campo gravitacional. É a única forma em que comunica ativamente com outros Pokémon através de pulsos de luz noturnos.",
    "necrozma-ultra": "O prisma que forma o núcleo refrata qualquer energia dirigida a ele em sete feixes separados. Sua presença faz Pokémon próximos ficarem calmos e cessarem automaticamente atividades territoriais em curso.",
    "zacian-crowned": "A espada se formou naturalmente de saliva cristalizada ao longo de décadas de patrulha territorial. Recusa-se a atacar qualquer Pokémon com sinais claros de ferimento e se retira nesses casos.",
    "zamazenta-crowned": "Cada placa no escudo foi formada comprimindo camadas de própria pelagem descartada ao longo de séculos. Posiciona-se entre ameaças e Pokémon menores instintivamente mesmo sem instrução de treinadores.",
    "enamorus-therian": "Nesta forma enrola em colunas de nuvens e desce lentamente em direção a vales durante a estação quente. A energia irradiada faz flores da região floresceram semanas antes do calendário natural esperado.",
    "ogerpon-wellspring-mask": "Usando esta máscara ela puxa água de aquíferos subterrâneos e a libera pelos buracos dos olhos. A água produzida é mensuravelmente mais pura que fontes naturais e atrai Pokémon migradores.",
    "ogerpon-heartflame-mask": "A máscara de fogo faz o ar ao redor tremer visivelmente quando caminha por floresta completamente parada. Usa o calor irradiado para navegar na total escuridão detectando obstáculos como variações de temperatura.",
    "ogerpon-cornerstone-mask": "A máscara pedra-angular comprime o ar em concha sólida transparente ao redor das juntas do torso. Testa a dureza do solo pressionando devagar antes de cada passo e recua se a superfície for instável.",
    "terapagos-terastal": "A concha prismática refrata a iluminação de qualquer ambiente produzindo uma assinatura de cor única. Pesquisadores identificam indivíduos desta espécie catalogando o padrão de cor específico que cada um emite.",
    "terapagos-stellar": "A forma estelar irradia campo que diminui pela metade a taxa de decomposição de matéria orgânica no alcance. Civilizações antigas reconheceram esse efeito e construíram locais de armazenamento de alimentos próximos."
};

  if (overrides[key]) return overrides[key];

  if (key.includes('mega')) return `Na Mega Evolução, ${speciesName} altera seu comportamento e exibe características físicas completamente distintas. Esse estado temporário muda fundamentalmente como ele interage com o ambiente.`;
  if (key.includes('gmax')) return `No fenômeno Gigantamax, ${speciesName} cresce além dos limites normais e passa a afetar o terreno ao redor apenas com sua presença. Essa forma é extremamente rara e nunca permanente.`;
  if (key.includes('alola')) return `Em Alola, ${speciesName} adaptou-se ao clima tropical desenvolvendo hábitos distintos dos de outros sistemas populacionais. Suas rotinas diárias específicas diferem marcadamente das regiões de origem.`;
  if (key.includes('galar')) return `Em Galar, ${speciesName} enfrentou condições extremas que moldaram sua anatomia de formas únicas. Indivíduos desta variação são notavelmente mais agressivos em situações de pressão.`;
  if (key.includes('hisui')) return `A forma ancestral de Hisui de ${speciesName} demonstra comportamentos primitivos raramente vistos nos descendentes modernos. O isolamento histórico produziu características físicas e instintos distintos.`;
  if (key.includes('paldea')) return `A variação de Paldea de ${speciesName} desenvolve habilidades específicas alinhadas com o terreno aberto da região. Seu comportamento social difere bastante dos grupos encontrados em outras áreas.`;

  return `Esta variação de ${speciesName} exibe diferenças comportamentais notáveis em relação à forma base. Pesquisadores continuam estudando os padrões únicos desta cepa isolada.`;
}
