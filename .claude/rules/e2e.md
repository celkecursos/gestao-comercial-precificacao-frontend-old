---
paths:
  - 'e2e/**'
  - 'playwright.config.ts'
  - 'src/**/*.tsx'
description: Padrão dos testes e2e (Playwright) — organização por módulo, seletores por papel/rótulo, dado de teste único e limpeza. Carrega ao tocar e2e/ ou componentes de tela.
---

# Testes e2e — o padrão do projeto

Os testes e2e dirigem um navegador real contra o frontend (`npm run dev`) e a **API
de verdade** (local ou develop). Não há mock. Setup e execução estão em `e2e/README.md`;
aqui fica **como escrever** um teste.

## Onde cada coisa vive

```
e2e/
  auth.setup.ts            # login admin + usuário comum → .auth/*.json (transversal)
  session.spec.ts          # smoke de sessão (transversal)
  support/                 # utilitários de TODOS os módulos (sessões, API de limpeza)
  <modulo>/                # uma pasta por pasta de src/pages/<modulo>
    <fluxo>.spec.ts        # crud.spec.ts, access.spec.ts, validation.spec.ts...
    <modulo>.helpers.ts    # só quando 2+ specs do módulo repetirem o mesmo trecho
```

- `<modulo>` é **o nome da pasta em `src/pages/`** (`users`, `products`, `quotations`,
  `pricing`, `profile`, `dashboard`, `auth`) — nunca um apelido.
- O nome do arquivo **não repete o módulo**: `users/crud.spec.ts`, não `users/users-crud.spec.ts`.
- Helper **nasce quando repete**, não antes. Arquivo de helper **não** termina em `.spec.ts`
  (o Playwright coletaria como teste).
- Código em inglês; títulos de `test`/`test.step`, comentários e mensagens em português
  (mesma convenção do `AGENTS.md`).

## Seletores — use nesta ordem

Os componentes do projeto já entregam o gancho: `TextField`/`SelectField` ligam
`<label for>`, `IconButton` exige `label`, `Modal` é `<dialog>` com `aria-labelledby`,
toasts têm `role="status"`/`"alert"`. **Não adicione `id` nem `data-testid`** sem esgotar a lista.

1. **Papel + nome acessível** — `getByRole('button', { name: 'Novo usuário' })`,
   `getByRole('dialog', { name: 'Editar usuário' })`, `getByRole('heading', { name, level: 1 })`.
2. **Rótulo** — `getByLabel('E-mail')`, sempre **dentro do modal** quando o rótulo também
   existe nos filtros da página (`dialog.getByLabel('Perfil')`).
3. **Linha da tabela pelo conteúdo** — `page.getByRole('row').filter({ hasText: EMAIL })`,
   com o identificador único que o próprio teste gerou. A ação vem do `IconButton` da linha:
   ``row.getByRole('button', { name: `Editar ${NAME}`, exact: true })``.
4. **`data-testid`** — último recurso, só para alvo sem papel nem rótulo. Exige mudar `src/`.

Armadilhas já conhecidas:

- Campo obrigatório: o texto do `<label>` inclui o `" *"` — `getByLabel('Senha', { exact: true })`
  **não casa**. Use o nome acessível: `getByRole('textbox', { name: 'Senha', exact: true })`.
- `getByLabel('Senha')` sem `exact` casa também com o botão "Mostrar senha".
- Nome acessível é substring por padrão: "Editar Ana" casa com "Editar Ana Maria". Use `exact: true`.

**Proibido:** seletor por posição (`nth()`, `first()` sobre lista inteira, `:nth-child`),
por classe Tailwind/CSS, ou por texto de placeholder. **Nunca** troque um texto da
interface para facilitar um teste — se uma mudança legítima de texto quebrou o teste,
conserte o teste.

## Estrutura de um spec

- **Cabeçalho JSDoc**: o que o spec cobre, o que **não** cobre, e que dado ele cria/apaga.
- Um `test.describe` por tela; um `test` por fluxo; um `test.step` por etapa legível
  ("cadastra", "edita", "exclui") — o relatório vira roteiro.
- **Confira a API, não só a tela**: `page.waitForResponse(...)` registrado **antes** do clique,
  e `expect((await response).status()).toBe(201)`. Erro de negócio (409, 400) também se
  confere pelo status **e** pela mensagem que aparece para o usuário.
- **Asserção negativa precisa de âncora**: antes de `toHaveCount(0)`, prove que a região
  carregou (ex.: o menu tem "Produtos" antes de afirmar que não tem "Usuários").
- Sem `waitForTimeout`. Espere a resposta, a URL ou o elemento.
- Perfil: os specs entram como **admin** por padrão. Para outro perfil,
  `test.use({ storageState: USER_SESSION })`; sem sessão, `{ cookies: [], origins: [] }`.

## Dado de teste

- Identificador **único em runtime**: `const STAMP = Date.now().toString().slice(-8)` →
  `E2E Produto ${STAMP}`, `e2e-${STAMP}@e2e.test`. Prefixo `E2E` sempre, para achar resíduo.
- O teste **limpa o que criou** pela própria tela (é parte do fluxo) **e** tem um `afterAll`
  com `adminApi()` (`e2e/support/api.ts`) que remove o que sobrou se um passo falhou.
- **Nunca** use dado do seed como alvo de escrita, e **nunca** aponte para produção
  (o `playwright.config.ts` recusa `https://api.celke.uno`).
- Credencial **só** por `.env` (`E2E_*`), nunca no código.
- **Nunca** clique em "Sair" com as sessões compartilhadas, nem troque a senha do admin/usuário
  do `.env`: o backend invalida **todos** os tokens do usuário e o resto da suíte cai no
  `/login`. Fluxo de logout/troca de senha cria o próprio usuário.

## O que NÃO é e2e

Regra pura (validação de senha, cálculo de preço, formatação) não sobe para o navegador:
o e2e só confere que a tela **bloqueia** ou **mostra** o resultado. O e2e cobre o que só
ele alcança — contrato real da API, permissão por perfil, navegação e feedback ao usuário.

## Verificação

```bash
npm run e2e -- e2e/<modulo>/   # roda o módulo (suba a API antes)
npm run lint && npm run typecheck && npm run format:check
```

Rode o módulo **duas vezes seguidas**: a segunda prova que o dado é único e a limpeza funciona.
