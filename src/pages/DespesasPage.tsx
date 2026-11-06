import { useState } from 'react';
import { Casa, Despesa } from '../types';
import { storageService } from '../services/storage';
import { DespesaForm } from '../components/DespesaForm';

export function DespesasPage() {
  const [casas] = useState<Casa[]>(() => storageService.getCasas());
  const [despesas, setDespesas] = useState<Despesa[]>(() => storageService.getDespesas());
  const [showForm, setShowForm] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState<Despesa | undefined>();

  const handleSave = (despesa: Despesa) => {
    let updatedDespesas: Despesa[];
    if (despesaEditando) {
      // Editar despesa existente
      updatedDespesas = despesas.map(d => d.id === despesa.id ? despesa : d);
    } else {
      // Adicionar nova despesa
      updatedDespesas = [...despesas, despesa];
    }
    setDespesas(updatedDespesas);
    storageService.saveDespesas(updatedDespesas);
    setShowForm(false);
    setDespesaEditando(undefined);
  };

  const handleEdit = (despesa: Despesa) => {
    setDespesaEditando(despesa);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setDespesaEditando(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      const updatedDespesas = despesas.filter(d => d.id !== id);
      setDespesas(updatedDespesas);
      storageService.saveDespesas(updatedDespesas);
    }
  };

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

  const getCasaNome = (casaId: string) => {
    const casa = casas.find(c => c.id === casaId);
    return casa?.nome || 'Casa não encontrada';
  };

  const despesasAgrupadas = despesas.reduce((acc, despesa) => {
    if (!acc[despesa.mes]) {
      acc[despesa.mes] = [];
    }
    acc[despesa.mes].push(despesa);
    return acc;
  }, {} as Record<string, Despesa[]>);

  const mesesOrdenados = Object.keys(despesasAgrupadas).sort().reverse();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Despesas Mensais</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Nova Despesa
          </button>
        )}
      </div>

      {showForm ? (
        <DespesaForm
          casas={casas}
          despesa={despesaEditando}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <div>
          {mesesOrdenados.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma despesa cadastrada ainda.</p>
            </div>
          ) : (
            mesesOrdenados.map(mes => (
              <div key={mes} className="despesas-mes">
                <h2>{formatMes(mes)}</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Valor Total</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasAgrupadas[mes].map(despesa => (
                        <tr key={despesa.id}>
                          <td>
                            {despesa.tipo === 'agua'
                              ? 'Água'
                              : despesa.tipo === 'luz'
                              ? 'Luz'
                              : 'Outras'}
                          </td>
                          <td>
                            {despesa.tipo === 'agua' && (
                              <>
                                Aplicado para todas as casas ativas
                                {(despesa as any).imagensComprovantes &&
                                  (despesa as any).imagensComprovantes.length > 0 && (
                                    <span style={{ marginLeft: '0.5rem', color: 'var(--primary-color)' }}>
                                      📷 {(despesa as any).imagensComprovantes.length} comprovante(s)
                                    </span>
                                  )}
                              </>
                            )}
                            {despesa.tipo === 'luz' && (
                              <>
                                {getCasaNome((despesa as any).casa1Id)} +{' '}
                                {getCasaNome((despesa as any).casa2Id)}
                                {(despesa as any).consumoKwhTotal &&
                                  ` (Total: ${(despesa as any).consumoKwhTotal} kWh)`}
                                {(despesa as any).consumoKwhPorCasa &&
                                  (despesa as any).consumoKwhPorCasa.length > 0 && (
                                    <>
                                      {' '}
                                      (
                                      {(despesa as any).consumoKwhPorCasa
                                        .map(
                                          (c: any) =>
                                            `${getCasaNome(c.casaId)}: ${c.kwh} kWh`
                                        )
                                        .join(', ')}
                                      )
                                    </>
                                  )}
                                {(despesa as any).imagensComprovantes &&
                                  (despesa as any).imagensComprovantes.length > 0 && (
                                    <span style={{ marginLeft: '0.5rem', color: 'var(--primary-color)' }}>
                                      📷 {(despesa as any).imagensComprovantes.length} comprovante(s)
                                    </span>
                                  )}
                              </>
                            )}
                            {despesa.tipo === 'outras' && (
                              <>
                                {getCasaNome((despesa as any).casaId)} -{' '}
                                {(despesa as any).descricao}
                              </>
                            )}
                          </td>
                          <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleEdit(despesa)}
                              style={{ marginRight: '0.5rem' }}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(despesa.id)}
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

