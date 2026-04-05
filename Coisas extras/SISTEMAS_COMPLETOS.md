# Inventário Completo de Sistemas - ValiantShop

Este documento lista todas as funcionalidades, sistemas e módulos atualmente implementados no sistema ValiantShop, divididos por área de atuação.

---

## 1. Interface do Usuário (Frontend)

8.  **Perfil do Jogador (Settings):** Edição de nicks (Minecraft/Discord) e salvamento de preferências de navegação.
9.  **Sistema de Avaliações (Review System):** Interface para que clientes deixem notas de 1 a 5 estrelas e comentários sobre a entrega.
10. **Suporte Flutuante:** Atalho rápido para contato direto com a equipe administrativa.

---

## 2. Painel Administrativo (Admin Dashboard)

11. **Dash de Estatísticas:** Visão geral com métricas de volume de vendas e faturamento total.
12. **Gestão de Pedidos (Order Manager):** Controle total do fluxo de produção (Pendente -> Breeding -> Finalizado -> Entregue).
13. **Filtros e Busca de Pedidos:** Sistema de busca por nick e filtragem rápida por status de produção.
14. **Baús Lotados (Chest Stock):** Controle de estoque pronto com separação por categorias de IV (F4, F5, F6) e limite de 54 unidades.
15. **Salas de Estoque (Room Manager):** Organização física da localização dos Pokémon em gavetas e caixas dentro do servidor.
16. **Gestão de Treinadores (CRM):** Agregação de dados por cliente, mostrando gasto total, histórico de compras e nicks vinculados.
17. **Chat de Atendimento:** Central de comunicação em tempo real com o cliente para dúvidas e entregas.
19. **Moderação de Feedbacks:** Painel central para visualizar e gerir as avaliações recebidas.
20. **Bulk Actions:** Ações em massa para deleção e limpeza de registros históricos.

---

## 3. Consultório Competitivo (VGC 2025)

O Consultório Competitivo é um módulo analítico que confere, prevê e avalia as sinergias das equipes montadas pelos usuários para o formato VGC e permite planejamento contundente.

**Funcionalidades Atuais Implementadas:**
- **Parser Nativo do Pokémon Showdown:** Leitura e tradução estruturada dos Textos de Exportação nativos do Pokémon Showdown (Habilidades, Tera Types, Golpes exatos, e Itens de segurar).
- **Motor Analítico de Sinergia (Reg H):** Algoritmo de 100 pontos baseados em Cobertura de Tipos, Fake Out / Redirect check (pelos Golpes listados), presenças defensivas e Win-Conditions S/A-tier.
- **Deteccão de "Cores" Meta:** Avisos textuais caso o usuário forme combinações conhecidas e eficazes perante ao cenário competitivo, como "FWG Core" (Fogo/Água/Grama) e "Fantasy Core" (Fada/Aço/Dragão).
- **Sprites Renderizados Pela PokeAPI:** Interação gráfica substituindo simples textos por imagens pixel-art ricas que retratam em tempo real os 6 escolhidos do time.

### Futuras Inovações (15 Ideias de Aperfeiçoamento Mapeadas)
1.  **Speed Tier Timeline Visual:** Em vez de apenas dizer se tem "Tailwind", mostrar um gráfico horizontal ("Timeline") prevendo quem atacará primeiro contra os 10 Pokémon mais usados do VGC (ex: Gholdengo Choice Scarf vs seu time em Tailwind).
2.  **Matchup Simulado (The "Top 10" Test):** Computar se o seu time apanha automaticamente contra arquétipos clássicos e dominantes atuais (Ex: Rain Archaludon ou Dondozo-Tatsugiri).
3.  **Draft & Veto Simulador (Bo3 Open Team Sheet):** Uma simulação minigame de qual Pokémon o oponente meta com certeza baniria ("Veto") baseados nos counters diretos.
4.  **Otimizador de EVs Focais:** Dizer se aquele status no EV de Defesa salva de um *Sucker Punch* específico do Kingambit ou se é um valor irrelevante pro formato atual. O sistema sugere "Puxe 12 pontos para Def para aguentar XYZ".
5.  **Sincronização Pikalytics/Smogon API:** Abandonar o dicionário estático (hoje `META_STAPLES`) para varrer os servidores da Smogon mensalmente para definir quem se torna S-Tier sem trabalho manual do administrador.
6.  **Gerador de Formato "Rental/Poképaste":** Gerar automático o link (Exportação visualizada via Poképaste) para publicizar o time ou compartilhar com a comunidade de clientes se receber rank 'S'.
7.  **Medidor de Dano (Damage Calc Tooltip):** Ao passar o mouse pelo retrato de um atacante do seu time, pular um tooltip com o cálculo de "Ele dá 80%~95% num Amoonguss usando Flare Blitz".
8.  **Tera Type Hot-Swapper:** Botões rápidos ao lado de um monstrinho fraco para o jogador testar "e se ele virar Tera Ghost?". Ao clicar, recalcula em tempo real a pontuação dos 100 pontos do ranking com a sinergia readequada.
9.  **Visualizador de Ligações Node-Graph:** Um mapa interativo conectando com linhas brilhantes quais membros da equipe dão buff explícitos uns nos outros (Ex: Linha de Pelipper de Drizzle ativando Swift Swim do parceiro).
10. **Motor de Sugestão Trocável em Clique (1-Click Switch):** No lugar de receber só um texto de "Adicione Tornadus", clicar no botão de uma sugestão já plota a Sprite na vaga vazia e pisca na tela quantos pontos de Rank aquilo lhe custou ou beneficiou.
11. **Histórico Evolutivo (Tournament Mode):** Uma aba do cliente salvando sua equipe mês após mês para que ele entenda o que alterou para as copas atuais.
12. **Filtro de Ameaça Cruzada (Cross-counters):** Buscar: "Nenhum de meus 6 Pokemon mata Archaludon" emitindo alerta crítico e vermelho vibrante na interface. Foco explícito nos "muros impassáveis".
13. **Role Overlap Warnings:** Avisar visualmente ao detectar "Role Overlap" e "Diminushing Returns" (Passou de 3 membros full-suportes? Aviso visual: "Pouca Ameaça Ofensiva - Risco de passividade alta!").
14. **Previsão Ativa de Climas/Terrenos (Weather Simulator):** Um Checkbox lateral para o usuário ticar: "Chuva Ativa". Todo o time relata visualmente, aplicando debuff para os de fogo, boost e Swift Swim. 
15. **Link com "ValiantShop" Direto (Conversão Direta):** Já que o time alcançou RANK S+, habilitar o botão premium que magicamente preenche o formulário da sua Loja encomendando o "Time 1:1 Oficial e Pró-treinado" para o Breeder colocar no carrinho sem o cliente errar uma Natureza no Google Forms convencional!

---