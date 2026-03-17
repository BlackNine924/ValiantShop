Relatório de Auditoria de Sprites (v1.3.2)
Este relatório detalha o estado atual dos arquivos de imagem locais vs. a lógica do sistema.

1. 📂 Resumo de Arquivos em Disco
Sprites Mega: 47 arquivos encontrados em public/assets/sprites/mega/.
Sprites Dynamax: 34 arquivos encontrados em public/assets/sprites/dynamax/.
2. ❌ Versões Shiny Faltantes (Arquivos Locais)
NENHUM arquivo local possui versão Shiny correspondente. Para que o sistema exiba a versão Shiny local, você deve adicionar os arquivos com o sufixo -shiny.png.

Exemplos Críticos (Pokémon com imagem normal mas sem Shiny):

21445.png (Garchomp Mega Z) -> Falta 21445-shiny.png
21448.png (Lucario Mega Z) -> Falta 21448-shiny.png
20978.png (Tatsugiri Curly Mega) -> Falta 20978-shiny.png
20239.png (Tatsugiri Droopy Mega) -> Falta 20239-shiny.png
210147.png (Magearna Original Mega) -> Falta 210147-shiny.png
3. ⚠️ Arquivos Órfãos (Existem na pasta mas NÃO estão no código)
Estes arquivos estão ocupando espaço mas o sistema não sabe como usá-los pois não foram mapeados em CUSTOM_SPRITE_URLS no arquivo pokemonTypes.ts:

20780.png (Drampa Mega?)
20801.png (Magearna Mega?)
20807.png (Zeraora Mega?)
20870.png (Falinks Mega?)
20952.png (Scovillain Mega?)
20970.png (Glimmora Mega?)
4. 🔍 Mapeamento de Variações Sem Arquivo Local
Estes Pokémon estão configurados para usar imagem local, mas o arquivo NÃO foi encontrado na pasta:

20026 (Mega Raichu X) - Mapeado, mas não encontrado (verifique se o nome é 20026.png)
21026 (Mega Raichu Y) - Mapeado, mas não encontrado
20359 (Mega Absol) - Não mapeado em Custom, usando fallback
20448 (Mega Lucario) - Não mapeado em Custom, usando fallback
5. 🛠 Sugestões de Correção
Padronização: Garanta que todos os arquivos na pasta mega e dynamax estejam com o ID exato que consta no MEGA_NAME_MAP.
Atualização do Código: Vou precisar adicionar os IDs órfãos (Drampa, Magearna, etc.) na lista CUSTOM_SPRITE_URLS para que eles apareçam na Pokédex.
Imagens Shiny: É necessário criar as cópias shiny com o nome correto.
Status Final: O sistema agora é resiliente e mostra a forma "Base" se a imagem faltar, mas para uma experiência completa, os arquivos acima precisam de atenção.