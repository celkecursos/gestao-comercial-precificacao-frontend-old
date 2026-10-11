import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { adminApi } from '../support/api.ts';

/**
 * E2E do módulo Produtos — ciclo completo pela tela, como administrador.
 *
 * O que ele cobre, e que nenhuma outra camada alcança: o contrato real da API
 * (POST/PATCH/PATCH status/DELETE em /products), o erro de negócio do backend chegando
 * ao usuário (código duplicado → 409), e a listagem — busca e filtro de status —
 * refletindo cada mudança.
 *
 * O que ele NÃO cobre: as regras puras de validação do formulário (obrigatórios e a
 * máscara do código em `ProductFormModal`) — só confere que a tela BLOQUEIA o envio e
 * mostra a mensagem; o detalhe de cada regex é assunto de teste de unidade.
 *
 * Dado de teste: um produto `E2E Produto <carimbo>` / código `E2E-<carimbo>` criado e
 * EXCLUÍDO pelo próprio teste (a exclusão é física). Se um passo falhar no meio, o
 * `afterAll` remove pela API.
 */

const LIST = '/produtos';
const STAMP = Date.now().toString().slice(-8);
const CODE = `E2E-${STAMP}`;
const NAME = `E2E Produto ${STAMP}`;
const EDITED_NAME = `${NAME} Editado`;
const UNIT = 'KG';
const DESCRIPTION = 'Produto criado pelo teste automatizado.';

/** A linha da tabela deste teste, achada pelo código (não muda ao editar o nome). */
function rowOf(page: Page) {
  return page.getByRole('row').filter({ hasText: CODE });
}

/** Toast de sucesso (`role="status"`) com a mensagem exata da ação. */
function successToast(page: Page, message: string) {
  return page.getByRole('status').filter({ hasText: message });
}

/** Resposta da listagem com os parâmetros esperados (a busca tem debounce). */
function listResponse(page: Page, params: Record<string, string>) {
  return page.waitForResponse((response) => {
    if (response.request().method() !== 'GET') return false;
    const url = new URL(response.url());
    if (!url.pathname.endsWith('/products')) return false;
    return Object.entries(params).every(
      ([key, value]) => url.searchParams.get(key) === value,
    );
  });
}

/** Abre a listagem e filtra pelo código do teste. */
async function searchByCode(page: Page) {
  await page.goto(LIST);
  const filtered = listResponse(page, { search: CODE });
  await page.getByLabel('Buscar produtos por nome ou código').fill(CODE);
  await filtered;
}

