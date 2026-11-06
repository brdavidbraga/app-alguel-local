import { useRef, useState } from 'react';
import { backupService } from '../services/backupService';
import './ConfiguracoesPage.css';
import { storageService } from '../services/storage';
import { Casa, Despesa } from '../types';

const CONTADORES_KEY = 'app_contadores_kwh';

function getContadoresCount(): number {
  const data = localStorage.getItem(CONTADORES_KEY);
  const contadores = data ? JSON.parse(data) : [];
  return contadores.length;
}

export function ConfiguracoesPage() {
  const [casas] = useState<Casa[]>(() => storageService.getCasas());
  const [despesas] = useState<Despesa[]>(() => storageService.getDespesas());
  const [contadoresCount] = useState(() => getContadoresCount());
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    backupService.downloadBackup();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('loading');
    setUploadMessage('');
    const result = await backupService.restoreBackup(file);
    setUploadStatus(result.success ? 'success' : 'error');
    setUploadMessage(result.success ? 'Backup restaurado com sucesso! Recarregue a página.' : (result.error || 'Erro ao restaurar.'));
    e.target.value = '';
    if (result.success) {
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Configurações</h1>
      </div>

      <div className="form-container configuracoes-section">
        <h2>Backup dos Dados</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Faça backup (download) dos seus dados ou restaure (upload) um backup anterior.
          O backup inclui casas, despesas e leituras do contador de kWh.
        </p>

        <div className="config-stats" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="stat-badge">Casas: {casas.length}</span>
          <span className="stat-badge">Despesas: {despesas.length}</span>
          <span className="stat-badge">Contadores kWh: {contadoresCount}</span>
        </div>

        <div className="config-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleDownload}>
            Baixar backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button className="btn btn-secondary" onClick={handleUploadClick}>
            Restaurar backup
          </button>
        </div>

        {uploadStatus === 'loading' && (
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Restaurando...</p>
        )}
        {uploadStatus === 'success' && (
          <p style={{ marginTop: '1rem', color: 'var(--success-color)' }}>{uploadMessage}</p>
        )}
        {uploadStatus === 'error' && (
          <p style={{ marginTop: '1rem', color: 'var(--danger-color)' }}>{uploadMessage}</p>
        )}
      </div>
    </div>
  );
}
