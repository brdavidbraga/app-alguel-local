import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CasasPage } from './pages/CasasPage';
import { DespesasPage } from './pages/DespesasPage';
import { RelatorioPage } from './pages/RelatorioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContadorKwhPage } from './pages/ContadorKwhPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo-container">
          <div className="nav-logo-icon">🏠</div>
          <h1 className="nav-logo">Gestão de Aluguel</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <Link
              to="/dashboard"
              className={location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/casas"
              className={location.pathname === '/casas' ? 'active' : ''}
            >
              Casas
            </Link>
          </li>
          <li>
            <Link
              to="/despesas"
              className={location.pathname === '/despesas' ? 'active' : ''}
            >
              Despesas
            </Link>
          </li>
          <li>
            <Link
              to="/contador-kwh"
              className={location.pathname === '/contador-kwh' ? 'active' : ''}
            >
              Contador kWh
            </Link>
          </li>
          <li>
            <Link
              to="/relatorio"
              className={location.pathname === '/relatorio' ? 'active' : ''}
            >
              Relatórios
            </Link>
          </li>
          <li>
            <Link
              to="/configuracoes"
              className={location.pathname === '/configuracoes' ? 'active' : ''}
            >
              Configurações
            </Link>
          </li>
          <li style={{ marginLeft: 'auto' }}><ThemeToggle /></li>
        </ul>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <>
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/casas" element={<CasasPage />} />
          <Route path="/despesas" element={<DespesasPage />} />
          <Route path="/contador-kwh" element={<ContadorKwhPage />} />
          <Route path="/relatorio" element={<RelatorioPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;


