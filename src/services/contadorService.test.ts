import { describe, it, expect } from 'vitest';
import { previousReading, recalculateReadings } from './contadorService';
import type { ContadorKwh } from '../types';
const reading = (id: string, mes: string, leituraAtual: number, casaId = 'a'): ContadorKwh => ({
  id, mes, casaId, leituraAtual, consumo: 0, dataLeitura: '2026-01-01',
});
describe('leituras do contador', () => {
  it('encontra a leitura mais recente mesmo com meses sem cadastro', () => {
    expect(previousReading([reading('1','2026-01',100)], 'a','2026-04')?.leituraAtual).toBe(100);
  });
  it('recalcula leituras posteriores após inserir mês antigo', () => {
    const values = recalculateReadings([reading('3','2026-03',180),reading('1','2026-01',100),reading('2','2026-02',140)]);
    expect(values.map(v => v.consumo)).toEqual([0,40,40]);
  });
  it('não mistura casas', () => {
    const values = recalculateReadings([reading('1','2026-01',100),reading('2','2026-02',160),reading('3','2026-01',500,'b')]);
    expect(values.find(v => v.id === '2')?.consumo).toBe(60);
    expect(values.find(v => v.id === '3')?.consumo).toBe(0);
  });
  it('impede duplicidade por casa e mês', () => {
    expect(() => recalculateReadings([reading('1','2026-01',100),reading('2','2026-01',120)])).toThrow();
  });
  it('não transforma leitura decrescente em consumo zero silenciosamente', () => {
    expect(() => recalculateReadings([reading('1','2026-01',100),reading('2','2026-02',90)])).toThrow();
  });
});
