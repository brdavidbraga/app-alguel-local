import { useState, useMemo } from 'react';
import { previousReading, recalculateReadings } from '../services/contadorService';
import { ContadorKwh, Casa } from '../types';
import { storageService } from '../services/storage';
import './ContadorKwhPage.css';

const CONTADORES_KEY = 'app_contadores_kwh';

const contadorStorage = {
  getContadores(): ContadorKwh[] {
    const data = localStorage.getItem(CONTADORES_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveContadores(contadores: ContadorKwh[]): void {
    localStorage.setItem(CONTADORES_KEY, JSON.stringify(contadores));
  },
};

export function ContadorKwhPage() {
  const [casas] = useState<Casa[]>(() => storageService.getCasas());
  const [contadores, setContadores] = useState<ContadorKwh[]>(() =>
    contadorStorage.getContadores()
  );
  const [showForm, setShowForm] = useState(false);
  const [contadorEditando, setContadorEditando] = useState<ContadorKwh | undefined>();
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [casaId, setCasaId] = useState('');
  const [leituraAtual, setLeituraAtual] = useState<number | ''>('');

  const leituraAnterior = useMemo(
    () => casaId && mes ? previousReading(contadores, casaId, mes, contadorEditando?.id)?.leituraAtual : undefined,
    [casaId, mes, contadores, contadorEditando]
  );

  const formatMes = (mes: string) => {
    const [ano, mesNum] = mes.split('-');
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${meses[parseInt(mesNum) - 1]}/${ano}`;
  };

  const getCasaNome = (casaId?: string) => {
    if (!casaId) return '-';
    const casa = casas.find(c => c.id === casaId);
    return casa?.nome || 'Casa não encontrada';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!casaId || !mes || leituraAtual === '') {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const leituraAtualNum = Number(leituraAtual);
    
    if (!Number.isFinite(leituraAtualNum) || leituraAtualNum < 0) {
      alert('Digite uma leitura válida');
      return;
    }

    const contador: ContadorKwh = {
      id: contadorEditando?.id || crypto.randomUUID(),
      casaId,
      mes,
      leituraAtual: leituraAtualNum,
      consumo: 0,
      dataLeitura: new Date().toISOString(),
    };

    const candidate = contadorEditando
      ? contadores.map(c => c.id === contador.id ? contador : c)
      : [...contadores, contador];

    let updatedContadores: ContadorKwh[];
    try {
      updatedContadores = recalculateReadings(candidate);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao calcular consumo.');
      return;
    }
    setContadores(updatedContadores);
    contadorStorage.saveContadores(updatedContadores);
    setShowForm(false);
    setContadorEditando(undefined);
    resetForm();
  };

  const resetForm = () => {
    setCasaId('');
    setLeituraAtual('');
    setMes(new Date().toISOString().slice(0, 7));
  };

  const handleEdit = (contador: ContadorKwh) => {
    setContadorEditando(contador);
    setCasaId(contador.casaId);
    setLeituraAtual(contador.leituraAtual);
    setMes(contador.mes);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta leitura? Os consumos posteriores serão recalculados.')) {
      try {
        const updatedContadores = recalculateReadings(contadores.filter(c => c.id !== id));
        setContadores(updatedContadores);
        contadorStorage.saveContadores(updatedContadores);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao recalcular leituras.');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setContadorEditando(undefined);
    resetForm();
  };

  const contadoresAgrupados = contadores.reduce((acc, contador) => {
    if (!acc[contador.mes]) {
      acc[contador.mes] = [];
    }
    acc[contador.mes].push(contador);
    return acc;
  }, {} as Record<string, ContadorKwh[]>);

  const mesesOrdenados = Object.keys(contadoresAgrupados).sort().reverse();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Contador kWh</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Nova Leitura
          </button>
        )}
      </div>

      {showForm ? (
        <div className="form-container">
          <h2>{contadorEditando ? 'Editar Leitura' : 'Nova Leitura'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="casaId">Casa *</label>
              <select
                id="casaId"
                value={casaId}
                onChange={e => {
                  setCasaId(e.target.value);
                  // Quando mudar a casa, buscar leitura anterior automaticamente
                }}
                required
              >
                <option value="">Selecione uma casa</option>
                {casas.map(casa => (
                  <option key={casa.id} value={casa.id}>
                    {casa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mes">Mês/Ano da Leitura *</label>
              <input
                type="month"
                id="mes"
                value={mes}
                onChange={e => setMes(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="leituraAtual">Leitura Atual (kWh) *</label>
              <input
                type="number"
                id="leituraAtual"
                step="0.01"
                min="0"
                value={leituraAtual}
                onChange={e => {
                  const value = e.target.value;
                  setLeituraAtual(value === '' ? '' : parseFloat(value) || '');
                }}
                required
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                Digite o valor do contador sem zeros no final. O consumo será calculado automaticamente.
              </small>
            </div>

            {casaId && (
              <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.375rem', marginBottom: '1.5rem' }}>
                {leituraAnterior !== undefined ? (
                  <>
                    <strong>Leitura anterior registrada:</strong>{' '}
                    {leituraAnterior.toFixed(2).replace(/\.?0+$/, '')} kWh
                    <br />
                    {leituraAtual !== '' && (
                      <>
                        <strong>Consumo Estimado:</strong>{' '}
                        {(() => {
                          const leituraAtualNum = Number(leituraAtual);
                          if (isNaN(leituraAtualNum)) return '0';
                          const consumo = leituraAtualNum - leituraAnterior;
                          return consumo >= 0 ? consumo.toFixed(2) : 'Leitura menor que a anterior';
                        })()}{' '}
                        kWh
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <strong>Leitura Anterior:</strong> Nenhuma leitura anterior cadastrada para esta casa.
                    <br />
                    <small>O consumo inicial será 0 kWh até existir uma leitura de referência.</small>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Salvar
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {mesesOrdenados.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma leitura cadastrada ainda.</p>
            </div>
          ) : (
            mesesOrdenados.map(mes => (
              <div key={mes} className="contadores-mes">
                <h2>{formatMes(mes)}</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Casa</th>
                        <th>Leitura Anterior</th>
                        <th>Leitura Atual</th>
                        <th>Consumo (kWh)</th>
                        <th>Data da Leitura</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contadoresAgrupados[mes].map(contador => (
                        <tr key={contador.id}>
                          <td>
                            <strong>{getCasaNome(contador.casaId)}</strong>
                          </td>
                          <td>
                            {contador.leituraAnterior !== undefined
                              ? contador.leituraAnterior.toFixed(2)
                              : '-'}
                          </td>
                          <td>{contador.leituraAtual.toFixed(2)}</td>
                          <td>
                            <strong style={{ color: 'var(--primary-color)' }}>
                              {contador.consumo.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            {new Date(contador.dataLeitura).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleEdit(contador)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(contador.id)}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

