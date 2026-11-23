import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { api } from '@/api';
import { ApiError, mensagemDoErro } from '@/api/ApiError';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { AvisoErro } from '@/components/Feedback';
import { LayoutAutenticacao } from '../Login/LayoutAutenticacao';

const esquema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome.'),
    email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
    senha: z.string().min(8, 'A senha precisa ter no mínimo 8 caracteres.'),
    confirmacao: z.string().min(1, 'Confirme a senha.'),
    perfil: z.enum(['CLIENTE', 'FREELANCER'], { errorMap: () => ({ message: 'Escolha o tipo de conta.' }) }),
  })
  .refine((dados) => dados.senha === dados.confirmacao, { path: ['confirmacao'], message: 'As senhas não coincidem.' });

type Dados = z.infer<typeof esquema>;

const TIPOS = [
  { valor: 'CLIENTE', titulo: 'Cliente', descricao: 'Publico projetos e contrato freelancers.' },
  { valor: 'FREELANCER', titulo: 'Freelancer', descricao: 'Busco projetos e envio propostas.' },
] as const;

export function Cadastro() {
  const navegar = useNavigate();
  const [erro, setErro] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Dados>({ resolver: zodResolver(esquema) });

  const enviar = async ({ nome, email, senha, perfil }: Dados) => {
    setErro('');
    try {
      await api.auth.cadastrar({ nome, email, senha, perfil });
      navegar('/login', { replace: true, state: { sucesso: 'Conta criada. Entre para continuar.' } });
    } catch (falha) {
      setErro(falha instanceof ApiError && falha.status === 409 ? 'Já existe uma conta com este e-mail.' : mensagemDoErro(falha));
    }
  };

  return (
    <LayoutAutenticacao titulo="Criar conta" descricao="Escolha como você vai usar o FreelaHub.">
      <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
        {erro && <AvisoErro mensagem={erro} />}
        <fieldset>
          <legend className="mb-1 font-medium">Tipo de conta</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPOS.map((tipo) => (
              <label key={tipo.valor} className="cursor-pointer rounded-campo border border-borda bg-superficie p-3 transition hover:border-primaria/40 has-[:checked]:border-primaria has-[:checked]:bg-primaria-suave/50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaria">
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" value={tipo.valor} className="accent-primaria" {...register('perfil')} />
                  {tipo.titulo}
                </span>
                <span className="mt-1 block text-detalhe text-texto-suave">{tipo.descricao}</span>
              </label>
            ))}
          </div>
          {errors.perfil && <p role="alert" className="mt-1 text-detalhe font-medium text-erro">{errors.perfil.message}</p>}
        </fieldset>
        <Campo rotulo="Nome" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
        <Campo rotulo="E-mail" type="email" autoComplete="email" erro={errors.email?.message} {...register('email')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Senha" type="password" autoComplete="new-password" erro={errors.senha?.message} {...register('senha')} />
          <Campo rotulo="Confirmar senha" type="password" autoComplete="new-password" erro={errors.confirmacao?.message} {...register('confirmacao')} />
        </div>
        <Botao type="submit" className="w-full" carregando={isSubmitting}>Criar conta</Botao>
      </form>
      <p className="mt-5 text-center text-texto-suave">
        Já tem conta? <Link to="/login" className="font-semibold text-primaria hover:underline">Entrar</Link>
      </p>
    </LayoutAutenticacao>
  );
}
