import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../../src');
const IMPORTACAO = /(?:from\s+|import\s+|require\()['"]([^'"]+)['"]/g;

function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    return item.isDirectory() ? arquivos(caminho) : [caminho];
  });
}

function importacoes(arquivo: string): string[] {
  return [...readFileSync(arquivo, 'utf8').matchAll(IMPORTACAO)].map((m) => m[1]);
}

describe('regras do hexágono (ADR-001, RNF01)', () => {
  it.each(['domain', 'application'])('%s só importa código interno', (camada) => {
    const violacoes = arquivos(join(SRC, camada)).flatMap((arquivo) =>
      importacoes(arquivo)
        .filter((alvo) => !alvo.startsWith('.') || alvo.includes('adapters'))
        .map((alvo) => `${arquivo}: ${alvo}`),
    );
    expect(violacoes).toEqual([]);
  });

  it('domain não importa application', () => {
    const violacoes = arquivos(join(SRC, 'domain')).flatMap((arquivo) =>
      importacoes(arquivo).filter((alvo) => alvo.includes('application')),
    );
    expect(violacoes).toEqual([]);
  });
});
