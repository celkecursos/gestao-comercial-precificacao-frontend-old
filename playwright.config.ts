import { defineConfig, devices } from '@playwright/test';
import { ADMIN_SESSION } from './e2e/support/sessions.ts';

/**
 * Testes e2e — navegador real contra o frontend (`npm run dev`) e a API de
 * DESENVOLVIMENTO (local ou develop). Nunca produção. Ver `e2e/README.md`.
 *
 * Credenciais e URLs vêm do `.env` (gitignored). Nenhuma senha vive no repositório.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Sem .env: valem as variáveis já exportadas no shell (ex.: CI).
}

// Trava de segurança: os testes criam, editam e EXCLUEM registros de verdade.
const PRODUCTION_API = 'https://api.celke.uno';
if (process.env['VITE_API_URL']?.replace(/\/$/, '') === PRODUCTION_API) {
  throw new Error(`E2E recusado: VITE_API_URL aponta para produção (${PRODUCTION_API}).`);
}

/**
 * Só quando se está ASSISTINDO (`--headed`) a janela abre maximizada. Fora daí o
 * viewport é fixo e igual em toda máquina: o layout é responsivo (o menu lateral vira
 * gaveta, colunas somem), e um teste que depende do monitor de quem rodou passa numa
 * máquina e falha na outra.
 */
const watching = process.argv.includes('--headed');

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Série, um worker: os testes escrevem no mesmo banco; paralelismo aqui vira
  // disputa por dado, não ganho de tempo.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // `test.only` esquecido não passa na CI.
  forbidOnly: !!process.env['CI'],
  // Na CI, o reporter `github` marca a falha direto na linha do spec, no Pull Request.
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    // Artefato só quando falha — trace/vídeo de execução verde é lixo em disco.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    ...(watching ? { viewport: null } : {}),
    launchOptions: {
      // Câmera lenta para acompanhar a olho nu: `E2E_SLOWMO=500 npm run e2e:headed`.
      slowMo: Number(process.env['E2E_SLOWMO'] ?? 0),
      args: watching ? ['--start-maximized'] : [],
    },
  },
  projects: [
    {
      // Faz o login (admin e usuário comum) e grava as sessões em `.auth/`.
      // Roda sozinho antes da suíte — o login é e-mail + senha, sem OTP.
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Por padrão os specs entram como ADMIN. Para outro perfil:
        // `test.use({ storageState: USER_SESSION })`.
        storageState: ADMIN_SESSION,
      },
    },
  ],
  // Sobe o frontend sozinho (ou reaproveita o `npm run dev` já aberto).
  // A API NÃO sobe aqui: ela precisa estar rodando antes (repositório do backend).
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
