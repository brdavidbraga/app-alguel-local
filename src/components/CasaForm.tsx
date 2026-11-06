import { useState, useEffect } from 'react';
import { Casa } from '../types';

interface CasaFormProps {
  casa?: Casa;
  onSave: (casa: Casa) => void;
  onCancel: () => void;
}

export function CasaForm({ casa, onSave, onCancel }: CasaFormProps) {
  const [formData, setFormData] = useState<Omit<Casa, 'id'>>({
    nome: '',
    endereco: '',
    dataInicioContrato: new Date().toISOString().split('T')[0],
    valorAluguel: 0,
    quantidadePessoas: 1,
    status: 'ativo',
  });

  useEffect(() => {
    if (casa) {
      setFormData({
        nome: casa.nome,
        endereco: casa.endereco || '',
        dataInicioContrato: casa.dataInicioContrato,
        valorAluguel: casa.valorAluguel,
        quantidadePessoas: casa.quantidadePessoas,
        status: casa.status,
      });
    }
  }, [casa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const casaToSave: Casa = {
      ...formData,
      id: casa?.id || crypto.randomUUID(),
      endereco: formData.endereco || undefined,
    };
    onSave(casaToSave);
  };

  return (
    <div className="form-container">
      <h2>{casa ? 'Editar Casa' : 'Nova Casa'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nome">Nome ou Identificação *</label>
          <input
            type="text"
            id="nome"
            value={formData.nome}
            onChange={e => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endereco">Endereço</label>
          <input
            type="text"
            id="endereco"
            value={formData.endereco}
            onChange={e => setFormData({ ...formData, endereco: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataInicioContrato">Data de Início do Contrato *</label>
          <input
            type="date"
            id="dataInicioContrato"
            value={formData.dataInicioContrato}
            onChange={e =>
              setFormData({ ...formData, dataInicioContrato: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="valorAluguel">Valor do Aluguel (R$) *</label>
          <input
            type="number"
            id="valorAluguel"
            step="0.01"
            min="0"
            value={formData.valorAluguel}
            onChange={e =>
              setFormData({ ...formData, valorAluguel: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantidadePessoas">Quantidade de Pessoas *</label>
          <input
            type="number"
            id="quantidadePessoas"
            min="1"
            value={formData.quantidadePessoas}
            onChange={e =>
              setFormData({
                ...formData,
                quantidadePessoas: parseInt(e.target.value) || 1,
              })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            value={formData.status}
            onChange={e =>
              setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })
            }
            required
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}





