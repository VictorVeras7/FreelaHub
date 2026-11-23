function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}`);
  }
  return valor;
}

export function carregarConfig() {
  return {
    porta: Number(process.env.PORT ?? 3000),
    databaseUrl: obrigatoria('DATABASE_URL'),
    jwtSecret: obrigatoria('JWT_SECRET'),
    jwtExpiracaoSegundos: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600),
    adminEmail: obrigatoria('ADMIN_EMAIL'),
    adminSenha: obrigatoria('ADMIN_SENHA'),
  };
}
