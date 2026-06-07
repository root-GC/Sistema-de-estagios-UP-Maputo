import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { get, post, patch } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { initials } from '../../utils/helpers';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { name: string }[];
  status: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    get<{ data: User[] }>('/users')
      .then(r => setUsers(r.data || []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await post('/users', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'student' });
      load();
    } catch (err: any) {
      setError(err.errors ? Object.values(err.errors).flat().join(', ') : err.message || 'Erro ao criar utilizador.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: User) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    await patch(`/users/${u.id}`, { status: newStatus });
    setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, status: newStatus } : x)));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Gestão de Utilizadores</div>
          <div className="page-subtitle">Criar, listar e gerir contas do sistema</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined">{showForm ? 'close' : 'person_add'}</span>
          {showForm ? 'Cancelar' : 'Novo Utilizador'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ maxWidth: 560 }}>
          {error && <Alert type="error">{error}</Alert>}
          <form onSubmit={save}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">person</span>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome do utilizador"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">mail</span>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@up.ac.mz"
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
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mín. 8 caracteres"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Perfil (Role)</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">badge</span>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  >
                    {['admin', 'dept_head', 'coordinator', 'supervisor', 'student', 'tutor'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary btn-block" disabled={saving}>
                <span className="material-symbols-outlined">save</span>
                {saving ? 'A criar…' : 'Criar Utilizador'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfis</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acções</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {initials(u.name)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {u.roles?.map(r => (
                        <span key={r.name} className="badge badge-blue" style={{ fontSize: 10 }}>
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge status={u.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.status === 'active' ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle' }}>info</span>
                    {' '}Nenhum utilizador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}