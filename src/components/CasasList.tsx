import { Casa } from '../types';

interface CasasListProps {
  casas: Casa[];
  onEdit: (casa: Casa) => void;
  onDelete: (id: string) => void;
}

export function CasasList({ casas, onEdit, onDelete }: CasasListProps) {
  if (casas.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhuma casa cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Endereço</th>
            <th>Início Contrato</th>
            <th>Aluguel</th>
            <th>Pessoas</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {casas.map(casa => (
            <tr key={casa.id}>
              <td>{casa.nome}</td>
              <td>{casa.endereco || '-'}</td>
              <td>{new Date(casa.dataInicioContrato).toLocaleDateString('pt-BR')}</td>
              <td>R$ {casa.valorAluguel.toFixed(2)}</td>
              <td>{casa.quantidadePessoas}</td>
              <td>
                <span className={`status-badge ${casa.status}`}>
                  {casa.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => onEdit(casa)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta casa?')) {
                      onDelete(casa.id);
                    }
                  }}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





