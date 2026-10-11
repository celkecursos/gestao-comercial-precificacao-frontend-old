---
name: criar-teste-e2e
description: Cria ou amplia os testes e2e (Playwright) de um módulo do frontend seguindo o padrão do projeto — e2e/<modulo>/<fluxo>.spec.ts. Use quando pedirem "teste e2e", "teste ponta a ponta" ou "/criar-teste-e2e <modulo>".
argument-hint: <modulo> [fluxo]
---

# Criar teste e2e de um módulo

Argumento: `$ARGUMENTS` — o módulo (nome da pasta em `src/pages/`) e, opcionalmente, o fluxo.

O **padrão** (organização, seletores, dado de teste) está em `.claude/rules/e2e.md` — leia
antes de escrever. Esta skill é o **processo**. O modelo de referência é `e2e/users/`.

## 1. Entender a tela antes de escrever

Leia, nesta ordem:

1. `src/pages/<modulo>/` — a página e o modal de formulário. Anote os textos exatos:
   título (`PageHeader`), botões, `label` de cada campo, título do modal, mensagens do
   `showToast`/`useCrudActions`, `itemLabel` do `RowActions`.
2. `src/services/<recurso>Service.ts` — métodos e rotas HTTP (para os `waitForResponse`).
3. `src/routes/router.tsx` e `navigation.ts` — rota, `RoleGuard`, `roles` do menu.
4. `src/types/` e `src/utils/validation.ts` — campos obrigatórios e mensagens de validação.
5. Se tiver acesso ao backend (`../gestao-comercial-precificacao-backend/src/<recurso>/`):
   exclusão física ou lógica, conflitos (409), regras que o front não valida.

Se algo não for localizável sem posição ou classe CSS, **pare e avise** — a correção é
no componente (acessibilidade), não um seletor frágil.

## 2. Planejar os specs

Proponha ao usuário a lista antes de escrever, por exemplo:

- `crud.spec.ts` — ciclo completo num único `test` com `test.step`s: abre, valida vazio,
  cadastra, busca, erro de negócio da API, edita, ativa/desativa, exclui.
- `access.spec.ts` — o que cada perfil vê e não vê (só se a tela tiver regra de perfil).
- outros fluxos específicos do módulo (ex.: cálculo exibido, filtros).

Um arquivo por fluxo, não um arquivo gigante por módulo.

## 3. Escrever

- Copie a estrutura de `e2e/users/crud.spec.ts`: cabeçalho JSDoc (cobre / não cobre /
  dado criado), constantes `STAMP`/`NAME`, funções locais `rowOf`, `successToast`, `afterAll`
  de limpeza com `adminApi()`.
- Toda ação que chama a API: `waitForResponse` **antes** do clique + asserção do status.
- Repetiu um trecho em dois specs do mesmo módulo? Extraia para `e2e/<modulo>/<modulo>.helpers.ts`.
  Serve para todos os módulos? `e2e/support/`.

## 4. Verificar

```bash
npm run e2e -- e2e/<modulo>/      # passar
npm run e2e -- e2e/<modulo>/      # passar DE NOVO (dado único + limpeza)
npm run lint && npm run typecheck && npm run format:check
```

A API precisa estar rodando. Se um teste falhar, abra `npm run e2e:report` e leia o
trace antes de mexer: a falha pode ser um **bug real** da tela ou da API. Bug real não se
contorna no teste — registre no `e2e/README.md` (seção "Achados") e avise o usuário.

## 5. Documentar

Atualize a tabela "Os specs" do `e2e/README.md` com o que o módulo cobre e o dado que cria.
