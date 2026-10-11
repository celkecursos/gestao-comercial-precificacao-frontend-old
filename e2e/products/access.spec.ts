import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { USER_SESSION } from '../support/sessions.ts';

/**
 * E2E do módulo Produtos — quem pode o quê.
 *
 * `/produtos` NÃO tem `RoleGuard`: os dois perfis entram na tela e podem cadastrar,
 * editar e ativar/desativar. A diferença é a exclusão, que o front esconde do perfil
 * Usuário e o backend recusa (`@Roles(Role.Admin)` no `DELETE /products/:id`).
 *
 * Só lê — não cria, não edita e não exclui nada. As asserções olham a tabela da
 * listagem (dado do seed), nunca um registro específico.
 */

const LIST = '/produtos';

/** A tabela da listagem, já carregada com pelo menos uma linha de produto. */
async function loadedTable(page: Page): Promise<Locator> {
  await page.goto(LIST);
  await expect(page.getByRole('heading', { name: 'Produtos', level: 1 })).toBeVisible();
  const table = page.getByRole('table', { name: 'Lista de produtos' });
  await expect(table).toBeVisible();
  // Âncora: há linhas de verdade — sem ela, "não tem Excluir" passaria numa tela vazia.
  expect(await table.getByRole('button', { name: /^Editar / }).count()).toBeGreaterThan(
    0,
  );
  return table;
}

test.describe('perfil Usuário (não admin)', () => {
  test.use({ storageState: USER_SESSION });

  test('vê a tela e edita, mas não pode excluir', async ({ page }) => {
    await page.goto('/dashboard');
    const menu = page.getByRole('navigation', { name: 'Menu principal' });
    await expect(menu.getByRole('link', { name: 'Produtos' })).toBeVisible();

    const table = await loadedTable(page);
    await expect(page.getByRole('button', { name: 'Novo produto' })).toBeVisible();
    expect(
      await table.getByRole('button', { name: /^(Ativar|Desativar) / }).count(),
    ).toBeGreaterThan(0);
    await expect(table.getByRole('button', { name: /^Excluir / })).toHaveCount(0);
  });
});

test.describe('perfil Administrador', () => {
  test('tem a ação de excluir na linha', async ({ page }) => {
    const table = await loadedTable(page);
    expect(
      await table.getByRole('button', { name: /^Excluir / }).count(),
    ).toBeGreaterThan(0);
  });
});
