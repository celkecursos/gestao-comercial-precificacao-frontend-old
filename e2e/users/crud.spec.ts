import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { adminApi } from '../support/api.ts';

/**
 * E2E do módulo Usuários — ciclo completo pela tela, como administrador.
 *
 * O que ele cobre, e que nenhuma outra camada alcança: o contrato real da API
 * (POST/PATCH/PATCH status/DELETE em /users), o erro de negócio do backend chegando
 * ao usuário (e-mail duplicado → 409), e a listagem refletindo cada mudança.
 *
 * O que ele NÃO cobre: as regras puras de validação (`src/utils/validation.ts`) — só
 * confere que o formulário bloqueia o envio; a regex da senha forte é assunto de teste
 * de unidade, não de navegador.
 *
 * Dado de teste: um usuário `E2E Usuário <carimbo>` criado e EXCLUÍDO pelo próprio teste
 * (a exclusão é física). Se um passo falhar no meio, o `afterAll` remove pela API.
 */

const LIST = '/usuarios';
const STAMP = Date.now().toString().slice(-8);
const NAME = `E2E Usuário ${STAMP}`;
const EDITED_NAME = `${NAME} Editado`;
const EMAIL = `e2e-${STAMP}@e2e.test`;
const PASSWORD = 'E2e@Senha123';

/** A linha da tabela deste teste, achada pelo e-mail (não muda ao editar o nome). */
function rowOf(page: Page) {
  return page.getByRole('row').filter({ hasText: EMAIL });
}

/** Toast de sucesso (`role="status"`) com a mensagem exata da ação. */
function successToast(page: Page, message: string) {
  return page.getByRole('status').filter({ hasText: message });
}

/** Abre a listagem e filtra pelo e-mail do teste (a busca tem debounce). */
async function searchByEmail(page: Page) {
  await page.goto(LIST);
  const filtered = page.waitForResponse(
    (r) =>
      r.request().method() === 'GET' &&
      new URL(r.url()).pathname.endsWith('/users') &&
      new URL(r.url()).searchParams.get('search') === EMAIL,
  );
  await page.getByLabel('Buscar usuários por nome ou e-mail').fill(EMAIL);
  await filtered;
}

test.describe('Usuários', () => {
  test.afterAll(async () => {
    // Rede de segurança: só age se o teste parou antes do passo de exclusão.
    const api = await adminApi();
    const response = await api.get('/users', { params: { search: EMAIL } });
    const { data } = (await response.json()) as { data: { id: number }[] };
    for (const user of data) await api.delete(`/users/${user.id}`);
    await api.dispose();
  });

  test('cadastro, edição, desativação e exclusão', async ({ page }) => {
    await test.step('abre a listagem', async () => {
      await page.goto(LIST);
      await expect(
        page.getByRole('heading', { name: 'Usuários', level: 1 }),
      ).toBeVisible();
    });

    await test.step('formulário vazio não chega na API', async () => {
      let posts = 0;
      page.on('request', (r) => {
        if (r.method() === 'POST' && r.url().endsWith('/users')) posts++;
      });

      await page.getByRole('button', { name: 'Novo usuário' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo usuário' });
      await dialog.getByRole('button', { name: 'Salvar' }).click();

      await expect(dialog.getByText('Informe o nome.')).toBeVisible();
      await expect(dialog.getByText('Informe o e-mail.')).toBeVisible();
      await expect(dialog.getByText('Informe a senha inicial.')).toBeVisible();
      expect(posts).toBe(0);

      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step('cadastra um usuário', async () => {
      await page.getByRole('button', { name: 'Novo usuário' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo usuário' });
      await dialog.getByLabel('Nome').fill(NAME);
      await dialog.getByLabel('E-mail').fill(EMAIL);
      await dialog.getByLabel('Perfil').selectOption({ label: 'Usuário' });
      await dialog.getByLabel('Senha inicial').fill(PASSWORD);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/users'),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).status()).toBe(201);

      await expect(dialog).toBeHidden();
      await expect(successToast(page, 'Usuário cadastrado com sucesso.')).toBeVisible();
    });

    await test.step('encontra o usuário pela busca', async () => {
      await searchByEmail(page);
      const row = rowOf(page);
      await expect(row).toBeVisible();
      await expect(row).toContainText(NAME);
      await expect(row).toContainText('Usuário');
      await expect(row).toContainText('Ativo');
    });

    await test.step('e-mail duplicado — o erro da API aparece no modal', async () => {
      await page.getByRole('button', { name: 'Novo usuário' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo usuário' });
      await dialog.getByLabel('Nome').fill(`${NAME} Duplicado`);
      await dialog.getByLabel('E-mail').fill(EMAIL); // o MESMO e-mail de cima
      await dialog.getByLabel('Senha inicial').fill(PASSWORD);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/users'),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).status()).toBe(409);

      // O modal FICA aberto, com a mensagem do backend, para o usuário corrigir.
      await expect(dialog.getByRole('alert')).toHaveText(
        'Já existe um usuário com este e-mail.',
      );
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step('edita o nome', async () => {
      await rowOf(page)
        .getByRole('button', { name: `Editar ${NAME}`, exact: true })
        .click();
      const dialog = page.getByRole('dialog', { name: 'Editar usuário' });
      await expect(dialog.getByLabel('E-mail')).toHaveValue(EMAIL);
      await dialog.getByLabel('Nome').fill(EDITED_NAME);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && /\/users\/\d+$/.test(r.url()),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).ok()).toBe(true);

      await expect(dialog).toBeHidden();
      await expect(successToast(page, 'Usuário atualizado com sucesso.')).toBeVisible();
      await expect(rowOf(page)).toContainText(EDITED_NAME);
    });

    await test.step('desativa', async () => {
      const response = page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && /\/users\/\d+\/status$/.test(r.url()),
      );
      await rowOf(page)
        .getByRole('button', { name: `Desativar ${EDITED_NAME}`, exact: true })
        .click();
      expect((await response).ok()).toBe(true);

      await expect(successToast(page, 'Usuário desativado.')).toBeVisible();
      await expect(rowOf(page)).toContainText('Inativo');
      await expect(
        rowOf(page).getByRole('button', { name: `Ativar ${EDITED_NAME}`, exact: true }),
      ).toBeVisible();
    });

    await test.step('exclui', async () => {
      await rowOf(page)
        .getByRole('button', { name: `Excluir ${EDITED_NAME}`, exact: true })
        .click();
      const dialog = page.getByRole('dialog', { name: 'Excluir usuário' });
      await expect(dialog).toContainText(EDITED_NAME);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'DELETE' && /\/users\/\d+$/.test(r.url()),
      );
      await dialog.getByRole('button', { name: 'Excluir', exact: true }).click();
      expect((await response).ok()).toBe(true);

      await expect(successToast(page, 'Usuário excluído.')).toBeVisible();
      await expect(rowOf(page)).toBeHidden();
    });
  });
});
