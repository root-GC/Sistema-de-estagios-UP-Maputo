import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { get, post } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

interface Journal {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface Internship {
  id: number;
}

export function Journals() {
  const { user } = useAuth();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    get<{ internship: Internship | null }>('/dashboard')
      .then(d => {
        if (d.internship) {
          setInternship(d.internship);
          return get<Journal[]>(`/internships/${d.internship.id}/journals`);
        }
      })
      .then(j => j && setJournals(j))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setSaving(true);
    setError('');
    try {
      const j = await post<Journal>(`/internships/${internship.id}/journals`, form);
      setJournals(jl => [j, ...jl]);
      setForm({ title: '', content: '' });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (!internship) return <Alert type="info">Sem estágio atribuído.</Alert>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Diários Reflexivos</div>
          <div className="page-subtitle">RF-007 — Registo das actividades no sector laboral</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Diário'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          {error && <Alert>{error}</Alert>}
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input
                className="form-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Ex: Semana 1 — Integração"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Conteúdo</label>
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                placeholder="Descreva as actividades, sentimentos e impressões…"
                rows={5}
              />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar Diário'}
            </button>
          </form>
        </div>
      )}

      <div className="grid" style={{ gap: 12 }}>
        {journals.map(j => (
          <div key={j.id} className="card">
            <div className="flex justify-between items-center mb-2">
              <div style={{ fontWeight: 600 }}>{j.title}</div>
              <div
                style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}
              >
                {new Date(j.created_at).toLocaleDateString('pt-PT')}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{j.content}</p>
          </div>
        ))}
        {journals.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
            Nenhum diário registado ainda.
          </div>
        )}
      </div>
    </div>
  );
}