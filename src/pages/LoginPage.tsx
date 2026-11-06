import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Credenciais padrão (em produção, isso deveria vir de um backend)
  const USUARIO_PADRAO = 'admin';
  const SENHA_PADRAO = 'admin123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!usuario || !senha) {
      setErro('Por favor, preencha todos os campos');
      return;
    }

    if (usuario === USUARIO_PADRAO && senha === SENHA_PADRAO) {
      // Salvar sessão
      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('usuarioNome', usuario);
      navigate('/dashboard');
    } else {
      setErro('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏠 Gestão de Casas</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario">Usuário</label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>
          {erro && <div className="error-message">{erro}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Entrar
          </button>
        </form>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p>Usuário padrão: <strong>admin</strong></p>
          <p>Senha padrão: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}

