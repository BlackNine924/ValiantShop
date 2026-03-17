/**
 * Manual translations and pattern-based translation for Pokemons
 */
export const MANUAL_TRANSLATIONS: Record<number, string> = {
  // Gen 1 Starters (For good first impression)
  1: "Bulbasaur pode ser visto cochilando sob a luz do sol. Há uma semente em suas costas. Ao absorver os raios solares, a semente cresce progressivamente.",
  2: "Há um bulbo nas costas deste Pokémon. Para suportar seu peso, as pernas de Ivysaur tornam-se fortes e resistentes.",
  3: "Há uma flor enorme nas costas de Venusaur. Diz-se que a flor assume cores vivas se receber nutrição e luz solar em abundância.",
  4: "A chama que queima na ponta de sua cauda é um indicativo de suas emoções. A chama oscila quando Charmander está se divertindo.",
  5: "Charmeleon destrói seus inimigos impiedosamente usando suas garras afiadas. Se encontrar um oponente forte, ele se torna agressivo.",
  6: "Charizard voa pelo céu em busca de oponentes poderosos. Ele cospe fogo de calor tão grande que derrete qualquer coisa.",
  7: "O casco de Squirtle não serve apenas para proteção. Sua forma arredondada e as ranhuras em sua superfície ajudam a minimizar a resistência na água.",
  8: "Suas caudas são cobertas por um pelo rico e espesso. A cauda se torna cada vez mais profunda em cor à medida que Wartortle envelhece.",
  9: "Blastoise possui canhões de água que brotam de seu casco. Eles são usados para disparos de água com precisão absoluta.",
  25: "Sempre que Pikachu encontra algo novo, ele o atinge com um choque elétrico. Se você vir uma fruta queimada, é sinal de que este Pokémon perdeu o controle de sua força.",

  // Gen 9 Starters
  906: "Sprigatito é um Pokémon tipo Planta. É caprichoso e busca atenção. Se seu treinador der atenção a outro Pokémon, Sprigatito ficará amuado.",
  907: "Floragato é um Pokémon tipo Planta. Manipula habilmente a semente em sua vinha longa para golpear seus oponentes.",
  908: "Meowscarada é um Pokémon tipo Planta e Noturno. Com passos leves, ele se aproxima dos inimigos e detona a semente carregada de pólen antes que percebam.",
  909: "Fuecoco é um Pokémon tipo Fogo. É descontraído e faz as coisas no seu próprio ritmo. Ele adora comer.",
  910: "Crocalor é um Pokémon tipo Fogo. A válvula de fogo em sua cabeça e sua voz potente se combinam para disparar fogo e som simultaneamente.",
  911: "Skeledirge é um Pokémon tipo Fogo e Fantasma. O canto suave deste Pokémon acalma as almas de todos que o ouvem. Ele queima seus inimigos com chamas intensas.",
  912: "Quaxly é um Pokémon tipo Água. Este Pokémon é sério e segue fielmente seu treinador. Ele mantém seu corpo sempre limpo e brilhante.",
  913: "Quaxwell é um Pokémon tipo Água. Observar o movimento constante e gracioso de suas pernas é como assistir a um dançarino habilidoso.",
  914: "Quaquaval é um Pokémon tipo Água e Lutador. Um único chute deste Pokémon pode capotar um caminhão. Ele balança seu corpo em danças exóticas.",
  
  // Gen 9 Popular
  921: "Pawmi é um Pokémon tipo Elétrico. Além das bolsas em suas bochechas, Pawmi tem órgãos que descarregam eletricidade em suas patas dianteiras.",
  922: "Pawmo é um Pokémon tipo Elétrico e Lutador. Quando este Pokémon se vê em perigo, ele usa uma técnica de combate única para descarregar eletricidade com as palmas das patas.",
  923: "Pawmot é um Pokémon tipo Elétrico e Lutador. Ele armazena eletricidade em seu pelo. Embora normalmente seja dócil, ele derruba seus inimigos com ataques rápidos como um raio.",
  935: "Charcadet é um Pokémon tipo Fogo. Quando sua paixão queima, a temperatura de suas chamas de carvão aumenta drasticamente.",
  936: "Armarouge é um Pokémon tipo Fogo e Psíquico. Este Pokémon acredita em uma luta justa e enfrentará qualquer oponente de frente.",
  937: "Ceruledge é um Pokémon tipo Fogo e Fantasma. As lâminas em seus braços são forjadas com o arrependimento de um espadachim que caiu em batalha.",
  
  // Gen 9 Legends
  1007: "Koraidon é um Pokémon tipo Lutador e Dragão. Diz-se que ele dividiu a terra com seus punhos nus em tempos antigos.",
  1008: "Miraidon é um Pokémon tipo Elétrico e Dragão. Embora muito se assemelhe ao Cyclizar, o Miraidon é muito mais implacável e poderoso em batalha.",
  
  // Paradoxo
  984: "Great Tusk é um Pokémon tipo Terra e Lutador. Lembra uma criatura descrita em um livro antigo como um monstro implacável.",
  990: "Iron Valiant é um Pokémon tipo Fada e Lutador. Tem semelhanças com um objeto descrito em um jornal de ficção científica.",
};

