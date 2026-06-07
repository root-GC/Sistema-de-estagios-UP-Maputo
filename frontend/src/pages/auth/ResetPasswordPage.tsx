import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { post } from '../../api/api';

type FieldErrors = Record<string, string[]>;

export function ResetPasswordPage() {
  const { setAuthScreen } = useAuth();
  const params   = new URLSearchParams(window.location.search);
  const urlToken = params.get('token') ?? '';
  const urlEmail = params.get('email') ?? '';

  const [form, setForm] = useState({
    token:                 urlToken,
    email:                 urlEmail,
    password:              '',
    password_confirmation: '',
  });

  const [done, setDone]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const fieldError = (k: string) =>
    fieldErrors[k]?.[0] ? <p className="form-error">{fieldErrors[k][0]}</p> : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('As passwords não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      await post('/auth/reset-password', form);
      setDone(true);
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      if (err?.errors) setFieldErrors(err.errors);
      else setError(err?.message ?? 'Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="auth-box">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>school</span>
            </div>
            <h1>Password Redefinida</h1>
          </div>
          <div className="alert alert-success">
            Password redefinida com sucesso! Pode iniciar sessão com a nova password.
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setAuthScreen('login')}>
            <span className="material-symbols-outlined">login</span>
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>school</span>
          </div>
          <h1>Nova Password</h1>
          <p>Escolha uma password segura</p>
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
                value={form.email}
                onChange={e => set('email', e.target.value)}
                readOnly={!!urlEmail}
                style={{ opacity: urlEmail ? 0.6 : 1 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nova Password</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">lock</span>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
              />
            </div>
            {fieldError('password')}
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Nova Password</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">lock_reset</span>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password_confirmation}
                onChange={e => set('password_confirmation', e.target.value)}
                required
              />
            </div>
          </div>

          {!urlToken && (
            <div className="form-group">
              <label className="form-label">Token (do link recebido por email)</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">key</span>
                <input
                  className="form-input"
                  type="text"
                  value={form.token}
                  onChange={e => set('token', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={loading}>
            <span className="material-symbols-outlined">save</span>
            {loading ? 'A redefinir…' : 'Redefinir Password'}
          </button>
        </form>

        <p className="auth-switch">
          <button type="button" className="auth-text-btn" onClick={() => setAuthScreen('login')}>
            ← Cancelar e voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
}