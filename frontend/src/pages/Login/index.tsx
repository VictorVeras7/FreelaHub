import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { modoSimulado } from '@/api';
import { mensagemDoErro } from '@/api/ApiError';
import { CONTAS_DEMO } from '@/api/mock/dados';
import type { Credenciais } from '@/api/ports';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { AvisoErro } from '@/components/Feedback';
import { rotaInicial, useSessao } from '@/features/sessao/SessaoContext';
import { LayoutAutenticacao } from './LayoutAutenticacao';

const esquema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export function Login() {
  const { entrar, avisoExpirada } = useSessao();
  const navegar = useNavigate();
  const estado = useLocation().state as { sucesso?: string } | null;
  const [erro, setErro] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Credenciais>({ resolver: zodResolver(esquema) });

  const enviar = async (dados: Credenciais) => {
    setErro('');
    try {
      const usuario = await entrar(dados);
      navegar(rotaInicial(usuario.perfil), { replace: true });
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  return (
    <LayoutAutenticacao titulo="Entrar" descricao="Acesse sua conta para continuar.">
      <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
        {avisoExpirada && <AvisoErro mensagem="Sua sessão expirou. Entre novamente." />}
        {estado?.sucesso && <p role="status" className="rounded-campo bg-sucesso-suave px-3 py-2 font-medium text-sucesso">{estado.sucesso}</p>}
        {erro && <AvisoErro mensagem={erro} />}
        <Campo rotulo="E-mail" type="email" autoComplete="email" erro={errors.email?.message} {...register('email')} />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" erro={errors.senha?.message} {...register('senha')} />
        <Botao type="submit" className="w-full" carregando={isSubmitting}>Entrar</Botao>
      </form>
      {modoSimulado && (
        <div className="mt-5 rounded-campo border border-dashed border-borda p-3">
          <p className="text-detalhe text-texto-suave">Modo de demonstração</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Botao variante="secundaria" onClick={() => enviar(CONTAS_DEMO.cliente)}>Sou cliente</Botao>
            <Botao variante="secundaria" onClick={() => enviar(CONTAS_DEMO.freelancer)}>Sou freelancer</Botao>
          </div>
        </div>
      )}
      <p className="mt-5 text-center text-texto-suave">
        Ainda não tem conta? <Link to="/cadastro" className="font-semibold text-primaria hover:underline">Cadastre-se</Link>
      </p>
    </LayoutAutenticacao>
  );
}
