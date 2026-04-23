/**
 * Utilities for cleaning Pokémon names for sprite lookups.
 * Standardizes names by removing "Shiny " and regional suffixes.
 */

/**
 * Strips regional suffixes common in the system's naming convention.
 * Example: "Cyndaquil de Hisui" -> "Cyndaquil"
 */
export const getBasePokemonName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/\s+(de|of)?\s+(Hisui|Alola|Galar|Paldea)$/i, '')
    .replace(/^(Hisuian|Alolan|Galarian|Paldean)\s+/i, '')
    .trim();
};

/**
 * Returns a totally clean species name for ID lookups.
 * Removes "Shiny " and regionalsuffixes.
 */
export const getCleanSpeciesName = (name: string): string => {
  if (!name) return '';
  let clean = name.trim();
  if (clean.toLowerCase().startsWith('shiny ')) {
    clean = clean.slice(6).trim();
  }
  return getBasePokemonName(clean);
};
