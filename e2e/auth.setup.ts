import { expect, test as setup } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ADMIN_SESSION, USER_SESSION, requiredEnv } from './support/sessions.ts';

/**
 * LOGIN DA SUÍTE — roda sozinho antes dos specs (projeto `setup` no playwright.config).
 *
 * Entra pela tela de login, como uma pessoa, e grava a sessão de cada perfil em `.auth/`.
 * Os specs reaproveitam esse estado e já começam logados — ninguém repete o login.
 *
 * ⚠️ Não use "Sair" nos specs com estas sessões: o logout invalida no servidor TODOS os
 * tokens do usuário, e os specs seguintes cairiam no /login. Teste de logout precisa de
 * um usuário próprio, criado pelo próprio teste.
 */

async function login(page: Page, email: string, password: string, sessionFile: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  // Pelo papel, não por `getByLabel`: "Senha" casaria também com o botão "Mostrar senha",
  // e com `exact` não casa nada — o texto do <label> inclui o " *" de obrigatório.
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Sessão de verdade: saiu do login e o menu principal carregou.
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible();

  await page.context().storageState({ path: sessionFile });
}

setup('login como administrador', async ({ page }) => {
  await login(
    page,
    requiredEnv('E2E_ADMIN_EMAIL'),
    requiredEnv('E2E_ADMIN_PASSWORD'),
    ADMIN_SESSION,
  );
});

setup('login como usuário comum', async ({ page }) => {
  await login(
    page,
    requiredEnv('E2E_USER_EMAIL'),
    requiredEnv('E2E_USER_PASSWORD'),
    USER_SESSION,
  );
});
