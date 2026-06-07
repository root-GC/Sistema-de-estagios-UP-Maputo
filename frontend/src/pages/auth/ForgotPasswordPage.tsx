import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { post } from '../../api/api';

export function ForgotPasswordPage() {
  const { setAuthScreen } = useAuth();
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await post('/auth/forgot-password', { email });
    } catch {} finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>school</span>
          </div>
          <h1>Recuperar Password</h1>
          <p>Receberá um link no seu email registado</p>
        </div>

        {sent ? (
          <>
            <div className="alert alert-success">
              Se o email <strong>{email}</strong> estiver registado, receberá em breve um link para redefinir a password.
              Verifique também a pasta de spam.
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              <span className="material-symbols-outlined">refresh</span>
              Tentar com outro email
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">mail</span>
                <input
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  placeholder="o-seu-email@up.ac.mz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary btn-block" disabled={loading}>
              <span className="material-symbols-outlined">forward_to_inbox</span>
              {loading ? 'A enviar…' : 'Enviar Link de Recuperação'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <button type="button" className="auth-text-btn" onClick={() => setAuthScreen('login')}>
            ← Voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
}