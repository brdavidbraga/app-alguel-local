import { useState } from 'react';
import { Casa } from '../types';
import { storageService } from '../services/storage';
import { CasaForm } from '../components/CasaForm';
import { CasasList } from '../components/CasasList';

export function CasasPage() {
  const [casas, setCasas] = useState<Casa[]>(() => storageService.getCasas());
  const [editingCasa, setEditingCasa] = useState<Casa | undefined>();
  const [showForm, setShowForm] = useState(false);

  const handleSave = (casa: Casa) => {
    let updatedCasas: Casa[];
    if (editingCasa) {
      updatedCasas = casas.map(c => (c.id === casa.id ? casa : c));
    } else {
      updatedCasas = [...casas, casa];
    }
    setCasas(updatedCasas);
    storageService.saveCasas(updatedCasas);
    setShowForm(false);
    setEditingCasa(undefined);
  };

  const handleEdit = (casa: Casa) => {
    setEditingCasa(casa);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updatedCasas = casas.filter(c => c.id !== id);
    setCasas(updatedCasas);
    storageService.saveCasas(updatedCasas);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCasa(undefined);
  };

  const handleNew = () => {
    setEditingCasa(undefined);
    setShowForm(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cadastro de Casas</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleNew}>
            Nova Casa
          </button>
        )}
      </div>

      {showForm ? (
        <CasaForm
          casa={editingCasa}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <CasasList casas={casas} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}





