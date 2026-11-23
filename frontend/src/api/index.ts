import { httpApi } from './http';
import { criarMockApi } from './mock';
import type { Api } from './ports';

const usarMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const modoSimulado = usarMock;
export const api: Api = usarMock ? criarMockApi() : httpApi;
