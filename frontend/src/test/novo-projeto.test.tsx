import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CLIENTE, logarComo, renderizarEm } from './util';

describe('formulário de novo projeto', () => {
  it('mostra as validações obrigatórias', async () => {
    logarComo(CLIENTE);
    renderizarEm('/projetos/novo');
    await userEvent.click(await screen.findByRole('button', { name: 'Publicar projeto' }));
    expect(await screen.findByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByText('Informe a descrição.')).toBeInTheDocument();
    expect(screen.getByText('Informe o orçamento.')).toBeInTheDocument();
    expect(screen.getByText('Informe o prazo desejado.')).toBeInTheDocument();
  });

  it('recusa orçamento zero e prazo no passado', async () => {
    logarComo(CLIENTE);
    renderizarEm('/projetos/novo');
    await userEvent.type(await screen.findByLabelText('Orçamento estimado (R$)'), '0');
    fireEvent.change(screen.getByLabelText('Prazo desejado'), { target: { value: '2020-01-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Publicar projeto' }));
    expect(await screen.findByText('O orçamento deve ser maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('O prazo deve ser uma data futura.')).toBeInTheDocument();
  });

  it('publica e abre o detalhe do projeto', async () => {
    logarComo(CLIENTE);
    renderizarEm('/projetos/novo');
    await userEvent.type(await screen.findByLabelText('Título'), 'Aplicativo de entregas');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Aplicativo para acompanhar pedidos.');
    await userEvent.type(screen.getByLabelText('Orçamento estimado (R$)'), '3000');
    fireEvent.change(screen.getByLabelText('Prazo desejado'), { target: { value: '2099-01-15' } });
    await userEvent.type(screen.getByLabelText('Habilidades'), 'React{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar projeto' }));
    expect(await screen.findByRole('heading', { name: 'Aplicativo de entregas' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Cancelar projeto' })).toBeInTheDocument();
  }, 15000);
});
