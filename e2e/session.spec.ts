import { expect, test } from '@playwright/test';

/**
 * Smoke da sessão — o primeiro spec a rodar quando algo parece errado. Se ele falha,
 * o problema é ambiente (API fora do ar, .env, sessão), não o módulo que você testava.
 */

test('a sessão gravada entra direto no painel', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible();
});

test.describe('sem sessão', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('rota privada redireciona para o login', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();
  });
});
