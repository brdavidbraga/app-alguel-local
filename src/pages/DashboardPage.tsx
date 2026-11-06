import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Casa, Despesa } from '../types';
import { storageService } from '../services/storage';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const [casas] = useState<Casa[]>(() => storageService.getCasas());
  const [despesas] = useState<Despesa[]>(() => storageService.getDespesas());

  const formatMes = (mes: string) => {
    const [ano, mesNum] = mes.split('-');
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    return `${meses[parseInt(mesNum) - 1]}/${ano}`;
  };

  const getCasaNome = (casaId: string) => {
    const casa = casas.find(c => c.id === casaId);
    return casa?.nome || 'Casa não encontrada';
  };

  const estatisticas = useMemo(() => {
    const casasAtivas = casas.filter(c => c.status === 'ativo');
    const totalMoradores = casasAtivas.reduce((sum, c) => sum + c.quantidadePessoas, 0);
    const totalAlugueis = casasAtivas.reduce((sum, c) => sum + c.valorAluguel, 0);

    // Últimos 3 meses de água
    const despesasAgua = despesas
      .filter(d => d.tipo === 'agua')
      .sort((a, b) => b.mes.localeCompare(a.mes))
      .slice(0, 3)
      .map(d => ({
        mes: d.mes,
        valor: (d as any).valorTotal,
      }));

    // Últimos 3 meses de luz (identificando como Conta 1 e Conta 2)
    const despesasLuz = despesas
      .filter(d => d.tipo === 'luz')
      .sort((a, b) => b.mes.localeCompare(a.mes))
      .slice(0, 3)
      .map((d) => {
        const despesaLuz = d as any;
        return {
          mes: d.mes,
          conta1: {
            casas: `${getCasaNome(despesaLuz.casa1Id)} + ${getCasaNome(despesaLuz.casa2Id)}`,
            valor: despesaLuz.valorTotal,
            kwh: despesaLuz.consumoKwhTotal || 0,
          },
        };
      });

    const despesasOutras = despesas.filter(d => d.tipo === 'outras').length;

    return {
      casasAtivas: casasAtivas.length,
      totalMoradores,
      totalAlugueis,
      despesasAgua,
      despesasLuz,
      despesasOutras,
    };
  }, [casas, despesas]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Visão geral da gestão de casas</p>
        </div>
        <div className="dashboard-actions">
          <button
            onClick={() => navigate('/casas')}
            className="btn-dashboard btn-primary-dashboard"
          >
            <span>+</span> Nova Casa
          </button>
          <button
            onClick={() => navigate('/despesas')}
            className="btn-dashboard btn-secondary-dashboard"
          >
            <span>$</span> Lançar Despesa
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <h3>Casas Ativas</h3>
              <p className="stat-value">{estatisticas.casasAtivas}</p>
              <Link to="/casas" className="stat-link">Ver detalhes →</Link>
            </div>
            <div className="stat-icon stat-icon-green">🏠</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <h3>Total de Moradores</h3>
              <p className="stat-value">{estatisticas.totalMoradores}</p>
            </div>
            <div className="stat-icon stat-icon-orange">👥</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <h3>Total em Aluguéis</h3>
              <p className="stat-value">R$ {estatisticas.totalAlugueis.toFixed(2)}</p>
            </div>
            <div className="stat-icon stat-icon-green">💰</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Despesas Cadastradas</h2>
          
          {/* Água - Últimos 3 meses */}
          <div className="expense-type-item" style={{ marginBottom: '1rem' }}>
            <span className="expense-icon expense-icon-blue">💧</span>
            <div style={{ flex: 1 }}>
              <strong>Água</strong>
              {estatisticas.despesasAgua.length > 0 ? (
                <div style={{ marginTop: '0.5rem' }}>
                  {estatisticas.despesasAgua.map((agua, idx) => (
                    <div key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {formatMes(agua.mes)}: R$ {agua.valor.toFixed(2)}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                  Nenhuma despesa cadastrada
                </p>
              )}
            </div>
          </div>

          {/* Luz - Últimos 3 meses */}
          <div className="expense-type-item" style={{ marginBottom: '1rem' }}>
            <span className="expense-icon expense-icon-yellow">⚡</span>
            <div style={{ flex: 1 }}>
              <strong>Luz</strong>
              {estatisticas.despesasLuz.length > 0 ? (
                <div style={{ marginTop: '0.5rem' }}>
                  {estatisticas.despesasLuz.map((luz, idx) => (
                    <div key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <strong>Conta {idx + 1}</strong> ({formatMes(luz.mes)}): {luz.conta1.casas} - R$ {luz.conta1.valor.toFixed(2)}
                      {luz.conta1.kwh > 0 && ` (${luz.conta1.kwh.toFixed(2)} kWh)`}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                  Nenhuma despesa cadastrada
                </p>
              )}
            </div>
          </div>

          {/* Outras */}
          <div className="expense-type-item">
            <span className="expense-icon expense-icon-green">💵</span>
            <div>
              <strong>Outras</strong>
              <p>{estatisticas.despesasOutras} despesa(s)</p>
            </div>
          </div>

          <Link to="/despesas" className="section-link" style={{ marginTop: '1rem', display: 'block' }}>
            Gerenciar Despesas →
          </Link>
        </div>

        <div className="dashboard-section">
          <h2>Ações Rápidas</h2>
          <div className="quick-actions">
            <Link to="/casas" className="quick-action-item">
              <span className="quick-action-icon">🏠</span>
              <span>Cadastrar Nova Casa</span>
            </Link>
            <Link to="/despesas" className="quick-action-item">
              <span className="quick-action-icon">💧</span>
              <span>Lançar Conta de Água</span>
            </Link>
            <Link to="/despesas" className="quick-action-item">
              <span className="quick-action-icon">⚡</span>
              <span>Lançar Conta de Luz</span>
            </Link>
            <Link to="/relatorio" className="quick-action-item">
              <span className="quick-action-icon">📊</span>
              <span>Ver Relatório Mensal</span>
            </Link>
          </div>
        </div>
      </div>

      {estatisticas.casasAtivas === 0 && (
        <div className="empty-dashboard">
          <div className="empty-icon">🏠</div>
          <p>Nenhuma casa cadastrada</p>
        </div>
      )}
    </div>
  );
}

