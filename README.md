# Gestão Comercial e Precificação Dinâmica — Frontend

> **HOSTINGER COM UM DESCONTÃO!**
>
> - Cupom: **CELKE**
> - [https://celke.com.br/page/hostinger](https://celke.com.br/page/hostinger)

Interface administrativa (SPA) do sistema **Gestão Comercial e Precificação Dinâmica**: produtos, cotações diárias de commodities, fórmulas de precificação, usuários e dashboard de indicadores.

O frontend não tem banco de dados: todas as informações vêm da API REST (NestJS), mantida em um repositório separado.

A aplicação é hospedada na **Hostinger** (Hostinger Web Application Hosting), com deploy automático a partir do GitHub para três ambientes: develop, homolog e produção. Veja [Ambientes e branches](#ambientes-e-branches) e [Deploy (Hostinger)](#deploy-hostinger).

---

## Sumário

- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração e variáveis de ambiente](#configuração-e-variáveis-de-ambiente)
- [Execução local](#execução-local)
- [Build de produção](#build-de-produção)
- [Funcionalidades](#funcionalidades)
- [Temas claro e escuro](#temas-claro-e-escuro)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Integração com o backend](#integração-com-o-backend)
- [Credenciais de demonstração](#credenciais-de-demonstração)
- [Recuperação de senha](#recuperação-de-senha)
- [Ambientes e branches](#ambientes-e-branches)
- [Deploy (Hostinger)](#deploy-hostinger)
- [Testes e2e](#testes-e2e)
- [Scripts disponíveis](#scripts-disponíveis)

## Tecnologias

| Finalidade       | Tecnologia                                                |
| ---------------- | --------------------------------------------------------- |
| Interface        | React 19 + TypeScript                                     |
| Build/dev server | Vite                                                      |
| Rotas            | React Router                                              |
| Estilos e temas  | Tailwind CSS 4 (estratégia `dark` por classe)             |
| HTTP             | Axios                                                     |
| Gráficos         | Recharts                                                  |
| Ícones           | lucide-react                                              |
| Qualidade        | ESLint (com regras de acessibilidade jsx-a11y) + Prettier |

## Requisitos

- Node.js 22+ (recomendado 24 LTS) e npm
- Backend da API em execução (padrão: `http://localhost:3000`)

## Instalação

```bash
git clone <url-do-repositorio>
cd gestao-comercial-precificacao-frontend
npm install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
```

## Configuração e variáveis de ambiente

| Variável       | Descrição                           | Exemplo                 |
| -------------- | ----------------------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API, sem barra no final | `http://localhost:3000` |

Cada ambiente aponta para o seu backend apenas mudando a variável, sem alterar o código-fonte:

```env
# Desenvolvimento local
VITE_API_URL=http://localhost:3000
# Develop
VITE_API_URL=https://dev-api.celke.uno
# Homolog
VITE_API_URL=https://hml-api.celke.uno
# Produção
VITE_API_URL=https://api.celke.uno
```

> Variáveis `VITE_*` são **embutidas no build**. Ao mudar de ambiente, gere um novo build com o valor correto.

O backend precisa liberar a origem do frontend no CORS (variável `FRONTEND_URL` da API). Em desenvolvimento: `http://localhost:5173` (e `http://localhost:4173` para o `npm run preview`).

## Execução local

```bash
npm run dev
```

Acesse **http://localhost:5173**. Com o backend rodando e populado pelo seed, entre com as [credenciais de demonstração](#credenciais-de-demonstração).

## Build de produção

```bash
npm run build     # verifica os tipos e gera dist/
npm run preview   # serve o build localmente em http://localhost:4173
```

As páginas do painel são carregadas sob demanda (code splitting por rota), então a tela de login não carrega a biblioteca de gráficos.

## Funcionalidades

| Rota         | Tela             | Recursos                                                                                |
| ------------ | ---------------- | --------------------------------------------------------------------------------------- |
| `/login`     | Login            | Validação, loading, mensagens de erro, aviso de sessão expirada, tema                   |
| `/dashboard` | Dashboard        | 4 cards (usuários, produtos, cotações, fórmulas), gráfico e últimas cotações            |
| `/usuarios`  | Usuários (ADMIN) | Busca, filtros por perfil e status, paginação, criar, editar, ativar/desativar, excluir |
| `/produtos`  | Produtos         | Busca, filtro de status, criar, editar, ativar/desativar, excluir (ADMIN)               |
| `/cotacoes`  | Cotações         | Filtros por commodity, período e fonte; cadastrar, editar, excluir (ADMIN)              |
| `/formulas`  | Fórmulas         | Busca, filtro de status, criar, editar, ativar/desativar, excluir (ADMIN)               |
| `/perfil`    | Meu Perfil       | Visualizar dados, editar nome e e-mail, alterar senha                                   |

Todas as telas têm estados de **carregando**, **erro** (com "tentar novamente"), **vazio** e **sucesso** (notificações), e funcionam em desktop, tablet e celular (menu em gaveta, tabelas com rolagem horizontal e colunas secundárias ocultas).

**Permissões** — o menu e as ações se adaptam ao perfil:

- **ADMIN**: acesso total, incluindo usuários e exclusões.
- **USER**: consulta, cria e edita produtos, cotações e fórmulas; não vê a tela de usuários nem os botões de exclusão.

A API é a validação definitiva de todas as regras; o frontend apenas evita oferecer ações que seriam recusadas.

## Temas claro e escuro

- Alternância por um botão de sol/lua **no login e no cabeçalho do painel**.
- A escolha é salva no navegador (`localStorage`) e mantida entre sessões. Sem escolha salva, segue a preferência do sistema operacional.
- Um script em `index.html` aplica o tema antes da primeira renderização, evitando que a tela "pisque" no tema errado.

**Como funciona:** o Tailwind usa a estratégia `dark` por classe (`.dark` no `<html>`). As cores são **tokens semânticos** definidos em `src/index.css` (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, `text-accent`...), cada tema com os próprios valores. Os componentes usam somente esses tokens, então nenhum componente precisa de cores específicas para cada tema. Os gráficos obtêm suas cores em `src/hooks/useChartTheme.ts`.

| Token        | Claro                       | Escuro                      |
| ------------ | --------------------------- | --------------------------- |
| `background` | `#F8FAFC`                   | `#04041D`                   |
| `sidebar`    | `#FFFFFF`                   | `#0B0B2A`                   |
| `surface`    | `#FFFFFF`                   | `#11113A`                   |
| `foreground` | `#0F172A`                   | `#F8FAFC`                   |
| `muted`      | `#64748B`                   | `#94A3B8`                   |
| `border`     | `#E2E8F0`                   | `#22224F`                   |
| `primary`    | `#2563EB` (hover `#1D4ED8`) | `#2563EB` (hover `#1D4ED8`) |
| `accent`     | `#06B6D4`                   | `#06B6D4`                   |

Estados: sucesso `#16A34A`, erro `#DC2626`, alerta `#D97706`.

## Estrutura do projeto

```text
src/
├── components/
│   ├── ui/            # Botões, campos (com label/erro acessíveis), modal, badges, cards
│   ├── data/          # Tabela responsiva, paginação, busca, ações de linha, estados de listagem
│   ├── feedback/      # Loading, erro, vazio, alertas e notificações (toasts)
│   └── layout/        # Logo, cabeçalho de página, seletor de tema
├── layouts/           # AdminLayout (sidebar + header + conteúdo)
├── pages/
│   ├── auth/          # Login
│   ├── dashboard/     # Dashboard e seus componentes (cards, gráfico)
│   ├── users/         # Listagem + formulário de usuários
│   ├── products/      # Listagem + formulário de produtos
│   ├── quotations/    # Listagem + formulário de cotações
│   ├── pricing/       # Listagem + formulário de fórmulas
│   ├── profile/       # Meu Perfil (dados e troca de senha)
│   └── errors/        # 404 e acesso restrito
├── services/          # Cliente HTTP (api.ts) e um serviço por recurso da API
├── hooks/             # useAuth, useTheme, useApiQuery, useFormState, useListParams...
├── contexts/          # Providers de autenticação, tema e notificações
├── types/             # Tipos das entidades e respostas da API
├── routes/            # Rotas, caminhos, menu lateral e proteção de rotas
├── utils/             # Formatação pt-BR, validação, tratamento de erros
├── config/            # Variáveis de ambiente e nome da aplicação
├── assets/
├── App.tsx
└── main.tsx
```

Convenções para quem for evoluir o projeto (pessoas ou agentes de IA) estão em [AGENTS.md](AGENTS.md).

## Integração com o backend

- Todas as chamadas HTTP ficam em `src/services/` (`authService`, `userService`, `productService`, `quotationService`, `pricingService`, `dashboardService`), usando o cliente único `src/services/api.ts`. O ESLint **impede** importar o Axios diretamente em componentes.
- **Autenticação** (`src/contexts/AuthProvider.tsx`):
  - o token JWT é salvo no navegador e enviado automaticamente no cabeçalho `Authorization: Bearer`;
  - ao abrir a aplicação, a sessão é validada em `GET /auth/me`;
  - qualquer resposta **401** encerra a sessão e leva ao login com o aviso "Sua sessão expirou";
  - rotas privadas redirecionam para `/login` e, após entrar, o usuário volta para a página que tentou acessar;
  - **Sair** chama `POST /auth/logout`, que invalida o token no servidor;
  - ao trocar a senha, a API devolve um novo token, que substitui o anterior sem desconectar o usuário.
- Erros da API (`{ statusCode, message, ... }`) são convertidos em mensagens legíveis por `src/utils/errors.ts`.
- A documentação completa da API fica no Swagger do backend: `http://localhost:3000/api/docs`.

## Credenciais de demonstração

Criadas pelo seed do backend. **Dados fictícios, apenas para demonstração.**

| Perfil  | E-mail             | Senha       |
| ------- | ------------------ | ----------- |
| `ADMIN` | cesar@celke.com.br | `123456A#b` |
| `USER`  | kelly@celke.com.br | `123456A#b` |

## Recuperação de senha

> **Esta funcionalidade ainda não existe.**

A tela de login oferece apenas a autenticação com e-mail e senha: não há link "Esqueci minha senha", tela de recuperação nem redefinição de senha por e-mail.

A recuperação de senha será implementada posteriormente por um **agente de IA através do Paperclip**, como uma das tarefas de demonstração do fluxo: projeto local → GitHub → Hostinger → Paperclip → branch da tarefa → pull request para `develop` → `homolog` → `main` (produção).

## Ambientes e branches

Cada ambiente é publicado automaticamente a partir de uma branch do GitHub e consome o backend do mesmo ambiente:

| Ambiente | Branch    | `VITE_API_URL`              |
| -------- | --------- | --------------------------- |
| Develop  | `develop` | `https://dev-api.celke.uno` |
| Homolog  | `homolog` | `https://hml-api.celke.uno` |
| Produção | `main`    | `https://api.celke.uno`     |

Fluxo de desenvolvimento:

```text
feature/<tarefa> ──PR──▶ develop ──PR──▶ homolog ──PR──▶ main
```

- **`develop`** — integração das tarefas concluídas. Toda branch de tarefa é criada a partir dela.
- **`homolog`** — testes humanos antes da liberação.
- **`main`** — produção.

Ninguém, nem pessoas nem agentes de IA, faz commit diretamente em `develop`, `homolog` ou `main`: o trabalho acontece em uma branch própria e chega às demais por Pull Request.

## Deploy (Hostinger)

O build gera arquivos estáticos em `dist/`, que podem ser publicados em qualquer hospedagem de sites estáticos (ex.: Hostinger Web Application Hosting). Os passos abaixo valem para os três ambientes; muda apenas o valor de `VITE_API_URL` (veja [Ambientes e branches](#ambientes-e-branches)).

1. Defina `VITE_API_URL` nas variáveis de ambiente da aplicação, com a URL do backend do ambiente (tabela acima).
2. Comando de build: `npm run build`. Diretório de saída: `dist`.

   O build roda no servidor e usa ferramentas que são devDependencies (TypeScript e Vite). O arquivo `.npmrc` do projeto (`include=dev`) garante que elas sejam instaladas mesmo com `NODE_ENV=production`. **Não remova o `.npmrc`**: sem ele, o deploy falha com `tsc: command not found`.

3. O arquivo `public/.htaccess` (copiado para `dist/`) redireciona as rotas da SPA para o `index.html`, permitindo acessar diretamente URLs como `/dashboard` em servidores Apache/LiteSpeed.
4. No backend do mesmo ambiente, inclua o domínio do frontend em `FRONTEND_URL` (CORS).

## Testes e2e

Testes ponta a ponta com [Playwright](https://playwright.dev), em `e2e/`, organizados por módulo (`e2e/<modulo>/<fluxo>.spec.ts`). Rodam contra a API de verdade — suba o backend antes:

```bash
npx playwright install chromium   # uma vez por máquina
npm run e2e                       # a suíte inteira (sobe o npm run dev sozinho)
npm run e2e -- e2e/users/         # só um módulo
```

Setup, variáveis `E2E_*` e o que cada spec cobre: [`e2e/README.md`](e2e/README.md). Padrão para escrever testes: [`.claude/rules/e2e.md`](.claude/rules/e2e.md).

## Scripts disponíveis

| Script                 | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento (porta 5173) |
| `npm run build`        | Verificação de tipos + build de produção |
| `npm run preview`      | Serve o build localmente (porta 4173)    |
| `npm run lint`         | ESLint                                   |
| `npm run lint:fix`     | ESLint com correções automáticas         |
| `npm run typecheck`    | Verificação de tipos do TypeScript       |
| `npm run format`       | Prettier (formata o projeto)             |
| `npm run format:check` | Prettier (somente verificação)           |
| `npm run e2e`          | Testes e2e (Playwright)                  |
| `npm run e2e:ui`       | Testes e2e no modo interativo            |
| `npm run e2e:headed`   | Testes e2e com o navegador visível       |
| `npm run e2e:debug`    | Testes e2e passo a passo (Inspector)     |
| `npm run e2e:report`   | Relatório HTML da última execução        |
| `npm run e2e:codegen`  | Grava cliques e sugere seletores         |
