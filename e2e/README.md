# Testes e2e (Playwright)

Testes ponta a ponta: um navegador real contra o frontend rodando (`npm run dev`) e a
**API de verdade** (local ou develop). Não há mock — os testes criam, editam e excluem
registros no banco.

**Não entram na definição de pronto** (`lint` + `build` + `format:check`). São executados
à mão, com a API no ar.

Como **escrever** um teste: `.claude/rules/e2e.md` (padrão) e a skill
`/criar-teste-e2e <modulo>` (processo).

## Começo rápido

Uma vez por máquina:

```bash
npm install
npx playwright install chromium
```

Copie o bloco `E2E_*` do `.env.example` para o `.env` e preencha as senhas. Localmente,
use os usuários do seed do backend (`src/database/seeds/seed-data.ts`).

Depois, com a **API rodando** (repositório do backend):

```bash
npm run e2e                     # a suíte inteira — sobe o `npm run dev` sozinho
npm run e2e -- e2e/users/       # só um módulo
npm run e2e -- e2e/users/crud.spec.ts
```

O login é automático: o projeto `setup` (`auth.setup.ts`) entra pela tela como admin e
como usuário comum e grava as sessões em `.auth/` antes dos specs.

## Assistir e depurar

```bash
npm run e2e:ui                         # melhor opção: linha do tempo, rede, time-travel
E2E_SLOWMO=500 npm run e2e:headed      # janela maximizada, em câmera lenta
npm run e2e:debug                      # passo a passo, com o Inspector
npm run e2e:report                     # relatório HTML da última execução
npm run e2e:codegen                    # grava cliques e sugere seletores
```

Trace, vídeo e screenshot só são guardados quando o teste **falha** (`test-results/`).

## Variáveis (`.env`)

| Variável                                 | Uso                                                             |
| :--------------------------------------- | :-------------------------------------------------------------- |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | sessão padrão dos specs (perfil Administrador)                  |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`   | sessão do perfil Usuário (`USER_SESSION`)                       |
| `E2E_BASE_URL`                           | testar um frontend já publicado em vez de subir o `npm run dev` |
| `E2E_API_URL`                            | API usada na limpeza (padrão: `VITE_API_URL`)                   |

⚠️ **`.auth/*.json` guarda um token vivo.** Está no `.gitignore`: não comite, não compartilhe.

⚠️ **Nunca produção.** O `playwright.config.ts` se recusa a rodar com
`VITE_API_URL=https://api.celke.uno`.

⚠️ **Não faça logout nem troque a senha** dos usuários do `.env` dentro de um teste: o
backend invalida todos os tokens do usuário e o resto da suíte cai no `/login`.

## Organização

```
e2e/
  auth.setup.ts        login dos dois perfis (roda antes de tudo)
  session.spec.ts      smoke: sessão válida entra; sem sessão vai para o /login
  support/             utilitários de todos os módulos (sessões, API de limpeza)
  users/               uma pasta por módulo de src/pages/
    crud.spec.ts
    access.spec.ts
```

## Os specs

| Spec                   | Cobre                                                                                                                                      | Dado criado                                                                                                                                         |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session.spec.ts`      | sessão gravada entra no painel; rota privada sem sessão vai para o login                                                                   | nenhum                                                                                                                                              |
| `users/crud.spec.ts`   | validação do formulário vazio (sem POST), cadastro (201), busca, e-mail duplicado (409 + mensagem no modal), edição, desativação, exclusão | `E2E Usuário <carimbo>` / `e2e-<carimbo>@e2e.test` — excluído pelo próprio teste (exclusão física); o `afterAll` remove pela API se um passo falhar |
| `users/access.spec.ts` | perfil Usuário não vê o menu nem acessa `/usuarios`; admin não pode desativar/excluir a si mesmo                                           | nenhum                                                                                                                                              |

## Achados

Divergências entre tela e API encontradas pelos testes. Registre aqui com data, e o que
o teste faz enquanto não for corrigido.

_Nenhum até agora._

## Quando falha

1. Rode `npm run e2e -- e2e/session.spec.ts`. Se ele falha, é ambiente: API fora do ar,
   `.env` incompleto ou usuário do seed inexistente.
2. Abra `npm run e2e:report` e o trace do teste: rede, console e o DOM em cada passo.
3. Mudou um texto da tela de propósito? Atualize o teste. Não mudou? Pode ser bug real.
