import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { get } from '../../api/api';

interface Course {
  id: number;
  name: string;
  code: string;
  duration_years: number;
  department?: { name: string; faculty?: { name: string } };
}

type FieldErrors = Record<string, string[]>;

export function RegisterPage() {
  const { register, setAuthScreen } = useAuth();
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    student_number: '',
    course_id: '',
    current_year: '',
  });

  useEffect(() => {
    get<Course[]>('/public/courses')
      .then(setCourses)
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const fieldError = (k: string) =>
    fieldErrors[k]?.[0] ? <p className="form-error">{fieldErrors[k][0]}</p> : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      await register({
        ...form,
        course_id: Number(form.course_id),
        current_year: Number(form.current_year),
      });
    } catch (err: any) {
      if (err?.errors) setFieldErrors(err.errors);
      else setError(err?.message ?? 'Erro ao criar conta.');
    } finally {
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
          <h1>Criar Conta</h1>
          <p>Exclusivo para estagiários da UP Maputo</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">person</span>
              <input
                className="form-input"
                type="text"
                placeholder="João da Silva Macuácua"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>
            {fieldError('name')}
          </div>

          <div className="form-group">
            <label className="form-label">Email Institucional</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">badge</span>
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="joao@up.ac.mz"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>
            {fieldError('email')}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
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
              <label className="form-label">Confirmar Password</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nº de Estudante</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">tag</span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ex: 2021001"
                  value={form.student_number}
                  onChange={e => set('student_number', e.target.value)}
                  required
                />
              </div>
              {fieldError('student_number')}
            </div>

            <div className="form-group">
              <label className="form-label">Ano Actual</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">calendar_today</span>
                <select
                  className="form-select"
                  value={form.current_year}
                  onChange={e => set('current_year', e.target.value)}
                  required
                >
                  <option value="">-- Ano --</option>
                  {[1,2,3,4,5].map(y => (
                    <option key={y} value={y}>{y}º Ano</option>
                  ))}
                </select>
              </div>
              {fieldError('current_year')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Curso</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">school</span>
              <select
                className="form-select"
                value={form.course_id}
                onChange={e => set('course_id', e.target.value)}
                required
              >
                <option value="">-- Seleccionar curso --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.duration_years} anos)
                    {c.department?.faculty ? ` · ${c.department.faculty.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {fieldError('course_id')}
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            <span className="material-symbols-outlined">person_add</span>
            {loading ? 'A criar conta…' : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-switch">
          Já tem conta?{' '}
          <button type="button" className="auth-text-btn" onClick={() => setAuthScreen('login')}>
            Iniciar sessão
          </button>
        </p>
      </div>
    </div>
  );
}