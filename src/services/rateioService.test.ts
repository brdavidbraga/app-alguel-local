import { describe, it, expect } from 'vitest';
import { calcularProporcionalidadePrimeiraLuz, rateioService } from './rateioService';
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
  it('estima 12 dias de ocupação em ciclo de 31 dias na primeira cobrança', () => {
    const novaCasa = { ...a, dataInicioContrato: '2026-11-12' };
    const d: DespesaLuz = {
      id: 'luz-nov', tipo: 'luz', mes: '2026-11', valorTotal: 300,
      casa1Id: 'a', casa2Id: 'b', consumoKwhTotal: 300,
      consumoKwhPorCasa: [{ casaId: 'a', kwh: 100 }, { casaId: 'b', kwh: 200 }],
      dataLeituraAnterior: '2026-10-24', dataLeituraAtual: '2026-11-24',
      casasPrimeiraCobrancaProporcional: ['a'],
    };
    const relatorioA = rateioService.gerarRelatorioMensal('a', '2026-11', [novaCasa, b], [d]);
    const relatorioB = rateioService.gerarRelatorioMensal('b', '2026-11', [novaCasa, b], [d]);
    expect(relatorioA?.proporcionalidadeLuz?.diasCiclo).toBe(31);
    expect(relatorioA?.proporcionalidadeLuz?.diasOcupacao).toBe(12);
    expect(relatorioA?.proporcionalidadeLuz?.valorIntegral).toBe(100);
    expect(relatorioA?.luz?.valorPorCasa1).toBe(38.71);
    expect(relatorioA?.totalPorCasa).toBe(1238.71);
    expect(relatorioB?.luz?.valorPorCasa2).toBe(200);
    expect(relatorioB?.proporcionalidadeLuz).toBeNull();

    const semOpcao = rateioService.gerarRelatorioMensal('a', '2026-11', [novaCasa, b],
      [{ ...d, casasPrimeiraCobrancaProporcional: [] }]);
    expect(semOpcao?.luz?.valorPorCasa1).toBe(100);
    expect(semOpcao?.totalPorCasa).toBe(1300);
  });
  it('não aplica proporção fora do primeiro ciclo ou com datas ausentes', () => {
    const d: DespesaLuz = { id: 'luz', tipo: 'luz', mes: '2026-11', valorTotal: 100,
      casa1Id: 'a', casa2Id: 'b', dataLeituraAnterior: '2026-10-24',
      dataLeituraAtual: '2026-11-24', casasPrimeiraCobrancaProporcional: ['a'] };
    expect(calcularProporcionalidadePrimeiraLuz(a, d, 50)).toBeNull();
    expect(calcularProporcionalidadePrimeiraLuz({ ...a, dataInicioContrato: '2026-11-24' }, d, 50)).toBeNull();
    expect(calcularProporcionalidadePrimeiraLuz({ ...a, dataInicioContrato: '2026-11-12' },
      { ...d, dataLeituraAnterior: undefined }, 50)).toBeNull();
    expect(calcularProporcionalidadePrimeiraLuz({ ...a, dataInicioContrato: '2026-02-30' }, d, 50)).toBeNull();
  });
  it('calcula dias reais mesmo em fevereiro de ano bissexto', () => {
    const d: DespesaLuz = { id: 'luz', tipo: 'luz', mes: '2028-03', valorTotal: 100,
      casa1Id: 'a', casa2Id: 'b', dataLeituraAnterior: '2028-02-24',
      dataLeituraAtual: '2028-03-24' };
    const r = calcularProporcionalidadePrimeiraLuz({ ...a, dataInicioContrato: '2028-03-12' }, d, 100);
    expect([r?.diasCiclo, r?.diasOcupacao, r?.valorProporcional]).toEqual([29, 12, 41.38]);
  });
    it('mantém aluguel como valor total da casa', () => {
    const r = rateioService.gerarRelatorioMensal('a', '2026-11', [a,b], []);
    expect(r?.totalPorCasa).toBe(1200);
    expect(r?.totalPorInquilino).toBe(600);
  });
});
