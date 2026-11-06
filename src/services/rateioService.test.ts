import { describe, it, expect } from 'vitest';
import { calcularProporcionalidadePrimeiraAgua, rateioService } from './rateioService';
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
  it('cobra água por 12 dias de um ciclo de 31 na primeira cobrança', () => {
    const novaCasa = { ...a, dataInicioContrato: '2026-11-12' };
    const d: DespesaAgua = {
      id: 'w-nov', tipo: 'agua', mes: '2026-11', valorTotal: 200,
      dataLeituraAnterior: '2026-10-24', dataLeituraAtual: '2026-11-24',
      casasPrimeiraCobrancaProporcional: ['a'],
    };
    const rA = rateioService.gerarRelatorioMensal('a', '2026-11', [novaCasa, b], [d]);
    const rB = rateioService.gerarRelatorioMensal('b', '2026-11', [novaCasa, b], [d]);
    expect(rA?.proporcionalidadeAgua?.diasCiclo).toBe(31);
    expect(rA?.proporcionalidadeAgua?.diasOcupacao).toBe(12);
    expect(rA?.proporcionalidadeAgua?.valorIntegral).toBe(87.6);
    expect(rA?.agua.taxaFixaCasa).toBe(14.71);
    expect(rA?.agua.valorTotalPorCasa).toBe(33.91);
    expect(rA?.agua.valorVariavelPorCasa).toBe(19.2);
    expect(rA?.totalPorCasa).toBe(1233.91);
    expect(rB?.agua.valorTotalPorCasa).toBe(112.4);
    expect(rB?.proporcionalidadeAgua).toBeNull();

    const semOpcao = rateioService.gerarRelatorioMensal('a', '2026-11', [novaCasa, b],
      [{ ...d, casasPrimeiraCobrancaProporcional: [] }]);
    expect(semOpcao?.agua.valorTotalPorCasa).toBe(87.6);
    expect(semOpcao?.totalPorCasa).toBe(1287.6);
  });
  it('mantém luz integral mesmo quando existem campos antigos salvos de proporcionalidade', () => {
    const novaCasa = { ...a, dataInicioContrato: '2026-11-12' };
    const d: DespesaLuz = {
      id: 'e', tipo: 'luz', mes: '2026-11', valorTotal: 300,
      casa1Id: 'a', casa2Id: 'b', consumoKwhTotal: 300,
      consumoKwhPorCasa: [{ casaId: 'a', kwh: 100 }, { casaId: 'b', kwh: 200 }],
    };
    const antigo = { ...d, dataLeituraAnterior: '2026-10-24',
      dataLeituraAtual: '2026-11-24', casasPrimeiraCobrancaProporcional: ['a'] };
    const r = rateioService.gerarRelatorioMensal('a', '2026-11', [novaCasa, b], [antigo]);
    expect(r?.luz?.valorPorCasa1).toBe(100);
    expect(r?.totalPorCasa).toBe(1300);
  });
  it('não aplica água proporcional fora do primeiro ciclo ou sem datas válidas', () => {
    const d: DespesaAgua = { id: 'w', tipo: 'agua', mes: '2026-11', valorTotal: 200,
      dataLeituraAnterior: '2026-10-24', dataLeituraAtual: '2026-11-24',
      casasPrimeiraCobrancaProporcional: ['a'] };
    const rateio = rateioService.calcularRateioAgua(d, a, [a,b]);
    expect(calcularProporcionalidadePrimeiraAgua(a, d, rateio)).toBeNull();
    expect(calcularProporcionalidadePrimeiraAgua({ ...a, dataInicioContrato: '2026-11-24' }, d, rateio)).toBeNull();
    expect(calcularProporcionalidadePrimeiraAgua({ ...a, dataInicioContrato: '2026-11-12' },
      { ...d, dataLeituraAnterior: undefined }, rateio)).toBeNull();
    expect(calcularProporcionalidadePrimeiraAgua({ ...a, dataInicioContrato: '2026-02-30' }, d, rateio)).toBeNull();
  });
  it('considera fevereiro de ano bissexto na água', () => {
    const d: DespesaAgua = { id: 'w', tipo: 'agua', mes: '2028-03', valorTotal: 200,
      dataLeituraAnterior: '2028-02-24', dataLeituraAtual: '2028-03-24' };
    const rateio = rateioService.calcularRateioAgua(d, a, [a,b]);
    const r = calcularProporcionalidadePrimeiraAgua({ ...a, dataInicioContrato: '2028-03-12' }, d, rateio);
    expect([r?.diasCiclo, r?.diasOcupacao, r?.valorProporcional]).toEqual([29, 12, 36.25]);
  });
  it('mantém aluguel como valor total da casa', () => {
    const r = rateioService.gerarRelatorioMensal('a', '2026-11', [a,b], []);
    expect(r?.totalPorCasa).toBe(1200);
    expect(r?.totalPorInquilino).toBe(600);
  });
});
