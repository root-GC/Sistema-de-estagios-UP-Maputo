import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { get, post } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

interface Tutor {
  id: number;
  name: string;
  position: string;
}

interface Institution {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tutors?: Tutor[];
}

export function Institutions() {
  const [list, setList] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    get<Institution[]>('/institutions')
      .then(setList)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await post('/institutions', form);
      setShowForm(false);
      setForm({ name: '', address: '', phone: '', email: '' });
      load();
    } catch (err: any) {
      setError(err.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Instituições Parceiras</div>
          <div className="page-subtitle">RF-001 — Gestão de parceiros e pontos focais</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nova Instituição'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          {error && <Alert>{error}</Alert>}
          <form onSubmit={save}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-3">
        {list.map(i => (
          <div key={i.id} className="card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{i.name}</div>
            {i.email && <div style={{ fontSize: 12, color: 'var(--muted)' }}>✉ {i.email}</div>}
            {i.phone && <div style={{ fontSize: 12, color: 'var(--muted)' }}>📞 {i.phone}</div>}
            {i.address && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>📍 {i.address}</div>
            )}
            <div style={{ marginTop: 12 }}>
              {(i.tutors || []).map(t => (
                <div
                  key={t.id}
                  style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}
                >
                  {t.name} <span style={{ color: 'var(--muted)' }}>· {t.position}</span>
                </div>
              ))}
              {(!i.tutors || i.tutors.length === 0) && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sem tutores registados</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}