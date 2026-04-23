# 💠 ValiantShop | Inventário Técnico Detalhado & Exaustivo (v3.0)

Este documento é a listagem definitiva de **absolutamente todos** os sistemas, módulos, funcionalidades e lógicas implementadas no **ValiantShop** até Abril de 2026. 

---

### 1. 🏗️ Arquitetura, Core & Segurança
*   **Autenticação Híbrida (Google OAuth)**: Sistema de login via Google integrado ao Firebase Auth com persistência de sessão.
*   **Diferenciação de Roles**: Lógica de permissões para Administradores (`reskallaarthur@gmail.com`), Breeders e Treinadores comuns.
*   **Dual-Login Engine**: Suporte a duas instâncias de login simultâneas (Admin via `adminApp` e User via `app`) em `firebase.ts`.
*   **Global Error Boundary**: Captura de exceções em tempo real com interface de recuperação automática ("Reiniciar Interface").
*   **Sincronização Firestore Snapshots**: Motor de atualização em tempo real para chats, pedidos e notificações.
*   **Service Layer (PokeAPI)**: Camada de integração para busca de dados, tradução e sprites Pokémon.
*   **Safe Storage Utility**: Wrapper de `localStorage` com tratamento de erros para persistência de carrinho, nicks e notificações.

### 2. 🛒 Sistema de Comércio & Encomendas
*   **Gerador de Encomendas (OrderForm)**:
    *   Busca inteligente de espécies com filtros de favoritos e tendências.
    *   Seleção dinâmica de IVs (F4, F5, F6) com cálculo de preço automático.
    *   Lógica de descontos para Pokémon castrados.
    *   Suporte a Pokémon "Genderless" e "Male Only".
    *   Campos de Nick do Destinatário (Presente) e Nick do Discord.
    *   Sistema Anti-Spam (Cooldown de 30s) por IP/Sessão.
*   **Carrinho de Compras (CartModal)**:
    *   Gerenciamento de múltiplos itens com persistência.
    *   Checkout em lote com criação de múltiplos documentos no Firestore.
*   **Wishlist System**:
    *   Salvamento de configurações de Pokémon para compra futura.
    *   Aplicação rápida de itens da Wishlist diretamente no formulário de pedido.
*   **Order Tracking (Status Page)**:
    *   Acompanhamento visual do status da forja.
    *   Histórico completo de pedidos passados.
*   **Review Hub**:
    *   Sistema de nota (estrelas) e comentário pós-entrega.
    *   Feedback vinculado ao pedido para verificação de autenticidade.

### 3. 🏛️ Painel Administrativo & Gestão Pro
*   **Admin Dashboard Central**:
    *   Métricas de faturamento total, ticket médio e volume de vendas.
    *   Gestão de pedidos em tempo real.
*   **Fluxo de Trabalho Kanban**: Organização visual de pedidos por colunas (Pendente, Breeding, Pronto, Entregue).
*   **Edit Order Modal**: Ferramenta completa para alteração manual de atributos de pedidos ativos.
*   **Equipe & Breeders**:
    *   Sistema de convite e gestão de funcionários (Breeders).
    *   Cálculo de comissões baseado em Ranks (BreederConfig).
    *   Carteira digital do funcionário com histórico de pagamentos.
*   **Inventory & Stock Rooms**:
    *   Mapeamento físico de baús e gavetas no servidor.
    *   Simulador visual de 54 slots por baú.
    *   **Auto-Stock Sync**: Abatimento automático de estoque ao finalizar pedidos.
*   **Inbox Administrativa**: Central de alertas para cancelamentos e novos chamados de suporte.

### 4. 🧪 Ferramentas de Suporte & Comunicação
*   **Order Chat Integrado**: Chat bilateral em tempo real entre cliente e staff dentro do pedido.
*   **Floating Support System**: Chat de suporte flutuante (Ticket System) para dúvidas gerais.
*   **Indicadores de Digitação**: Feedback visual de "Treinador digitando..." em todos os chats.
*   **FAQ Interativa**: Portal de dúvidas frequentes gerenciável via Admin.

### 5. ⚔️ Ecossistema Competitivo & VGC
*   **VGC Consultoria System**:
    *   Analisador de times (Synergy Scorer).
    *   Leitor de exportação do Pokémon Showdown.
    *   Meta Detection (Reg H / Meta 2025).
*   **Pokedex Pro**:
    *   Enciclopédia com filtros avançados (Egg Groups, Tipagem, Stats).
    *   Suporte a dados técnicos de Cobblemon.

### 6. 📱 Social & Fidelidade
*   **Community Feed**: Rede social completa para posts, imagens e interações entre treinadores.
*   **Trainer Profile 2.0**:
    *   Perfis públicos personalizáveis (Bio, Banner, Avatar).
    *   Exibição de conquistas e histórico de compras.
*   **Glint Loyalty System**:
    *   Acúmulo de fragmentos elementais por tipo de Pokémon comprado.
    *   Lógica de Fragmentos Prismáticos (Joker) para coleções completas.
*   **Ranking Global**: Leaderboard de gastos totais e fidelidade (Rich Trainers).

### 7. 🎮 Gamificação & Eventos
*   **Daily Minigames Engine**:
    *   **PokeGrid**: Puzzle de tipos e gerações.
    *   **Pokedle**: Adivinhação diária.
    *   **PokeQuiz**: Quiz de conhecimentos gerais.
    *   **Streak System**: Contador de dias seguidos jogando com salvamento em Cloud.
*   **Pixel Hunt Event Engine**: Disparador global de eventos de caça com localização aleatória e sistema de vencedores.

### 8. 🔌 Integrações & Automações
*   **Discord Sync (Webhook v3)**:
    *   Notificação de novos pedidos com menção ao Admin (@UID).
    *   Embeds formatados com banner premium e informações inline.
    *   Shorthand automático de IVs (F4, F5, F6) nos alertas.
    *   Destaque automático para Hidden Abilities (HA).
*   **Valiant Bot**: Automação de postagens no feed para grandes feitos da comunidade.
*   **Global Rank Sync**: Atualização automática do rank global do usuário após cada compra.

---
> *Inventário atualizado e validado em 23 de Abril de 2026.*