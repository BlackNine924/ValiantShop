# Sistema de Onboarding - Valiant Shop

O sistema de Onboarding foi criado para dar as boas-vindas aos novos treinadores e explicar as funcionalidades básicas da loja.

## Como funciona o Trigger (Gatilho):
1. O sistema verifica se o usuário está logado.
2. Ele busca no `localStorage` (via `safeStorage`) uma chave específica: `onboarding_seen_[USER_UID]`.
3. Se essa chave não existir ou for `false`, o modal de Onboarding aparece automaticamente.
4. O modal NÃO aparece na página de Admin (`/admin`).

## Como funciona a Persistência:
- Ao clicar no botão **"ENTENDI, VAMOS LÁ!"**, o sistema salva no navegador do usuário que ele já viu o guia.
- Usamos o `uid` da conta para que a preferência seja salva por perfil.
- Uma vez marcado como visto, o modal não aparecerá mais para aquele usuário naquele navegador.

## Onde encontrar o código:
- Lógica de exibição: `src/App.tsx` (useEffect de onboarding).
- Componente visual: `src/App.tsx` (AnimatePresence com `showOnboarding`).
- Armazenamento seguro: `src/utils/storageUtils.ts`.
