import type { PokemonType } from './pokemonTypes';

export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

export type EffectivenessCategory = 
  | 'EXTREMAMENTE FRÁGIL (4x)' 
  | 'VULNERÁVEL (2x)' 
  | 'DANO NORMAL (1x)' 
  | 'RESISTENTE (0.5x)' 
  | 'MUITO RESISTENTE (0.25x)' 
  | 'IMUNE (0x)';

export interface TypeMatchup {
  type: PokemonType;
  multiplier: number;
}

export function calculateEffectiveness(targetTypes: PokemonType[]): Record<EffectivenessCategory, PokemonType[]> {
  const result: Record<string, PokemonType[]> = {
    'EXTREMAMENTE FRÁGIL (4x)': [],
    'VULNERÁVEL (2x)': [],
    'DANO NORMAL (1x)': [],
    'RESISTENTE (0.5x)': [],
    'MUITO RESISTENTE (0.25x)': [],
    'IMUNE (0x)': []
  };

  const allTypes: PokemonType[] = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 
    'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 
    'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 
    'Dark', 'Steel', 'Fairy'
  ];

  allTypes.forEach(attackingType => {
    let multiplier = 1;
    targetTypes.forEach(targetType => {
      const effect = TYPE_CHART[attackingType][targetType];
      if (effect !== undefined) {
        multiplier *= effect;
      }
    });

    if (multiplier === 4) result['EXTREMAMENTE FRÁGIL (4x)'].push(attackingType);
    else if (multiplier === 2) result['VULNERÁVEL (2x)'].push(attackingType);
    else if (multiplier === 1) result['DANO NORMAL (1x)'].push(attackingType);
    else if (multiplier === 0.5) result['RESISTENTE (0.5x)'].push(attackingType);
    else if (multiplier === 0.25) result['MUITO RESISTENTE (0.25x)'].push(attackingType);
    else if (multiplier === 0) result['IMUNE (0x)'].push(attackingType);
  });

  return result as Record<EffectivenessCategory, PokemonType[]>;
}
