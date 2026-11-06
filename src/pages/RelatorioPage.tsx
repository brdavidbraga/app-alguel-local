import { useState } from 'react';
import { Casa, Despesa } from '../types';
import { storageService } from '../services/storage';
import { rateioService } from '../services/rateioService';

export function RelatorioPage() {
  const [casas] = useState<Casa[]>(() => storageService.getCasas());
  const [despesas] = useState<Despesa[]>(() => storageService.getDespesas());
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [casaSelecionada, setCasaSelecionada] = useState<string>('');

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

  const gerarRelatorio = () => {
    if (!casaSelecionada) {
      alert('Selecione uma casa');
      return null;
    }
    return rateioService.gerarRelatorioMensal(casaSelecionada, mes, casas, despesas);
  };

  const relatorio = casaSelecionada ? gerarRelatorio() : null;

  const casasAtivas = casas.filter(c => c.status === 'ativo');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Relatório Mensal</h1>
      </div>

      <div className="form-container" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <div className="form-group">
          <label htmlFor="mesRelatorio">Mês/Ano *</label>
          <input
            type="month"
            id="mesRelatorio"
            value={mes}
            onChange={e => setMes(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="casaRelatorio">Casa *</label>
          <select
            id="casaRelatorio"
            value={casaSelecionada}
            onChange={e => setCasaSelecionada(e.target.value)}
            required
          >
            <option value="">Selecione uma casa</option>
            {casasAtivas.map(casa => (
              <option key={casa.id} value={casa.id}>
                {casa.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {relatorio && (
        <div className="relatorio-container">
          <h2>
            Relatório - {relatorio.casaNome} - {formatMes(mes)}
          </h2>

          <div className="relatorio-section">
            <h3>Resumo</h3>
            <div className="relatorio-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Aluguel</td>
                    <td>R$ {relatorio.aluguel.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>
                      Água (Valor Total)
                    </td>
                    <td>R$ {relatorio.agua.valorTotalPorCasa.toFixed(2)}</td>
                  </tr>
                  {relatorio.luz && (() => {
                    const despesaLuz = despesas.find(
                      d =>
                        d.tipo === 'luz' &&
                        d.mes === mes &&
                        (('casa1Id' in d && d.casa1Id === relatorio.casaId) ||
                          ('casa2Id' in d && d.casa2Id === relatorio.casaId))
                    ) as any;
                    const isCasa1 = despesaLuz?.casa1Id === relatorio.casaId;
                    const valorPorCasa = isCasa1
                      ? relatorio.luz.valorPorCasa1
                      : relatorio.luz.valorPorCasa2;
                    const kwhTotal = despesaLuz?.consumoKwhTotal || 0;
                    const kwhCasa = (() => {
                      if (despesaLuz?.consumoKwhPorCasa) {
                        const consumo = despesaLuz.consumoKwhPorCasa.find((c: any) => c.casaId === relatorio.casaId);
                        return consumo?.kwh || 0;
                      }
                      return kwhTotal / 2; // Se não tiver por casa, divide 50/50
                    })();
                    return (
                      <tr>
                        <td>Luz (Valor Total)</td>
                        <td>
                          R$ {valorPorCasa.toFixed(2)}
                          {kwhCasa > 0 && ` (${kwhCasa.toFixed(2).replace(/\.?0+$/, '')} kWh)`}
                        </td>
                      </tr>
                    );
                  })()}
                  {relatorio.outrasDespesas.length > 0 &&
                    relatorio.outrasDespesas.map((item, index) => (
                      <tr key={index}>
                        <td>Outras: {item.descricao}</td>
                        <td>R$ {item.valor.toFixed(2)}</td>
                      </tr>
                    ))}
                  <tr className="total-row">
                    <td>
                      <strong>DESPESAS</strong>
                    </td>
                    <td>
                      <strong>R$ {relatorio.totalPorInquilino.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="relatorio-section">
            <h3>Detalhamento - Água</h3>
            <div className="relatorio-details">
              <p>
                <strong>Valor Total da Conta:</strong> R${' '}
                {(
                  despesas.find(
                    d => d.tipo === 'agua' && d.mes === mes
                  ) as any
                )?.valorTotal.toFixed(2) || '0.00'}
              </p>
              <p>
                <strong>Taxa Fixa por Casa:</strong> R${' '}
                {relatorio.agua.taxaFixaCasa.toFixed(2)} (aplicado para todas as casas ativas)
              </p>
              <p>
                <strong>Valor Restante Total:</strong> R${' '}
                {relatorio.agua.valorRestante.toFixed(2)}
              </p>
              <p>
                <strong>Total de Pessoas (todas as casas):</strong>{' '}
                {casas.filter(c => c.status === 'ativo').reduce((sum, c) => sum + c.quantidadePessoas, 0)}
              </p>
              <p>
                <strong>Quantidade de Pessoas nesta Casa:</strong>{' '}
                {casas.find(c => c.id === relatorio.casaId)?.quantidadePessoas}
              </p>
              <p>
                <strong>Valor por Pessoa (proporcional):</strong> R${' '}
                {relatorio.agua.valorPorPessoa.toFixed(2)}
              </p>
              <p>
                <strong>Valor Total por Casa:</strong> R${' '}
                {relatorio.agua.valorTotalPorCasa.toFixed(2)} (Taxa Fixa: R${' '}
                {relatorio.agua.taxaFixaCasa.toFixed(2)} + Rateio: R${' '}
                {(relatorio.agua.valorPorPessoa * (casas.find(c => c.id === relatorio.casaId)?.quantidadePessoas || 0)).toFixed(2)})
              </p>
            </div>

            {/* Imagens do comprovante de água */}
            {(() => {
              const despesaAgua = despesas.find(
                d => d.tipo === 'agua' && d.mes === mes
              ) as any;
              const imagensAgua = despesaAgua?.imagensComprovantes || [];
              
              if (imagensAgua.length > 0) {
                return (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Comprovantes da Conta de Água</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                      {imagensAgua.map((img: any) => (
                        <div key={img.id} style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              width: '100px',
                              height: '100px',
                              backgroundImage: `url(${img.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              border: '1px solid var(--border-color)',
                              margin: '0 auto',
                            }}
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer';
                              modal.onclick = () => document.body.removeChild(modal);
                              const imgEl = document.createElement('img');
                              imgEl.src = img.url;
                              imgEl.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain';
                              imgEl.onclick = (e) => e.stopPropagation();
                              modal.appendChild(imgEl);
                              document.body.appendChild(modal);
                            }}
                          />
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {img.nomeArquivo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {relatorio.luz && (
            <div className="relatorio-section">
              <h3>Detalhamento - Luz</h3>
              <div className="relatorio-details">
                <p>
                  <strong>Valor Total da Conta:</strong> R${' '}
                  {(
                    despesas.find(
                      d =>
                        d.tipo === 'luz' &&
                        d.mes === mes &&
                        (('casa1Id' in d && d.casa1Id === relatorio.casaId) ||
                          ('casa2Id' in d && d.casa2Id === relatorio.casaId))
                    ) as any
                  )?.valorTotal.toFixed(2) || '0.00'}
                </p>
                {(() => {
                  const despesaLuz = despesas.find(
                    d =>
                      d.tipo === 'luz' &&
                      d.mes === mes &&
                      (('casa1Id' in d && d.casa1Id === relatorio.casaId) ||
                        ('casa2Id' in d && d.casa2Id === relatorio.casaId))
                  ) as any;
                  const isCasa1 = despesaLuz?.casa1Id === relatorio.casaId;
                  const valorPorCasa = isCasa1
                    ? relatorio.luz.valorPorCasa1
                    : relatorio.luz.valorPorCasa2;
                  const temKwhPorCasa = despesaLuz?.consumoKwhPorCasa && despesaLuz.consumoKwhPorCasa.length > 0;
                  const kwhCasa = temKwhPorCasa
                    ? despesaLuz.consumoKwhPorCasa.find((c: any) => c.casaId === relatorio.casaId)?.kwh || 0
                    : 0;
                  const kwhTotal = despesaLuz?.consumoKwhTotal || 0;
                  
                  return (
                    <>
                      {temKwhPorCasa && kwhTotal > 0 ? (
                        <>
                          <p>
                            <strong>Consumo kWh desta Casa:</strong> {kwhCasa} kWh
                          </p>
                          <p>
                            <strong>Consumo kWh Total:</strong> {kwhTotal} kWh
                          </p>
                          <p>
                            <strong>Valor por kWh:</strong> R${' '}
                            {(despesaLuz.valorTotal / kwhTotal).toFixed(4)}
                          </p>
                          <p>
                            <strong>Valor por Casa (kWh da casa × valor por kWh):</strong> R${' '}
                            {valorPorCasa.toFixed(2)}
                          </p>
                        </>
                      ) : temKwhPorCasa ? (
                        <>
                          <p>
                            <strong>Consumo kWh desta Casa:</strong> {kwhCasa} kWh
                          </p>
                          <p>
                            <strong>Valor por Casa (proporcional ao consumo):</strong> R${' '}
                            {valorPorCasa.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>Valor por Casa (50% do total):</strong> R${' '}
                          {valorPorCasa.toFixed(2)}
                        </p>
                      )}
                    </>
                  );
                })()}
                <p>
                  <strong>Quantidade de Pessoas na Casa:</strong>{' '}
                  {casas.find(c => c.id === relatorio.casaId)?.quantidadePessoas}
                </p>
                <p>
                  <strong>Valor por Pessoa:</strong> R${' '}
                  {(() => {
                    const despesaLuz = despesas.find(
                      d =>
                        d.tipo === 'luz' &&
                        d.mes === mes &&
                        (('casa1Id' in d && d.casa1Id === relatorio.casaId) ||
                          ('casa2Id' in d && d.casa2Id === relatorio.casaId))
                    ) as any;
                    const isCasa1 = despesaLuz?.casa1Id === relatorio.casaId;
                    return (isCasa1
                      ? relatorio.luz.valorPorPessoaCasa1
                      : relatorio.luz.valorPorPessoaCasa2
                    ).toFixed(2);
                  })()}
                </p>
              </div>

              {/* Imagens do comprovante de luz e contador */}
              {(() => {
                const despesaLuz = despesas.find(
                  d =>
                    d.tipo === 'luz' &&
                    d.mes === mes &&
                    (('casa1Id' in d && d.casa1Id === relatorio.casaId) ||
                      ('casa2Id' in d && d.casa2Id === relatorio.casaId))
                ) as any;
                
                const imagensLuz = despesaLuz?.imagensComprovantes?.filter((img: any) => img.casaId === relatorio.casaId) || [];
                const imagemContador = despesaLuz?.imagemContador;
                
                if (imagensLuz.length > 0 || imagemContador) {
                  return (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Comprovantes da Conta de Luz</h4>
                      {imagensLuz.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            Comprovantes desta casa:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                            {imagensLuz.map((img: any) => (
                              <div key={img.id} style={{ textAlign: 'center' }}>
                                <div
                                  style={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundImage: `url(${img.url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-color)',
                                    margin: '0 auto',
                                  }}
                                  onClick={() => {
                                    const modal = document.createElement('div');
                                    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer';
                                    modal.onclick = () => document.body.removeChild(modal);
                                    const imgEl = document.createElement('img');
                                    imgEl.src = img.url;
                                    imgEl.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain';
                                    imgEl.onclick = (e) => e.stopPropagation();
                                    modal.appendChild(imgEl);
                                    document.body.appendChild(modal);
                                  }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  {img.nomeArquivo}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {imagemContador && (
                        <div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            Contador/Relógio de Luz:
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                width: '150px',
                                height: '150px',
                                backgroundImage: `url(${imagemContador.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                border: '1px solid var(--border-color)',
                                margin: '0 auto',
                              }}
                              onClick={() => {
                                const modal = document.createElement('div');
                                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer';
                                modal.onclick = () => document.body.removeChild(modal);
                                const imgEl = document.createElement('img');
                                imgEl.src = imagemContador.url;
                                imgEl.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain';
                                imgEl.onclick = (e) => e.stopPropagation();
                                modal.appendChild(imgEl);
                                document.body.appendChild(modal);
                              }}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {imagemContador.nomeArquivo}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

