import '@fontsource/anton';
import '@fontsource-variable/tasa-orbiter';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './app/Providers';
import { Rotas } from './app/Rotas';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Rotas />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
