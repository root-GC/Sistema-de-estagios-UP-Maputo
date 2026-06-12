// src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { login, setAuthScreen } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message ?? 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>school</span>
          </div>
          <h1>Iniciar Sessão</h1>
          <p>Acesso ao sistema de estágios</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">mail</span>
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="utilizador@up.ac.mz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">lock</span>
              <input
                className="form-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-link-row">
            <button type="button" className="auth-text-btn" onClick={() => setAuthScreen('forgot')}>
              Esqueci a password
            </button>
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            <span className="material-symbols-outlined">login</span>
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>

        <p className="auth-switch">
          É estudante e não tem conta?{' '}
          <button type="button" className="auth-text-btn" onClick={() => setAuthScreen('register')}>
            Registar-se
          </button>
        </p>
      </div>
    </div>
  );
}