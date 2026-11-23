import { Route, Routes } from 'react-router-dom';
import { Cadastro } from '@/pages/Cadastro';
import { Contrato } from '@/pages/Contrato';
import { Contratos } from '@/pages/Contratos';
import { DetalheProjeto } from '@/pages/DetalheProjeto';
import { EnviarProposta } from '@/pages/EnviarProposta';
import { Inicio } from '@/pages/Inicio';
import { Login } from '@/pages/Login';
import { MeusProjetos } from '@/pages/MeusProjetos';
import { NovoProjeto } from '@/pages/NovoProjeto';
import { ProjetosAbertos } from '@/pages/ProjetosAbertos';
import { PropostasRecebidas } from '@/pages/PropostasRecebidas';
import { RedirecionarInicio, RotaProtegida, RotaPublica } from './Guardas';
import { Layout } from './Layout';

export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/projetos/:id" element={<DetalheProjeto />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/contratos/:id" element={<Contrato />} />
          <Route element={<RotaProtegida perfis={['FREELANCER']} />}>
            <Route path="/projetos" element={<ProjetosAbertos />} />
            <Route path="/projetos/:id/proposta" element={<EnviarProposta />} />
          </Route>
          <Route element={<RotaProtegida perfis={['CLIENTE']} />}>
            <Route path="/meus-projetos" element={<MeusProjetos />} />
            <Route path="/projetos/novo" element={<NovoProjeto />} />
            <Route path="/projetos/:id/propostas" element={<PropostasRecebidas />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<RedirecionarInicio />} />
    </Routes>
  );
}
