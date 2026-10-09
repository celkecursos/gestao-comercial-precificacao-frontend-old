import { expect, test } from '@playwright/test';
import { USER_SESSION, requiredEnv } from '../support/sessions.ts';

/**
 * E2E do módulo Usuários — quem pode o quê.
 *
 * Cobre o `RoleGuard` da rota (`/usuarios` é só de ADMIN), o item de menu escondido por
 * perfil e as ações de linha que o admin NÃO tem sobre si mesmo. Não cria dado.
 */

test.describe('perfil Usuário (não admin)', () => {
  test.use({ storageState: USER_SESSION });

  test('não vê o menu e não acessa a tela', async ({ page }) => {
    await page.goto('/dashboard');
    const menu = page.getByRole('navigation', { name: 'Menu principal' });
    // Âncora: o menu carregou de verdade — sem ela, "não tem Usuários" passaria vazio.
    await expect(menu.getByRole('link', { name: 'Produtos' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Usuários' })).toHaveCount(0);

    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo usuário' })).toHaveCount(0);
  });
});

test.describe('perfil Administrador', () => {
  test('não pode desativar nem excluir a si mesmo', async ({ page }) => {
    const email = requiredEnv('E2E_ADMIN_EMAIL');
    await page.goto('/usuarios');
    await page.getByLabel('Buscar usuários por nome ou e-mail').fill(email);

    const ownRow = page.getByRole('row').filter({ hasText: email });
    await expect(ownRow).toContainText('(você)');
    await expect(ownRow.getByRole('button', { name: /^Editar / })).toBeVisible();
    await expect(
      ownRow.getByRole('button', { name: /^(Desativar|Excluir) / }),
    ).toHaveCount(0);
  });
});
