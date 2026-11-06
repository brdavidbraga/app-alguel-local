import { Casa, Despesa } from '../types';

const CASAS_KEY = 'app_casas';
const DESPESAS_KEY = 'app_despesas';

export const storageService = {
  // Casas
  getCasas(): Casa[] {
    const data = localStorage.getItem(CASAS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCasas(casas: Casa[]): void {
    localStorage.setItem(CASAS_KEY, JSON.stringify(casas));
  },

  // Despesas
  getDespesas(): Despesa[] {
    const data = localStorage.getItem(DESPESAS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDespesas(despesas: Despesa[]): void {
    localStorage.setItem(DESPESAS_KEY, JSON.stringify(despesas));
  },
};