const COMMON_PATTERNS: [RegExp, string][] = [
  [/\bIt lives in\b/gi, "Vive em"],
  [/\bIt eats\b/gi, "Ele come"],
  [/\bThis Pokémon\b/gi, "Este Pokémon"],
  [/\bIt was discovered\b/gi, "Foi descoberto"],
  [/\bKnown for\b/gi, "Conhecido por"],
  [/\bIts power\b/gi, "Seu poder"],
  [/\bIt protects\b/gi, "Ele protege"],
  [/\bIt uses\b/gi, "Ele usa"],
  [/\bIt can\b/gi, "Ele pode"],
  [/\bIt has\b/gi, "Ele tem"],
  [/\bWhen several of these POKéMON gather\b/gi, "Quando vários desses POKéMON se reúnem"],
  [/\btheir electricity could build and cause lightning storms\b/gi, "sua eletricidade pode aumentar e causar tempestades de raios"],
  [/\bA strange seed was planted on its back at birth\b/gi, "Uma semente estranha foi plantada em suas costas ao nascer"],
  [/\bThe plant blooms and grows with the progress of its evolution\b/gi, "A planta floresce e cresce com o progresso de sua evolução"],
  [/\bis known\b/gi, "é conhecido"],
  [/\bis said\b/gi, "diz-se"],
  [/\bis a\b/gi, "é um"],
  [/\bhas a\b/gi, "tem um"],
  [/\bforests\b/gi, "florestas"],
  [/\bmountains\b/gi, "montanhas"],
  [/\boceans\b/gi, "oceanos"],
  [/\bcaves\b/gi, "cavernas"],
  [/\bAbility\b/gi, "Habilidade"],
  [/\bhidden\b/gi, "oculta"],
  [/\bstrong\b/gi, "forte"],
  [/\bfast\b/gi, "rápido"],
  [/\bsmall\b/gi, "pequeno"],
  [/\blarge\b/gi, "grande"],
  [/\blightning\b/gi, "raio"],
  [/\belectricity\b/gi, "eletricidade"],
  [/\bstorm\b/gi, "tempestade"],
  [/\bpower\b/gi, "poder"],
  [/\bwater\b/gi, "água"],
  [/\bfire\b/gi, "fogo"],
  [/\bgrass\b/gi, "planta"],
  [/\belectric\b/gi, "elétrico"],
  [/\bpsychic\b/gi, "psíquico"],
  [/\bfighting\b/gi, "lutador"],
  [/\bflying\b/gi, "voador"],
  [/\bpoison\b/gi, "venenoso"],
  [/\bground\b/gi, "terra"],
  [/\brock\b/gi, "pedra"],
  [/\bbug\b/gi, "inseto"],
  [/\bghost\b/gi, "fantasma"],
  [/\bsteel\b/gi, "aço"],
  [/\bice\b/gi, "gelo"],
  [/\bdragon\b/gi, "dragão"],
  [/\bdark\b/gi, "noturno"],
  [/\bfairy\b/gi, "fada"],
  [/\battacks\b/gi, "ataques"],
  [/\benemy\b/gi, "inimigo"],
  [/\bbattle\b/gi, "batalha"],
  [/\benergy\b/gi, "energia"],
  [/\bworld\b/gi, "mundo"],
  [/\bnature\b/gi, "natureza"],
  [/\bwild\b/gi, "selvagem"],
  [/\bteam\b/gi, "equipe"],
  [/\btrainer\b/gi, "treinador"],
  [/\bvery\b/gi, "muito"],
  [/\bextremely\b/gi, "extremamente"],
  [/\balways\b/gi, "sempre"],
  [/\bsometimes\b/gi, "às vezes"],
  [/\brare\b/gi, "raro"],
  [/\bcommon\b/gi, "comum"],
  [/\bThe\b/g, "O"],
  [/\bIts\b/g, "Seu"],
  [/\bIt\b/g, "Ele"],
  [/\bHer\b/g, "Dela"],
  [/\bHis\b/g, "Dele"],
  [/\bTheir\b/g, "Deles"],
  [/\bThey\b/g, "Eles"],
  [/\bback\b/gi, "costas"],
  [/\bbirth\b/gi, "nascimento"],
  [/\bsprouts\b/gi, "brota"],
  [/\bgrows\b/gi, "cresce"],
  [/\bevolution\b/gi, "evolução"],
  [/\bevolving\b/gi, "evoluindo"],
  [/\blevel\b/gi, "nível"],
  [/\bstone\b/gi, "pedra"],
  [/\bfriendship\b/gi, "amizade"],
  [/\btrade\b/gi, "troca"],
  [/\bmove\b/gi, "movimento"],
  [/\barea\b/gi, "área"],
  [/\bregion\b/gi, "região"],
  [/\bcity\b/gi, "cidade"],
  [/\btown\b/gi, "vila"],
  [/\broute\b/gi, "rota"],
  [/\bhidden\b/gi, "escondido"],
  [/\bsecret\b/gi, "secreto"],
  [/\bancient\b/gi, "antigo"],
  [/\blegendary\b/gi, "lendário"],
  [/\bmythical\b/gi, "mítico"],
  [/\bstrong\b/gi, "forte"],
  [/\bweak\b/gi, "fraco"],
  [/\bdefense\b/gi, "defesa"],
  [/\bspeed\b/gi, "velocidade"],
  [/\bhealth\b/gi, "saúde"],
  [/\bpoints\b/gi, "pontos"],
  [/\bdamage\b/gi, "dano"],
  [/\beffective\b/gi, "eficaz"],
  [/\bsuper\b/gi, "super"],
  [/\bresistant\b/gi, "resistente"],
  [/\bvulnerable\b/gi, "vulnerável"],
  [/\bimmune\b/gi, "imune"],
  [/\bPokegrid\b/g, "Pokégrid"],
];

export function translateDescription(text: string, id: number | string): string {
  const numId = Number(id);
  // 1. Manual override first
  if (MANUAL_TRANSLATIONS[numId]) {
    return MANUAL_TRANSLATIONS[numId];
  }

  // 2. Pattern matching for "Automatic Translation"
  let translated = text;
  
  for (const [pattern, replacement] of COMMON_PATTERNS) {
    translated = translated.replace(pattern, replacement);
  }

  // Remove automatic translation marks as requested
  translated = translated.replace(/\(Trad\. Automática\)/g, '').trim();

  return translated;
}
