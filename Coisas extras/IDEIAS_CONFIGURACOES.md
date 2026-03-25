# 💡 Ideias para o Sistema de Configurações - ValiantShop

Este documento contém mais de 30 ideias para expansão futura do sistema de configurações, divididas por categorias para facilitar a implementação modular.

---

### 👤 1. Perfil & Social
1.  **Bio de Treinador**: Pequeno texto descritivo visível no placar.
2.  **Badges de Conquista**: Ícones especiais por marcos (ex: "Primeira Compra", "Mestre do PokéGrid").
3.  **Avatar Customizado**: Opção de usar a skin do Minecraft ou um Pokémon favorito como ícone.
4.  **Título de Elite**: Sufixos para o nome (ex: "Steve [O Colecionador]").
5.  **Lista de Amigos**: Ver o status e progresso de amigos no site.
6.  **Compartilhamento de Perfil**: Link único para mostrar estatísticas e coleções.

### 🎨 2. Interface (UI/UX)
7.  **Temas Dinâmicos**: Troca entre Dark Mode, Light Mode e Temas Regionais (Kanto, Johto, etc).
8.  **Intensidade do Glow**: Ajuste da opacidade dos efeitos de neon/vidro (glassmorphism).
9.  **Tamanho da Fonte**: Opções de acessibilidade para usuários com dificuldades visuais.
10. **Layout Compacto**: Modo de visualização reduzido para a tabela de preços e histórico.
11. **Animações Reduzidas**: Opção para desativar efeitos de movimento (framer-motion) para maior performance.
12. **Background Animado**: Escolha entre diferentes fundos (Partículas, Chuva de Pixels, Estático).

### 🔔 3. Notificações & Alertas
13. **Webhooks de Discord**: Receber aviso direto no DM do Discord quando o pedido mudar de status.
14. **Sons de Notificação**: Escolha de sons clássicos de Pokémon para alertas (ex: som de cura do Centro Pokémon).
15. **Newsletter de Estoque**: Alerta quando itens raros (Eggs/Limited) voltarem ao estoque.
16. **Lembrete de PokéGrid**: Notificação push se o usuário ainda não jogou o minigame diário.
17. **Filtro de Importância**: Escolher quais tipos de notificação geram pop-up e quais ficam apenas no sino.

### 🏆 4. Gamificação & Recompensas
18. **Sistema de Nível**: Ganhar XP por pedidos e interações no site.
20. **Recompensa Diária de Login**: Bônus de crédito ou itens ao acessar o site sequencialmente.
21. **Missões Semanais**: Desafios como "Faça 3 pedidos seguidos" para ganhar badges.
22. **Exibição de Medalhas**: Vitrine no perfil para as conquistas mais raras.

### 🛠️ 5. Utilitários & Compras
26. **Calculadora de IVs In-App**: Ferramenta rápida para checar Pokémons antes de encomendar.
27. **Rastreador de Orçamento**: Definir um limite mensal de gastos para controle pessoal.

### 🔒 6. Segurança & Conta
28. **Login Compulsório via Discord (OAuth2)**: Forçar o login via Discord para garantir a captura do ID e Tag reais, essencial para o funcionamento do bot de notificações e outros sistemas de integração automática.
29. **Autenticação de Dois Fatores (2FA)**: Via Discord ou App de autenticação.
30. **Logs de Acesso**: Ver onde e quando sua conta foi conectada.
31. **Vincular Múltiplas Contas**: Suporte para alternar entre contas principais e alts.
32. **Exclusão de Dados (LGPD)**: Opção clara e automatizada para apagar histórico e dados do perfil.

### 🔗 7. Integrações Avançadas
33. **Sincronização de Cargo**: Ganhar cargos automáticos no Discord baseados no gasto total.
34. **Comandos de Bot**: Gerar códigos especiais no site para resgatar itens via bot no servidor.
35. **Live Status**: Widget que mostra se os breeders estão online ou em pausa no momento.
