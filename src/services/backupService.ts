import { Casa, Despesa, ContadorKwh } from '../types';

const CASAS_KEY = 'app_casas';
const DESPESAS_KEY = 'app_despesas';
const CONTADORES_KEY = 'app_contadores_kwh';

export interface BackupData {
  version: number;
  dataExport: string;
  casas: Casa[];
  despesas: Despesa[];
  contadores: ContadorKwh[];
}

function isValidBackup(obj: unknown): obj is BackupData {
  if (!obj || typeof obj !== 'object') return false;
  const b = obj as Record<string, unknown>;
  return (
    Array.isArray(b.casas) &&
    Array.isArray(b.despesas) &&
    Array.isArray(b.contadores)
  );
}

export const backupService = {
  /** Gera um objeto de backup com todos os dados atuais */
  createBackup(): BackupData {
    const casas = JSON.parse(localStorage.getItem(CASAS_KEY) || '[]');
    const despesas = JSON.parse(localStorage.getItem(DESPESAS_KEY) || '[]');
    const contadores = JSON.parse(localStorage.getItem(CONTADORES_KEY) || '[]');
    return {
      version: 1,
      dataExport: new Date().toISOString(),
      casas,
      despesas,
      contadores,
    };
  },

  /** Faz download do backup como arquivo JSON */
  downloadBackup(): void {
    const backup = this.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestao-casa-backup-${backup.dataExport.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Restaura dados a partir de um arquivo JSON */
  async restoreBackup(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isValidBackup(parsed)) {
        return { success: false, error: 'Arquivo de backup inválido.' };
      }
      localStorage.setItem(CASAS_KEY, JSON.stringify(parsed.casas));
      localStorage.setItem(DESPESAS_KEY, JSON.stringify(parsed.despesas));
      localStorage.setItem(CONTADORES_KEY, JSON.stringify(parsed.contadores));
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao restaurar backup.';
      return { success: false, error: msg };
    }
  },
};
