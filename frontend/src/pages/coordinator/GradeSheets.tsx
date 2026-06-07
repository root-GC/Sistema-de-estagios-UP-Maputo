import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { get, post } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

interface GradeSheet {
  id: number;
  course?: { name: string };
  course_id: number;
  period?: { academic_year: string };
  period_id: number;
  generated_by?: { name: string };
  items?: any[];
}

interface Period {
  id: number;
  name: string;
  academic_year: string;
}

export function GradeSheets() {
  const [sheets, setSheets] = useState<GradeSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<{ periods: Period[] } | null>(null);
  const [form, setForm] = useState({ course_id: '', period_id: '' });
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    get<GradeSheet[]>('/grade-sheets').then(setSheets).catch(() => {});
    get<{ periods: Period[] }>('/dashboard').then(setDashData).finally(() => setLoading(false));
  }, []);

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setMsg('');
    try {
      const s = await post<GradeSheet>('/grade-sheets', {
        course_id: Number(form.course_id),
        period_id: Number(form.period_id),
      });
      setSheets(prev => [s, ...prev]);
      setMsg('Pauta gerada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro');
    } finally {
      setGenerating(false);
    }
  };

  const exportSigeup = async (id: number) => {
    setExporting(id);
    try {
      const r = await post<{ filename: string }>(`/grade-sheets/${id}/export`, {});
      setMsg(`Exportação SIGEUP: ${r.filename}`);
    } catch (err: any) {
      setError(err.message || 'Erro');
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-title">Pautas de Estágio</div>
      <div className="page-subtitle">RF-013 / RF-014 — Geração e exportação para SIGEUP</div>

      {msg && <Alert type="success">{msg}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Gerar Nova Pauta</div>
          <form onSubmit={generate}>
            <div className="form-group">
              <label className="form-label">ID do Curso</label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 1"
                value={form.course_id}
                onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">ID do Período</label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 1"
                value={form.period_id}
                onChange={e => setForm(f => ({ ...f, period_id: e.target.value }))}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={generating}>
              {generating ? 'A gerar…' : 'Gerar Pauta'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Períodos Disponíveis</div>
          {dashData?.periods.map(p => (
            <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', marginRight: 8 }}>#{p.id}</span>
              {p.name} — {p.academic_year}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Pautas Geradas</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Curso</th>
                <th>Período</th>
                <th>Gerado Por</th>
                <th>Itens</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sheets.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--mono)' }}>#{s.id}</td>
                  <td>{s.course?.name || s.course_id}</td>
                  <td>{s.period?.academic_year || s.period_id}</td>
                  <td>{s.generated_by?.name || '—'}</td>
                  <td>{s.items?.length ?? '—'}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => exportSigeup(s.id)}
                      disabled={exporting === s.id}
                    >
                      {exporting === s.id ? '…' : '⬇ SIGEUP'}
                    </button>
                  </td>
                </tr>
              ))}
              {sheets.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    Nenhuma pauta gerada.
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