# Como Adicionar Sprites e Artworks Manualmente

O sistema agora é **totalmente automático**. Você não precisa mais mexer em nenhum arquivo de código (`.ts` ou `.tsx`) para adicionar novos Pokémons, Megas ou Dynamax. O sistema identifica as imagens automaticamente se estiverem nas pastas corretas com os nomes corretos.

## 1. Onde colocar as imagens?

As imagens devem ser colocadas dentro da pasta `public/assets/sprites/`. Existem três pastas principais:

### **A. Pokégrid (Sprites do Jogo)**
Use estas pastas para as sprites que aparecem no minigame Pokégrid.
- **Megas:** `public/assets/sprites/mega/` (Ex: `20xxx.png`)
- **Dynamax:** `public/assets/sprites/dynamax/` (Ex: `30xxx.png`)

### **B. Pokédex (Artworks do Anime)**
Use esta pasta para as imagens de alta qualidade que aparecem no detalhe da Pokédex.
- **Megas:** `public/assets/artwork/mega/`
- **Dynamax:** `public/assets/artwork/dynamax/`
- **Variações:** `public/assets/artwork/variations/`

> [!IMPORTANT]
> **Separação Estrita:** As pastas acima são **independentes**. Você pode ter um arquivo `20006.png` na pasta `sprites/mega/` (usado no Jogo/Grid) e outro arquivo `20006.png` na pasta `artwork/mega/` (usado na Pokédex). Não há conflito.

---

## 2. Como nomear os arquivos?

O nome do arquivo deve ser exatamente o **ID do Pokémon** definido no sistema.

### **Regra de Nomes:**
- **Versão Normal:** `{id}.png` (Exemplo: `20006.png`)
- **Versão Shiny:** `{id}-shiny.png` (Exemplo: `20006-shiny.png`)

### **Exemplos de IDs:**
- **Mega Charizard X:** `20006`
    - Sprite Jogo: `public/assets/sprites/mega/20006.png`
    - Artwork Anime: `public/assets/artwork/mega/20006.png`
- **Mega Charizard X Shiny:**
    - Sprite Jogo: `public/assets/sprites/mega/20006-shiny.png` (Opcional)
    - Artwork Anime: `public/assets/artwork/mega/20006-shiny.png`
- **Gigantamax Pikachu:** `30025`
    - Sprite Jogo: `public/assets/sprites/dynamax/30025.png`
    - Artwork Anime: `public/assets/artwork/dynamax/30025.png`

---

## 3. Resumo de Pastas e IDs

| Tipo | Pasta (Jogo/Grid) | Pasta (Anime/Dex) | Faixa de ID |
| :--- | :--- | :--- | :--- |
| **Mega** | `/assets/sprites/mega/` | `/assets/artwork/mega/` | `20000` a `29999` |
| **Dynamax** | `/assets/sprites/dynamax/` | `/assets/artwork/dynamax/` | `30000` a `39999` |

---

## 4. Persistência de Dados (Firebase)

Agora todo o progresso (Pokégrid e Pokédex) é salvo automaticamente no **Firebase** com base no **Nick do Minecraft** do usuário.
- O acesso ao Pokégrid e Pokédex é **exclusivo para quem estiver logado**.
- O progresso é sincronizado em tempo real.
- **Pokédex:** Você pode marcar Pokémons como "Capturados" clicando no botão dentro do detalhe do Pokémon.

---

## 5. Tabela de IDs Especiais (Formas Separadas)

Para o Pokégrid, separamos algumas formas que mudam de tipo. Use os IDs abaixo para adicionar os sprites nas pastas correspondentes:

### Formas Regional/Estilo (Pasta `variations`)
- **892**: Urshifu (Single Strike) - Fighting/Dark
- **10892**: Urshifu (Rapid Strike) - Fighting/Water
- **492**: Shaymin (Land) - Grass
- **10492**: Shaymin (Sky) - Grass/Flying

### Gigantamax (Pasta `dynamax`)
- **30892**: G-Max Urshifu (Single Strike)
- **30893**: G-Max Urshifu (Rapid Strike)
- **30091**: G-Max Cloyster
