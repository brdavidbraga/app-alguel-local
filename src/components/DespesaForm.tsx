import { useState, useEffect } from 'react';
import { Casa, Despesa, DespesaAgua, DespesaLuz, DespesaOutras, ConsumoKwhPorCasa, ImagemComprovante } from '../types';
import { ImageUpload } from './ImageUpload';

interface DespesaFormProps {
  casas: Casa[];
  despesa?: Despesa;
  onSave: (despesa: Despesa) => void;
  onCancel: () => void;
}

export function DespesaForm({ casas, despesa: despesaEditando, onSave, onCancel }: DespesaFormProps) {
  const [tipo, setTipo] = useState<'agua' | 'luz' | 'outras'>(
    despesaEditando?.tipo || 'agua'
  );
  const [mes, setMes] = useState(
    despesaEditando?.mes || new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Água
  const [valorAgua, setValorAgua] = useState(
    despesaEditando?.tipo === 'agua' ? (despesaEditando as DespesaAgua).valorTotal : 0
  );
  const [imagensAgua, setImagensAgua] = useState<ImagemComprovante[]>(() => {
    if (despesaEditando?.tipo === 'agua' && (despesaEditando as DespesaAgua).imagensComprovantes) {
      return (despesaEditando as DespesaAgua).imagensComprovantes || [];
    }
    return [];
  });

  // Luz
  const [parSelecionado, setParSelecionado] = useState<string>('');
  const [casa1IdLuz, setCasa1IdLuz] = useState(
    despesaEditando?.tipo === 'luz' ? (despesaEditando as DespesaLuz).casa1Id : ''
  );
  const [casa2IdLuz, setCasa2IdLuz] = useState(
    despesaEditando?.tipo === 'luz' ? (despesaEditando as DespesaLuz).casa2Id : ''
  );
  const [valorLuz, setValorLuz] = useState(
    despesaEditando?.tipo === 'luz' ? (despesaEditando as DespesaLuz).valorTotal : 0
  );
  const [consumoKwhTotal, setConsumoKwhTotal] = useState<number | undefined>(
    despesaEditando?.tipo === 'luz' ? (despesaEditando as DespesaLuz).consumoKwhTotal : undefined
  );
  const [usarKwhPorCasa, setUsarKwhPorCasa] = useState(
    despesaEditando?.tipo === 'luz' && (despesaEditando as DespesaLuz).consumoKwhPorCasa ? true : false
  );
  const [kwhPorCasa, setKwhPorCasa] = useState<Record<string, number>>(() => {
    if (despesaEditando?.tipo === 'luz' && (despesaEditando as DespesaLuz).consumoKwhPorCasa) {
      const kwh: Record<string, number> = {};
      (despesaEditando as DespesaLuz).consumoKwhPorCasa?.forEach(c => {
        kwh[c.casaId] = c.kwh;
      });
      return kwh;
    }
    return {};
  });
  
  // Imagens dos comprovantes por casa
  const [imagensCasa1, setImagensCasa1] = useState<ImagemComprovante[]>(() => {
    if (despesaEditando?.tipo === 'luz') {
      const despesaLuz = despesaEditando as DespesaLuz;
      if (despesaLuz.imagensComprovantes && despesaLuz.casa1Id) {
        return despesaLuz.imagensComprovantes.filter(img => img.casaId === despesaLuz.casa1Id);
      }
    }
    return [];
  });
  const [imagensCasa2, setImagensCasa2] = useState<ImagemComprovante[]>(() => {
    if (despesaEditando?.tipo === 'luz') {
      const despesaLuz = despesaEditando as DespesaLuz;
      if (despesaLuz.imagensComprovantes && despesaLuz.casa2Id) {
        return despesaLuz.imagensComprovantes.filter(img => img.casaId === despesaLuz.casa2Id);
      }
    }
    return [];
  });
  
  // Imagem do contador de luz
  const [imagemContador, setImagemContador] = useState<ImagemComprovante | null>(() => {
    if (despesaEditando?.tipo === 'luz' && (despesaEditando as DespesaLuz).imagemContador) {
      return (despesaEditando as DespesaLuz).imagemContador || null;
    }
    return null;
  });

  // Ordenar todas as casas por nome (ativas e inativas)
  const todasCasasOrdenadas = [...casas].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );
  
  // Gerar pares disponíveis (considerando todas as casas, não apenas ativas)
  const paresDisponiveis = (() => {
    const pares: { id: string; casa1: Casa; casa2: Casa; label: string }[] = [];
    for (let i = 0; i < todasCasasOrdenadas.length; i += 2) {
      if (i + 1 < todasCasasOrdenadas.length) {
        const casa1 = todasCasasOrdenadas[i];
        const casa2 = todasCasasOrdenadas[i + 1];
        pares.push({
          id: `par-${i}`,
          casa1,
          casa2,
          label: `${casa1.nome} - ${casa2.nome}${casa1.status === 'inativo' || casa2.status === 'inativo' ? ' (alguma inativa)' : ''}`,
        });
      }
    }
    return pares;
  })();
  
  // Quando estiver editando, encontrar o par selecionado
  useEffect(() => {
    if (despesaEditando?.tipo === 'luz' && casa1IdLuz && casa2IdLuz && paresDisponiveis.length > 0) {
      const par = paresDisponiveis.find(
        p => 
          (p.casa1.id === casa1IdLuz && p.casa2.id === casa2IdLuz) ||
          (p.casa1.id === casa2IdLuz && p.casa2.id === casa1IdLuz)
      );
      if (par) {
        setParSelecionado(par.id);
      }
    }
  }, [despesaEditando, casa1IdLuz, casa2IdLuz]);
  
  // Quando selecionar um par, atualizar as casas
  useEffect(() => {
    if (parSelecionado && tipo === 'luz') {
      const par = paresDisponiveis.find(p => p.id === parSelecionado);
      if (par) {
        setCasa1IdLuz(par.casa1.id);
        setCasa2IdLuz(par.casa2.id);
        setKwhPorCasa(prev => ({
          ...prev,
          [par.casa1.id]: prev[par.casa1.id] || 0,
          [par.casa2.id]: prev[par.casa2.id] || 0,
        }));
      }
    }
  }, [parSelecionado, tipo, paresDisponiveis]);

  // Outras
  const [casaIdOutras, setCasaIdOutras] = useState('');
  const [descricaoOutras, setDescricaoOutras] = useState('');
  const [valorOutras, setValorOutras] = useState(0);
  const [tipoRateioOutras, setTipoRateioOutras] = useState<'por-pessoa' | 'fixo-casa'>(
    'por-pessoa'
  );


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipo === 'agua') {
      // Água aplica para todas as casas ativas
      const despesa: DespesaAgua = {
        id: despesaEditando?.id || crypto.randomUUID(),
        tipo: 'agua',
        mes,
        valorTotal: valorAgua,
        imagensComprovantes: imagensAgua.length > 0 ? imagensAgua : undefined,
      };
      onSave(despesa);
    } else if (tipo === 'luz') {
      // Selecionar par específico
      if (!parSelecionado || !casa1IdLuz || !casa2IdLuz) {
        alert('Selecione um par de casas');
        return;
      }

      const consumoKwhPorCasaArray: ConsumoKwhPorCasa[] | undefined = usarKwhPorCasa
        ? [
            { casaId: casa1IdLuz, kwh: kwhPorCasa[casa1IdLuz] || 0 },
            { casaId: casa2IdLuz, kwh: kwhPorCasa[casa2IdLuz] || 0 },
          ]
        : undefined;

      if (usarKwhPorCasa && (!kwhPorCasa[casa1IdLuz] && !kwhPorCasa[casa2IdLuz])) {
        alert('Informe o consumo kWh para pelo menos uma das casas');
        return;
      }

        // Combinar todas as imagens
        const todasImagens = [...imagensCasa1, ...imagensCasa2];

        const despesa: DespesaLuz = {
          id: despesaEditando?.id || crypto.randomUUID(),
          tipo: 'luz',
          casa1Id: casa1IdLuz,
          casa2Id: casa2IdLuz,
          mes,
          valorTotal: valorLuz,
          consumoKwhTotal: consumoKwhTotal,
          consumoKwhPorCasa: consumoKwhPorCasaArray,
          imagensComprovantes: todasImagens.length > 0 ? todasImagens : undefined,
          imagemContador: imagemContador || undefined,
        };
        onSave(despesa);
    } else {
      if (!casaIdOutras || !descricaoOutras) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
      const despesa: DespesaOutras = {
        id: despesaEditando?.id || crypto.randomUUID(),
        tipo: 'outras',
        casaId: casaIdOutras,
        mes,
        descricao: descricaoOutras,
        valorTotal: valorOutras,
        tipoRateio: tipoRateioOutras,
      };
      onSave(despesa);
    }
  };

  return (
    <div className="form-container">
      <h2>{despesaEditando ? 'Editar Despesa' : 'Nova Despesa'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tipo">Tipo de Despesa *</label>
          <select
            id="tipo"
            value={tipo}
            onChange={e => setTipo(e.target.value as 'agua' | 'luz' | 'outras')}
            required
          >
            <option value="agua">Água</option>
            <option value="luz">Luz</option>
            <option value="outras">Outras Despesas</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="mes">Mês/Ano *</label>
          <input
            type="month"
            id="mes"
            value={mes}
            onChange={e => setMes(e.target.value)}
            required
          />
        </div>

        {tipo === 'agua' && (
          <>
            <div className="form-group">
              <label htmlFor="valorAgua">Valor Total da Conta de Água (R$) *</label>
              <input
                type="number"
                id="valorAgua"
                step="0.01"
                min="0"
                value={valorAgua}
                onChange={e => setValorAgua(parseFloat(e.target.value) || 0)}
                required
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                O valor será aplicado para todas as casas ativas ({casas.filter(c => c.status === 'ativo').length} casa(s)).
                Taxa fixa de R$ 38,00 por casa + rateio do restante por pessoa.
              </small>
            </div>

            {/* Upload de imagens da conta de água */}
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Comprovante da Conta de Água</h3>
              <ImageUpload
                casaId="agua-geral"
                despesaId={despesaEditando?.id || ''}
                imagensExistentes={imagensAgua}
                onImagesChange={setImagensAgua}
              />
            </div>
          </>
        )}

        {tipo === 'luz' && (
          <>
            {paresDisponiveis.length === 0 ? (
              <div className="form-group">
                <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.375rem', color: '#991b1b' }}>
                  É necessário pelo menos 2 casas cadastradas para criar pares.
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="parSelecionado">Selecione o Par de Casas *</label>
                  <select
                    id="parSelecionado"
                    value={parSelecionado}
                    onChange={e => setParSelecionado(e.target.value)}
                    required
                  >
                    <option value="">Selecione um par</option>
                    {paresDisponiveis.map((par, index) => (
                      <option key={par.id} value={par.id}>
                        Par {index + 1}: {par.casa1.nome} - {par.casa2.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {parSelecionado && casa1IdLuz && casa2IdLuz && (
                  <div className="form-group">
                    <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.375rem' }}>
                      <strong>Par selecionado:</strong> {casas.find(c => c.id === casa1IdLuz)?.nome} + {casas.find(c => c.id === casa2IdLuz)?.nome}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="valorLuz">Valor Total da Conta de Luz (R$) *</label>
                  <input
                    type="number"
                    id="valorLuz"
                    step="0.01"
                    min="0"
                    value={valorLuz}
                    onChange={e => setValorLuz(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="consumoKwhTotal">Consumo Total (kWh) - Opcional</label>
                  <input
                    type="number"
                    id="consumoKwhTotal"
                    step="0.01"
                    min="0"
                    value={consumoKwhTotal || ''}
                    onChange={e =>
                      setConsumoKwhTotal(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                    Se informado, será usado para calcular o valor por kWh e ratear proporcionalmente.
                  </small>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={usarKwhPorCasa}
                      onChange={e => setUsarKwhPorCasa(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Informar consumo kWh por cada casa
                  </label>
                </div>

                {usarKwhPorCasa && casa1IdLuz && casa2IdLuz && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                          {casas.find(c => c.id === casa1IdLuz)?.nome} (kWh):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={kwhPorCasa[casa1IdLuz] || ''}
                          onChange={e =>
                            setKwhPorCasa({
                              ...kwhPorCasa,
                              [casa1IdLuz]: parseFloat(e.target.value) || 0,
                            })
                          }
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                          {casas.find(c => c.id === casa2IdLuz)?.nome} (kWh):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={kwhPorCasa[casa2IdLuz] || ''}
                          onChange={e =>
                            setKwhPorCasa({
                              ...kwhPorCasa,
                              [casa2IdLuz]: parseFloat(e.target.value) || 0,
                            })
                          }
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                    </div>
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                      O valor será rateado proporcionalmente ao consumo de cada casa.
                    </small>
                  </div>
                )}

                {/* Upload de imagens por casa */}
                {casa1IdLuz && casa2IdLuz && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Comprovantes da Conta de Luz</h3>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {casas.find(c => c.id === casa1IdLuz)?.nome}
                      </h4>
                      <ImageUpload
                        casaId={casa1IdLuz}
                        despesaId={despesaEditando?.id || ''}
                        imagensExistentes={imagensCasa1}
                        onImagesChange={setImagensCasa1}
                      />
                    </div>

                    <div>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {casas.find(c => c.id === casa2IdLuz)?.nome}
                      </h4>
                      <ImageUpload
                        casaId={casa2IdLuz}
                        despesaId={despesaEditando?.id || ''}
                        imagensExistentes={imagensCasa2}
                        onImagesChange={setImagensCasa2}
                      />
                    </div>

                    {/* Upload de imagem do contador de luz */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Contador/Relógio de Luz
                      </h4>
                      <div className="form-group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const novaImagem: ImagemComprovante = {
                                  id: crypto.randomUUID(),
                                  casaId: 'contador-luz',
                                  url: reader.result as string,
                                  nomeArquivo: file.name,
                                  dataUpload: new Date().toISOString(),
                                };
                                setImagemContador(novaImagem);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {imagemContador && (
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  backgroundImage: `url(${imagemContador.url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  border: '1px solid var(--border-color)',
                                }}
                                onClick={() => {
                                  const modal = document.createElement('div');
                                  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer';
                                  modal.onclick = () => document.body.removeChild(modal);
                                  const img = document.createElement('img');
                                  img.src = imagemContador.url;
                                  img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain';
                                  img.onclick = e => e.stopPropagation();
                                  modal.appendChild(img);
                                  document.body.appendChild(modal);
                                }}
                              />
                              <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                  {imagemContador.nomeArquivo}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-small btn-danger"
                                  onClick={() => setImagemContador(null)}
                                  style={{ marginTop: '0.5rem' }}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tipo === 'outras' && (
          <>
            <div className="form-group">
              <label htmlFor="casaIdOutras">Casa *</label>
              <select
                id="casaIdOutras"
                value={casaIdOutras}
                onChange={e => setCasaIdOutras(e.target.value)}
                required
              >
                <option value="">Selecione uma casa</option>
                {casas.filter(c => c.status === 'ativo').map(casa => (
                  <option key={casa.id} value={casa.id}>
                    {casa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="descricaoOutras">Descrição *</label>
              <input
                type="text"
                id="descricaoOutras"
                value={descricaoOutras}
                onChange={e => setDescricaoOutras(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="valorOutras">Valor Total (R$) *</label>
              <input
                type="number"
                id="valorOutras"
                step="0.01"
                min="0"
                value={valorOutras}
                onChange={e => setValorOutras(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipoRateioOutras">Tipo de Rateio *</label>
              <select
                id="tipoRateioOutras"
                value={tipoRateioOutras}
                onChange={e =>
                  setTipoRateioOutras(e.target.value as 'por-pessoa' | 'fixo-casa')
                }
                required
              >
                <option value="por-pessoa">Dividido igualmente por pessoa</option>
                <option value="fixo-casa">Valor fixo por casa</option>
              </select>
            </div>
          </>
        )}

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

