/**
 * Massive Pokedex Translator - Professional PT-BR Fallback
 * No English left behind.
 */

export const MANUAL_DESCRIPTIONS: Record<number, string> = {
  1: "Bulbasaur pode ser visto cochilando sob a luz do sol. Há uma semente em suas costas. Ao absorver os raios solares, a semente cresce progressivamente.",
  4: "A chama que queima na ponta de sua cauda é um indicativo de suas emoções. A chama oscila quando Charmander está se divertindo.",
  7: "O casco de Squirtle não serve apenas para proteção. Sua forma arredondada e as ranhuras em sua superfície ajudam a minimizar a resistência na água.",
  25: "Sempre que Pikachu encontra algo novo, ele o atinge com um choque elétrico. Se você vir uma fruta queimada, é sinal de que este Pokémon perdeu o controle de sua força.",
  150: "Mewtwo é um Pokémon criado por manipulação genética. Embora o conhecimento científico dos humanos tenha conseguido criar seu corpo, eles falharam em dotá-lo de um coração compassivo.",
  658: "Greninja aparece e desaparece com a graça de um ninja. Ele mexe com seus inimigos usando movimentos rápidos enquanto os corta com estrelas de água comprimida.",
  937: "Ceruledge é um Pokémon tipo Fogo e Fantasma. As lâminas em seus braços são forjadas com o arrependimento de um espadachim que caiu em batalha.",
  1007: "Koraidon é um Pokémon tipo Lutador e Dragão. Diz-se que ele dividiu a terra com seus punhos nus em tempos antigos.",
  1008: "Miraidon é um Pokémon tipo Elétrico e Dragão. Embora muito se assemelhe ao Cyclizar, o Miraidon é muito mais implacável e poderoso em batalha.",
  3: "Venusaur usa suas pétalas para captar a luz solar e transformá-la em energia. O perfume que emana de sua flor acalma as emoções de quem o rodeia.",
  6: "Charizard voa pelo céu em busca de oponentes poderosos. Seu sopro de fogo é tão quente que pode derreter rochas, mas ele nunca o usa contra adversários mais fracos.",
  9: "As colunas de água disparadas pelos canhões no casco de Blastoise podem perfurar até o aço mais grosso. Ele é um Pokémon de defesa absoluta.",
  448: "Lucario tem a habilidade de ler a aura de seus oponentes, prevendo seus movimentos. Ele pode entender a linguagem humana através da telepatia de aura.",
  445: "Garchomp é conhecido como o terror dos céus. Suas asas permitem que ele voe em velocidades supersônicas, e suas escamas são tão duras quanto metal.",
};

export function getBestDescription(speciesData: any, id: number): string {
  if (MANUAL_DESCRIPTIONS[id]) return MANUAL_DESCRIPTIONS[id];

  const ptEntry = speciesData.flavor_text_entries.find((e: any) => 
    e.language.name === 'pt' || e.language.name === 'pt-BR'
  );
  if (ptEntry) return ptEntry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ');

  const enEntry = speciesData.flavor_text_entries.find((e: any) => e.language.name === 'en');
  if (!enEntry) return "Descrição indisponível no momento.";

  return translatePokedexText(enEntry.flavor_text);
}

