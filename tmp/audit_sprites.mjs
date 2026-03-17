import fs from 'fs';
import path from 'path';

// Mapeamentos extraídos do pokemonTypes.ts
const MEGA_NAME_MAP = {
  "20003": "venusaur-mega", "20006": "charizard-megax", "20009": "blastoise-mega", "20015": "beedrill-mega",
  "20018": "pidgeot-mega", "20026": "raichu-megax", "20036": "clefable-mega", "20065": "alakazam-mega",
  "20071": "victreebel-mega", "20080": "slowbro-mega", "20094": "gengar-mega", "20115": "kangaskhan-mega",
  "20121": "starmie-mega", "20127": "pinsir-mega", "20130": "gyarados-mega", "20142": "aerodactyl-mega",
  "20149": "dragonite-mega", "20150": "mewtwo-megax", "20154": "meganium-mega", "20160": "feraligatr-mega",
  "20181": "ampharos-mega", "20208": "steelix-mega", "20212": "scizor-mega", "20214": "heracross-mega",
  "20227": "skarmory-mega", "20229": "houndoom-mega", "20248": "tyranitar-mega", "20254": "sceptile-mega",
  "20257": "blaziken-mega", "20260": "swampert-mega", "20282": "gardevoir-mega", "20302": "sableye-mega",
  "20303": "mawile-mega", "20306": "aggron-mega", "20308": "medicham-mega", "20310": "manectric-mega",
  "20319": "sharpedo-mega", "20323": "camerupt-mega", "20334": "altaria-mega", "20354": "banette-mega",
  "20358": "chimecho-mega", "20359": "absol-mega", "20362": "glalie-mega", "20373": "salamence-mega",
  "20376": "metagross-mega", "20380": "latias-mega", "20381": "latios-mega", "20384": "rayquaza-mega",
  "20398": "staraptor-mega", "20428": "lopunny-mega", "20445": "garchomp-mega", "20448": "lucario-mega",
  "20460": "abomasnow-mega", "20475": "gallade-mega", "20478": "froslass-mega", "20485": "heatran-mega",
  "20491": "darkrai-mega", "20500": "emboar-mega", "20530": "excadrill-mega", "20531": "audino-mega",
  "20545": "scolipede-mega", "20560": "scrafty-mega", "20604": "eelektross-mega", "20609": "chandelure-mega",
  "20623": "golurk-mega", "20652": "chesnaught-mega", "20655": "delphox-mega", "20658": "greninja-mega",
  "20668": "pyroar-mega", "20670": "floette-eternal", "20678": "meowstic-mega", "20687": "malamar-mega",
  "20689": "barbaracle-mega", "20691": "dragalge-mega", "20701": "hawlucha-mega", "20718": "zygarde-mega",
  "20719": "diancie-mega", "20740": "crabominable-mega", "20768": "golisopod-mega", "20780": "drampa-mega",
  "20801": "magearna-mega", "20807": "zeraora-mega", "20870": "falinks-mega", "20952": "scovillain-mega",
  "20970": "glimmora-mega", "20978": "tatsugiri-curly-mega", "20239": "tatsugiri-droopy-mega",
  "210147": "magearna-original-mega", "20998": "baxcalibur-mega", "21006": "charizard-megay",
  "21026": "raichu-megay", "21150": "mewtwo-megay", "21359": "absol-megaz", "21445": "garchomp-megaz",
  "21448": "lucario-megaz"
};

const DYNAMAX_NAME_MAP = {
  30003: "venusaur-gmax", 30006: "charizard-gmax", 30009: "blastoise-gmax", 30012: "butterfree-gmax",
  30025: "pikachu-gmax", 30052: "meowth-gmax", 30068: "machamp-gmax", 30091: "cloyster-gmax",
  30094: "gengar-gmax", 30099: "kingler-gmax", 30131: "lapras-gmax", 30133: "eevee-gmax",
  30143: "snorlax-gmax", 30569: "garbodor-gmax", 30809: "melmetal-gmax", 30812: "rillaboom-gmax",
  30815: "cinderace-gmax", 30818: "inteleon-gmax", 30823: "corviknight-gmax", 30826: "orbeetle-gmax",
  30834: "drednaw-gmax", 30839: "coalossal-gmax", 30841: "flapple-gmax", 30842: "appletun-gmax",
  30844: "sandaconda-gmax", 30849: "toxtricity-gmax", 30851: "centiskorch-gmax", 30858: "hatterene-gmax",
  30861: "grimmsnarl-gmax", 30869: "alcremie-gmax", 30879: "copperajah-gmax", 30884: "duraludon-gmax",
  30890: "eternatus-eternamax", 30892: "urshifu-gmax"
};

const megaPath = 'public/assets/sprites/mega';
const dmaxPath = 'public/assets/sprites/dynamax';

function check() {
  const report = [];

  // Check Megas
  for (const [id, name] of Object.entries(MEGA_NAME_MAP)) {
    const normal = path.join(megaPath, `${id}.png`);
    const shiny = path.join(megaPath, `${id}-shiny.png`);
    report.push({
      id, name, type: 'Mega',
      normal: fs.existsSync(normal),
      shiny: fs.existsSync(shiny)
    });
  }

  // Check Dynamax
  for (const [id, name] of Object.entries(DYNAMAX_NAME_MAP)) {
    const normal = path.join(dmaxPath, `${id}.png`);
    const shiny = path.join(dmaxPath, `${id}-shiny.png`);
    report.push({
      id, name, type: 'G-Max',
      normal: fs.existsSync(normal),
      shiny: fs.existsSync(shiny)
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

check();
