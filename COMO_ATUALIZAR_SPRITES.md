# Como Atualizar Sprites Manualmente

Se você encontrar um sprite (imagem) que eu não consegui localizar ou que quebrou, você pode atualizar manualmente seguindo estes passos:

### 1. Preparar a Imagem
- A imagem deve estar no formato **.png** (preferencialmente com fundo transparente).
- O nome do arquivo **deve ser exatamente o ID do Pokémon**.
  - Exemplo: O ID do **Mega Lucario Z** é `21448`. O arquivo deve se chamar `21448.png`.

### 2. Onde colocar o arquivo
Abra o Explorer do VS Code e arraste a imagem para a seguinte pasta:
`public/assets/sprites/mega/`

### 3. IDs Úteis (Pokémon Legends Z-A e Especiais)
Aqui estão os IDs que já configurei no código para ler desta pasta:
- `20154`: Mega Meganium
- `20160`: Mega Feraligatr
- `20157`: Mega Typhlosion (Z-A)
- `20149`: Mega Dragonite
- `21448`: Mega Lucario Z
- `21359`: Mega Absol Z
- `20026`: Mega Raichu X
- `21026`: Mega Raichu Y
- `20036`: Mega Clefable
- `20121`: Mega Starmie
- `20227`: Mega Skarmory
- `20071`: Mega Victreebel
- `20970`: Mega Glimmora
- `20609`: Mega Chandelure
- `20687`: Mega Malamar

### 4. Por que fazer isso?
Ao colocar as imagens nesta pasta, o jogo para de depender da internet para carregar esses sprites específicos. Eles ficarão salvos dentro do seu projeto e funcionarão sempre, mesmo se o site original sair do ar.

---
*Dica: Se você adicionar um novo ID que não está nesta lista, me avise para que eu registre ele no código!*