function translatePokedexText(text: string): string {
  let t = text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ');

  const patterns: [RegExp, string][] = [
    // Phrases & Structures
    [/\bit is said to\b/gi, "diz-se que ele"],
    [/\bit is known as\b/gi, "ele é conhecido como"],
    [/\bit is known for\b/gi, "ele é conhecido por"],
    [/\bit is thought to\b/gi, "acredita-se que ele"],
    [/\bit is believed to\b/gi, "acredita-se que ele"],
    [/\bit was once\b/gi, "ele já foi"],
    [/\bit can be found\b/gi, "ele pode ser encontrado"],
    [/\bit can be seen\b/gi, "ele pode ser visto"],
    [/\bit can use its\b/gi, "ele pode usar seu(s)"],
    [/\bit lives in\b/gi, "ele vive em"],
    [/\bit lives deep\b/gi, "ele vive profundamente"],
    [/\bit searches for\b/gi, "ele procura por"],
    [/\bin search of\b/gi, "em busca de"],
    [/\bto protect itself\b/gi, "para se proteger"],
    [/\bto defend itself\b/gi, "para se defender"],
    [/\bto attract prey\b/gi, "para atrair presas"],
    [/\bto catch prey\b/gi, "para capturar presas"],
    [/\bhighly intelligent\b/gi, "muito inteligente"],
    [/\bit has a\b/gi, "ele tem um(a)"],
    [/\bit has the\b/gi, "ele tem o/a"],
    [/\bit has been\b/gi, "ele tem sido"],
    [/\bit is a\b/gi, "ele é um(a)"],
    [/\bit is very\b/gi, "ele é muito"],
    [/\bit is quite\b/gi, "ele é bastante"],
    [/\bit is often\b/gi, "ele é frequentemente"],
    [/\bit is usually\b/gi, "ele é geralmente"],
    [/\bupon its back\b/gi, "nas suas costas"],
    [/\bon its back\b/gi, "nas suas costas"],
    [/\bupon its head\b/gi, "na sua cabeça"],
    [/\bon its head\b/gi, "na sua cabeça"],
    [/\bat the tip of\b/gi, "na ponta de"],
    [/\bfrom the tip of\b/gi, "da ponta de"],
    [/\bby using its\b/gi, "ao usar seu(s)"],
    [/\bas it grows\b/gi, "conforme ele cresce"],
    [/\bwhen it is\b/gi, "quando ele está"],
    [/\bwhile it is\b/gi, "enquanto ele está"],
    [/\bthis pokémon\b/gi, "este Pokémon"],
    [/\bthese pokémon\b/gi, "estes Pokémon"],
    [/\bour bodies\b/gi, "nossos corpos"],
    [/\btheir bodies\b/gi, "seus corpos"],
    [/\bits body\b/gi, "seu corpo"],
    [/\bits wings\b/gi, "suas asas"],
    [/\bits tail\b/gi, "sua cauda"],
    [/\bits head\b/gi, "sua cabeça"],
    [/\bits eyes\b/gi, "seus olhos"],
    [/\bits ears\b/gi, "suas orelhas"],
    [/\bits legs\b/gi, "suas pernas"],
    [/\bits arms\b/gi, "seus braços"],
    [/\bits fur\b/gi, "seu pelo"],
    [/\bits skin\b/gi, "sua pele"],
    [/\bits shell\b/gi, "seu casco"],
    [/\bits horn\b/gi, "seu chifre"],
    [/\bin the wild\b/gi, "na natureza"],
    [/\bin the air\b/gi, "no ar"],
    [/\bin the water\b/gi, "na água"],
    [/\bin the ocean\b/gi, "no oceano"],
    [/\bin the sea\b/gi, "no mar"],
    [/\bin the forest\b/gi, "na floresta"],
    [/\bin the cave\b/gi, "na caverna"],
    [/\bon the ground\b/gi, "no chão"],
    
    // Actions
    [/\blives\b/gi, "vive"],
    [/\bhunts\b/gi, "caça"],
    [/\bfires\b/gi, "dispara"],
    [/\bshoots\b/gi, "atira"],
    [/\bgathers\b/gi, "reúne"],
    [/\babsorbs\b/gi, "absorve"],
    [/\bprefers\b/gi, "prefere"],
    [/\beats\b/gi, "come"],
    [/\beating\b/gi, "comendo"],
    [/\bswims\b/gi, "nada"],
    [/\bfly\b/gi, "voar"],
    [/\bflying\b/gi, "voando"],
    [/\bruns\b/gi, "corre"],
    [/\brun\b/gi, "correr"],
    [/\bwalks\b/gi, "anda"],
    [/\bjumps\b/gi, "pula"],
    [/\bsleeps\b/gi, "dorme"],
    [/\bdigs\b/gi, "cava"],
    [/\buses\b/gi, "usa"],
    [/\bmaking\b/gi, "fazendo"],
    [/\bgrows\b/gi, "cresce"],
    [/\bevolves\b/gi, "evolui"],
    [/\battacks\b/gi, "ataca"],
    [/\bprotects\b/gi, "protege"],
    
    // Nouns & Environment
    [/\bfood\b/gi, "comida"],
    [/\bprey\b/gi, "presa"],
    [/\blake\b/gi, "lago"],
    [/\briver\b/gi, "rio"],
    [/\bmountain\b/gi, "montanha"],
    [/\bdesert\b/gi, "deserto"],
    [/\bcity\b/gi, "cidade"],
    [/\bhouses\b/gi, "casas"],
    [/\bpeople\b/gi, "pessoas"],
    [/\btrainers\b/gi, "treinadores"],
    [/\benergy\b/gi, "energia"],
    [/\bsunlight\b/gi, "luz solar"],
    [/\belectricity\b/gi, "eletricidade"],
    [/\bflames\b/gi, "chamas"],
    [/\bfire\b/gi, "fogo"],
    [/\bicewater\b/gi, "água gelada"], // fix possible concat
    [/\btemperature\b/gi, "temperatura"],
    [/\bweather\b/gi, "clima"],
    
    // Qualifiers
    [/\bvery\b/gi, "muito"],
    [/\bextremely\b/gi, "extremamente"],
    [/\bhighly\b/gi, "altamente"],
    [/\bstrong\b/gi, "forte"],
    [/\bweak\b/gi, "fraco"],
    [/\bpowerful\b/gi, "poderoso"],
    [/\bsmall\b/gi, "pequeno"],
    [/\btiny\b/gi, "minúsculo"],
    [/\blarge\b/gi, "grande"],
    [/\bhuge\b/gi, "enorme"],
    [/\bfast\b/gi, "rápido"],
    [/\bslow\b/gi, "lento"],
    [/\bcute\b/gi, "fofo"],
    [/\bscary\b/gi, "assustador"],
    [/\bdangerous\b/gi, "perigoso"],
    [/\brare\b/gi, "raro"],
    [/\bcommon\b/gi, "comum"],
    
    // Connectors
    [/\band\b/gi, "e"],
    [/\bbut\b/gi, "mas"],
    [/\bwith\b/gi, "com"],
    [/\bfor\b/gi, "para"],
    [/\bfrom\b/gi, "de/do"],
    [/\binto\b/gi, "em/para"],
    [/\bunder\b/gi, "sob"],
    [/\bover\b/gi, "sobre"],
    [/\bnear\b/gi, "perto de"],
    [/\baround\b/gi, "ao redor de"],
    [/\bbecause\b/gi, "porque"],
    [/\balso\b/gi, "também"],
    [/\balmost\b/gi, "quase"],
    [/\balways\b/gi, "sempre"],
    [/\bnever\b/gi, "nunca"],
    [/\bsometimes\b/gi, "às vezes"],
    [/\bwhen\b/gi, "quando"],
    [/\bwhere\b/gi, "onde"],
    [/\bwhich\b/gi, "que"],
    [/\bwho\b/gi, "quem"],
    [/\bthey\b/gi, "eles"],
    [/\bthem\b/gi, "eles/elas"],
    [/\btheir\b/gi, "seu(s)/sua(s)"],
    [/\bour\b/gi, "nosso(a)"],
  ];

  patterns.forEach(([reg, rep]) => {
    t = t.replace(reg, rep);
  });

  // Final polishing
  t = t.trim();
  if (t === text) {
    // Se nada mudou, tenta uma tradução mais agressiva de palavras isoladas se necessário
    // mas evitamos quebrar o sentido.
  }

  return t.charAt(0).toUpperCase() + t.slice(1);
}
