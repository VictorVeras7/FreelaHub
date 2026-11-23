import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Usuario } from '@/api/ports';
import { Providers } from '@/app/Providers';
import { Rotas } from '@/app/Rotas';
import { gravarSessao } from '@/features/sessao/armazenamento';

export const CLIENTE: Usuario = { id: 'u-cliente-1', nome: 'Marina Costa', email: 'cliente@freelahub.test', perfil: 'CLIENTE' };
export const FREELANCER: Usuario = { id: 'u-free-1', nome: 'Rafael Lima', email: 'freelancer@freelahub.test', perfil: 'FREELANCER' };

export const logarComo = (usuario: Usuario) => gravarSessao({ token: `simulado.${usuario.id}`, usuario });

export const renderizarEm = (rota: string) =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Providers>
        <Rotas />
      </Providers>
    </MemoryRouter>,
  );
