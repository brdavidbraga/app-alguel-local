import { describe, it, expect } from 'vitest';
import { rateioService } from './rateioService';
import type { Casa, DespesaAgua, DespesaLuz } from '../types';

const casa = (id: string, quantidadePessoas: number): Casa => ({
  id, nome: id, dataInicioContrato: '2026-01-01', valorAluguel: 1200,
  quantidadePessoas, status: 'ativo',
});
const a = casa('a', 2);
const b = casa('b', 3);

describe('rateios', () => {
  it('distribui água sem diferença no fechamento', () => {
    const despesa: DespesaAgua = { id: 'w', tipo: 'agua', mes: '2026-11', valorTotal: 200 };
    const valores = [a, b].map(c => rateioService.calcularRateioAgua(despesa, c, [a, b]).valorTotalPorCasa);
    expect(valores).toEqual([87.6, 112.4]);
    expect(Math.round((valores[0] + valores[1]) * 100)).toBe(20000);
  });
  it('rejeita fatura de água inferior às taxas fixas', () => {
    const d: DespesaAgua = { id: 'w', tipo: 'agua', mes: '2026-11', valorTotal: 50 };
    expect(() => rateioService.calcularRateioAgua(d, a, [a, b])).toThrow();
  });
  it('rateia energia proporcionalmente ao consumo', () => {
    const d: DespesaLuz = { id: 'e', tipo: 'luz', mes: '2026-11', valorTotal: 300,
      casa1Id: 'a', casa2Id: 'b', consumoKwhTotal: 300,
      consumoKwhPorCasa: [{ casaId: 'a', kwh: 100 }, { casaId: 'b', kwh: 200 }] };
    const result = rateioService.calcularRateioLuz(d, a, b);
    expect([result.valorPorCasa1, result.valorPorCasa2]).toEqual([100, 200]);
  });
  it('rejeita consumo inconsistente', () => {
    const d: DespesaLuz = { id: 'e', tipo: 'luz', mes: '2026-11', valorTotal: 300,
      casa1Id: 'a', casa2Id: 'b', consumoKwhTotal: 300,
      consumoKwhPorCasa: [{ casaId: 'a', kwh: 100 }, { casaId: 'b', kwh: 150 }] };
    expect(() => rateioService.calcularRateioLuz(d, a, b)).toThrow();
  });
  it('divide energia igualmente quando não há leituras', () => {
    const d: DespesaLuz = { id: 'e', tipo: 'luz', mes: '2026-11', valorTotal: 301,
      casa1Id: 'a', casa2Id: 'b' };
    const r = rateioService.calcularRateioLuz(d, a, b);
    expect([r.valorPorCasa1, r.valorPorCasa2]).toEqual([150.5, 150.5]);
  });
  it('mantém aluguel como valor total da casa', () => {
    const r = rateioService.gerarRelatorioMensal('a', '2026-11', [a,b], []);
    expect(r?.totalPorCasa).toBe(1200);
    expect(r?.totalPorInquilino).toBe(600);
  });
});
