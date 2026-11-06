import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { CasasPage } from './pages/CasasPage';
import { DespesasPage } from './pages/DespesasPage';
import { RelatorioPage } from './pages/RelatorioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContadorKwhPage } from './pages/ContadorKwhPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuarioNome = localStorage.getItem('usuarioNome') || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('usuarioNome');
    navigate('/login');
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo-container">
          <div className="nav-logo-icon">🏠</div>
          <h1 className="nav-logo">GestãoCasa</h1>
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
          <li style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            <span style={{ color: 'var(--text-secondary)' }}>
              {usuarioNome}
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Sair
            </button>
          </li>
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


