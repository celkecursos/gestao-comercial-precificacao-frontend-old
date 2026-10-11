# Guia para agentes de IA e desenvolvedores

Convenções deste repositório. Siga-as ao implementar qualquer tarefa.

## Antes de começar

- Leia o `README.md`.
- Suba o backend (repositório da API) e rode `npm install` e `npm run dev` aqui.
- O contrato da API está no Swagger do backend: `http://localhost:3000/api/docs` (JSON em `/api/docs-json`).

## Branches

- `main` = produção, `homolog` = testes humanos, `develop` = integração.
- Trabalhe sempre em uma branch própria criada a partir de `develop` (ex.: `feature/recuperacao-de-senha`) e entregue por Pull Request para `develop`.
- **Nunca** faça commit ou push diretamente em `develop`, `homolog` ou `main`. As promoções `develop → homolog → main` são feitas por Pull Request, após os testes humanos.

## Definição de pronto

```bash
npm run lint
npm run build      # inclui a verificação de tipos
npm run format:check
```

Verifique também a tela nos **dois temas** (claro e escuro) e em largura de celular.

## Padrões

- **Idioma:** código em inglês; textos da interface, comentários e documentação em português.
- **Chamadas HTTP** somente em `src/services/<recurso>Service.ts`, usando `api` de `src/services/api.ts`. Componentes nunca importam o Axios (o ESLint bloqueia).
- **Tipos** das entidades e payloads em `src/types/`, espelhando os DTOs do backend. Não use `any`.
- **Consultas** com `useApiQuery(fetcher, key)`. A `key` deve mudar quando os parâmetros mudarem (ex.: `JSON.stringify(params)`).
- **Formulários** com `useFormState(valoresIniciais, validar)` e os campos de `components/ui/fields.tsx` (`TextField`, `SelectField`, `TextAreaField`, `SwitchField`), que já tratam label, erro e acessibilidade.
- **Listagens** seguem o padrão de `pages/products/ProductsPage.tsx`: `ListToolbar` + `ListContent` + `DataTable` + `RowActions` + `ConfirmDialog`.
- **Cores:** use apenas os tokens semânticos (`bg-surface`, `text-muted`, `border-border`, `bg-primary`, `text-accent`...). Não use cores fixas do Tailwind (`bg-white`, `text-gray-500`) em componentes. Para uma nova cor, crie o token nos dois temas em `src/index.css`.
- **Gráficos:** cores via `useChartTheme()`.
- **Acessibilidade:** todo botão só com ícone usa `IconButton` (o `label` é obrigatório); modais usam `Modal`/`FormModal` (baseados em `<dialog>`).
- **Rotas:** caminhos em `routes/paths.ts`, página lazy em `routes/lazy-pages.tsx`, rota em `routes/router.tsx` e item de menu em `routes/navigation.ts`. Restrinja por perfil com `RoleGuard` e `roles` no item de menu.
- **Testes e2e** (Playwright) em `e2e/<modulo>/<fluxo>.spec.ts`, seguindo `.claude/rules/e2e.md`. Para criar: `/criar-teste-e2e <modulo>`. Textos de interface, `label` de campos e `label` de `IconButton` são os seletores dos testes — mude-os quando a UX pedir e ajuste o teste junto.
- **Mensagens de sucesso/erro** de ações: `useToast()` (ou `useCrudActions` nas listagens).

## Checklist para uma nova tela

1. Tipos em `src/types/`.
2. Serviço em `src/services/`.
3. Página em `src/pages/<modulo>/` (listagem + modal de formulário).
4. Rota (`paths.ts`, `lazy-pages.tsx`, `router.tsx`) e item de menu (`navigation.ts`).
5. Estados de carregando, erro, vazio e sucesso.
6. Conferir nos dois temas e no celular.
7. Atualizar o README.

## Funcionalidades pendentes

A **recuperação de senha** ainda não existe e é uma tarefa planejada, a ser feita por um agente via Paperclip. A API também ainda não possui os endpoints correspondentes.
