import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CLIENTE, FREELANCER, logarComo, renderizarEm } from './util';

describe('guardas de rota', () => {
  it('redireciona quem não tem sessão para o login', async () => {
    renderizarEm('/meus-projetos');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('impede o freelancer de abrir rota de cliente', async () => {
    logarComo(FREELANCER);
    renderizarEm('/projetos/novo');
    expect(await screen.findByRole('heading', { name: 'Projetos abertos' })).toBeInTheDocument();
  });

  it('impede o cliente de abrir rota de freelancer', async () => {
    logarComo(CLIENTE);
    renderizarEm('/projetos');
    expect(await screen.findByRole('heading', { name: 'Meus projetos' })).toBeInTheDocument();
  });
});