test.describe('Produtos', () => {
  test.afterAll(async () => {
    // Rede de segurança: só age se o teste parou antes do passo de exclusão.
    const api = await adminApi();
    const response = await api.get('/products', { params: { search: CODE } });
    const { data } = (await response.json()) as { data: { id: number }[] };
    for (const product of data) await api.delete(`/products/${product.id}`);
    await api.dispose();
  });

  test('cadastro, edição, desativação, filtro e exclusão', async ({ page }) => {
    await test.step('abre a listagem', async () => {
      await page.goto(LIST);
      await expect(
        page.getByRole('heading', { name: 'Produtos', level: 1 }),
      ).toBeVisible();
    });

    await test.step('formulário inválido não chega na API', async () => {
      let posts = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/products')) posts++;
      });

      await page.getByRole('button', { name: 'Novo produto' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo produto' });
      await dialog.getByRole('button', { name: 'Salvar' }).click();

      await expect(dialog.getByText('Informe o código.')).toBeVisible();
      await expect(dialog.getByText('Informe a unidade.')).toBeVisible();
      await expect(dialog.getByText('Informe o nome.')).toBeVisible();

      // Código fora do padrão (espaço) continua bloqueado no cliente.
      await dialog.getByLabel('Código').fill('E2E 001');
      await dialog.getByLabel('Unidade').fill(UNIT);
      await dialog.getByLabel('Nome').fill(NAME);
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      await expect(
        dialog.getByText('Use apenas letras, números, ".", "_" ou "-".'),
      ).toBeVisible();

      expect(posts).toBe(0);

      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step('cadastra um produto', async () => {
      await page.getByRole('button', { name: 'Novo produto' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo produto' });
      await dialog.getByLabel('Código').fill(CODE);
      await dialog.getByLabel('Unidade').fill(UNIT);
      await dialog.getByLabel('Nome').fill(NAME);
      await dialog.getByLabel('Descrição').fill(DESCRIPTION);
      await expect(dialog.getByRole('switch', { name: 'Produto ativo' })).toHaveAttribute(
        'aria-checked',
        'true',
      );

      const response = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/products'),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).status()).toBe(201);

      await expect(dialog).toBeHidden();
      await expect(successToast(page, 'Produto cadastrado com sucesso.')).toBeVisible();
    });

    await test.step('encontra o produto pela busca', async () => {
      await searchByCode(page);
      const row = rowOf(page);
      await expect(row).toBeVisible();
      await expect(row).toContainText(NAME);
      await expect(row).toContainText(UNIT);
      await expect(row).toContainText('Ativo');
    });

    await test.step('código duplicado — o erro da API aparece no modal', async () => {
      await page.getByRole('button', { name: 'Novo produto' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo produto' });
      await dialog.getByLabel('Código').fill(CODE); // o MESMO código de cima
      await dialog.getByLabel('Unidade').fill(UNIT);
      await dialog.getByLabel('Nome').fill(`${NAME} Duplicado`);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/products'),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).status()).toBe(409);

      // O modal FICA aberto, com a mensagem do backend, para o usuário corrigir.
      await expect(dialog.getByRole('alert')).toHaveText(
        'Já existe um produto com este código.',
      );
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step('edita o nome e a descrição', async () => {
      await rowOf(page)
        .getByRole('button', { name: `Editar ${NAME}`, exact: true })
        .click();
      const dialog = page.getByRole('dialog', { name: 'Editar produto' });
      await expect(dialog.getByLabel('Código')).toHaveValue(CODE);
      await expect(dialog.getByLabel('Descrição')).toHaveValue(DESCRIPTION);
      await dialog.getByLabel('Nome').fill(EDITED_NAME);
      await dialog.getByLabel('Descrição').fill(`${DESCRIPTION} Editada.`);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && /\/products\/\d+$/.test(r.url()),
      );
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      expect((await response).ok()).toBe(true);

      await expect(dialog).toBeHidden();
      await expect(successToast(page, 'Produto atualizado com sucesso.')).toBeVisible();
      await expect(rowOf(page)).toContainText(EDITED_NAME);
    });

    await test.step('desativa', async () => {
      const response = page.waitForResponse(
        (r) =>
          r.request().method() === 'PATCH' && /\/products\/\d+\/status$/.test(r.url()),
      );
      await rowOf(page)
        .getByRole('button', { name: `Desativar ${EDITED_NAME}`, exact: true })
        .click();
      expect((await response).ok()).toBe(true);

      await expect(successToast(page, 'Produto desativado.')).toBeVisible();
      await expect(rowOf(page)).toContainText('Inativo');
      await expect(
        rowOf(page).getByRole('button', { name: `Ativar ${EDITED_NAME}`, exact: true }),
      ).toBeVisible();
    });

    await test.step('o filtro de status separa ativos de inativos', async () => {
      const onlyActive = listResponse(page, { search: CODE, active: 'true' });
      await page.getByLabel('Status').selectOption({ label: 'Ativos' });
      await onlyActive;
      // Âncora: a listagem respondeu e mostra o estado vazio — não é uma tela a meio carregar.
      await expect(page.getByText('Nenhum produto encontrado')).toBeVisible();
      await expect(rowOf(page)).toHaveCount(0);

      const onlyInactive = listResponse(page, { search: CODE, active: 'false' });
      await page.getByLabel('Status').selectOption({ label: 'Inativos' });
      await onlyInactive;
      await expect(rowOf(page)).toBeVisible();
    });

    await test.step('exclui', async () => {
      await rowOf(page)
        .getByRole('button', { name: `Excluir ${EDITED_NAME}`, exact: true })
        .click();
      const dialog = page.getByRole('dialog', { name: 'Excluir produto' });
      await expect(dialog).toContainText(EDITED_NAME);

      const response = page.waitForResponse(
        (r) => r.request().method() === 'DELETE' && /\/products\/\d+$/.test(r.url()),
      );
      await dialog.getByRole('button', { name: 'Excluir', exact: true }).click();
      expect((await response).status()).toBe(204);

      await expect(successToast(page, 'Produto excluído.')).toBeVisible();
      await expect(rowOf(page)).toHaveCount(0);
    });
  });
});
