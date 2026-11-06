import { useState } from 'react';
import { ImagemComprovante } from '../types';

interface ImageUploadProps {
  casaId: string;
  despesaId: string;
  imagensExistentes?: ImagemComprovante[];
  onImagesChange: (imagens: ImagemComprovante[]) => void;
}

export function ImageUpload({
  casaId,
  imagensExistentes = [],
  onImagesChange,
}: ImageUploadProps) {
  const [imagens, setImagens] = useState<ImagemComprovante[]>(imagensExistentes);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const novaImagem: ImagemComprovante = {
          id: crypto.randomUUID(),
          casaId,
          url: reader.result as string,
          nomeArquivo: file.name,
          dataUpload: new Date().toISOString(),
        };

        const novasImagens = [...imagens, novaImagem];
        setImagens(novasImagens);
        onImagesChange(novasImagens);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (id: string) => {
    const novasImagens = imagens.filter(img => img.id !== id);
    setImagens(novasImagens);
    onImagesChange(novasImagens);
  };

  const handlePreview = (url: string) => {
    setPreview(url);
  };

  return (
    <div className="image-upload-container">
      <div className="form-group">
        <label>Comprovantes da Conta de Luz</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ marginTop: '0.5rem' }}
        />
        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
          Você pode fazer upload de múltiplas imagens (comprovantes, prints, etc.)
        </small>
      </div>

      {imagens.length > 0 && (
        <div className="images-grid" style={{ marginTop: '1rem' }}>
          {imagens.map(imagem => (
            <div key={imagem.id} className="image-item">
              <div
                className="image-preview"
                onClick={() => handlePreview(imagem.url)}
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundImage: `url(${imagem.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {imagem.nomeArquivo}
              </div>
              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={() => handleRemove(imagem.id)}
                style={{ marginTop: '0.25rem', width: '100%' }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="image-modal"
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setPreview(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}




