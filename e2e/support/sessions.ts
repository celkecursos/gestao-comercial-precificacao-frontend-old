/**
 * Arquivos de sessão gravados pelo `auth.setup.ts` (cookies + localStorage, onde fica o
 * token JWT). Estão no `.gitignore`: guardam um token VIVO — não comite, não compartilhe.
 */
export const ADMIN_SESSION = '.auth/admin.json';
export const USER_SESSION = '.auth/user.json';

/** Lê uma variável obrigatória do `.env`, com mensagem clara quando falta. */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável ${name} não definida. Copie o bloco E2E do .env.example para o .env.`,
    );
  }
  return value;
}
