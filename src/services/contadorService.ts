import type { ContadorKwh } from '../types';

const monthNumber = (mes: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error('Mês inválido.');
  return Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7));
};

export function previousReading(readings: ContadorKwh[], casaId: string, mes: string, excludeId?: string) {
  const target = monthNumber(mes);
  return readings
    .filter(r => r.casaId === casaId && r.id !== excludeId && monthNumber(r.mes) < target)
    .sort((a, b) => monthNumber(b.mes) - monthNumber(a.mes))[0];
}

export function recalculateReadings(readings: ContadorKwh[]): ContadorKwh[] {
  const seen = new Set<string>();
  const last = new Map<string, number>();
  return [...readings]
    .sort((a, b) => monthNumber(a.mes) - monthNumber(b.mes) || a.casaId.localeCompare(b.casaId))
    .map(r => {
      const key = r.casaId + ':' + r.mes;
      if (seen.has(key)) throw new Error('Já existe leitura para esta casa neste mês.');
      seen.add(key);
      if (!Number.isFinite(r.leituraAtual) || r.leituraAtual < 0) throw new Error('Leitura inválida.');
      const anterior = last.get(r.casaId);
      if (anterior !== undefined && r.leituraAtual < anterior) {
        throw new Error('Leitura atual menor que a anterior na casa ' + r.casaId + '. Verifique se o contador foi trocado.');
      }
      last.set(r.casaId, r.leituraAtual);
      return {
        ...r,
        leituraAnterior: anterior,
        consumo: anterior === undefined ? 0 : Math.round((r.leituraAtual - anterior + Number.EPSILON) * 100) / 100,
      };
    });
}
