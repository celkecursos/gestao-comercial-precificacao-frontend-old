import { readFileSync } from 'node:fs';
import { request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { ADMIN_SESSION } from './sessions.ts';

/** Mesma chave usada por `src/services/token-storage.ts`. */
const TOKEN_KEY = 'gcp:token';

const apiUrl =
  process.env['E2E_API_URL'] ?? process.env['VITE_API_URL'] ?? 'http://localhost:3000';

/** Token JWT gravado pelo `auth.setup.ts` no localStorage da sessão. */
function tokenFrom(sessionFile: string): string {
  const state = JSON.parse(readFileSync(sessionFile, 'utf-8')) as {
    origins: { localStorage: { name: string; value: string }[] }[];
  };
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((item) => item.name === TOKEN_KEY)?.value;
  if (!token)
    throw new Error(`Token não encontrado em ${sessionFile}. Rode a suíte de novo.`);
  return token;
}

/**
 * Cliente HTTP da API autenticado como admin — SÓ para limpeza do dado de teste
 * (`afterAll`). O que o teste verifica passa sempre pela tela; a API direta serve para
 * não deixar rastro quando um passo falha no meio do caminho.
 */
export function adminApi(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${tokenFrom(ADMIN_SESSION)}` },
  });
}
