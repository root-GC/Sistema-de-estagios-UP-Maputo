import { useEffect, useState } from 'react';
import { get, post } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';

interface Document {
  id: number;
  document_type: string;
}

interface PortfolioStatus {
  portfolio?: {
    status: string;
    documents: Document[];
  };
}

interface Internship {
  id: number;
}

const REQUIRED = ['development_plan', 'activity_plan', 'journal', 'final_report'];

export function Portfolio() {
  const [internship, setInternship] = useState<Internship | null>(null);
  const [status, setStatus] = useState<PortfolioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    get<{ internship: Internship | null }>('/dashboard')
      .then(async d => {
        if (d.internship) {
          setInternship(d.internship);
          const s = await get<PortfolioStatus>(`/internships/${d.internship.id}/portfolio`);
          setStatus(s);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const addDoc = async (type: string) => {
    if (!internship) return;
    const fakePath = `uploads/${type}_${Date.now()}.pdf`;
    try {
      const r = await post(`/internships/${internship.id}/portfolio/document`, {
        document_type: type,
        file_path: fakePath,
      });
      setStatus(s => ({ ...s!, ...r }));
      setMsg(`Documento "${type}" adicionado.`);
    } catch (err: any) {
      setError(err.message || 'Erro');
    }
  };

  const submit = async () => {
    if (!internship) return;
    setSubmitting(true);
    setError('');
    try {
      await post(`/internships/${internship.id}/portfolio/submit`, {});
      setMsg('Portefólio submetido com sucesso!');
      const s = await get<PortfolioStatus>(`/internships/${internship.id}/portfolio`);
      setStatus(s);
    } catch (err: any) {
      setError(err.message || 'Erro');
      if (err.missing_documents) {
        setError(`Documentos em falta: ${err.missing_documents.join(', ')}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!internship) return <Alert type="info">Sem estágio atribuído.</Alert>;

  const present = status?.portfolio?.documents?.map(d => d.document_type) || [];
  const missing = REQUIRED.filter(r => !present.includes(r));
  const complete = missing.length === 0;

  return (
    <div>
      <div className="page-title">Portefólio</div>
      <div className="page-subtitle">
        RF-010 — Submissão do portefólio final (todos os documentos obrigatórios)
      </div>

      {msg && <Alert type="success">{msg}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Documentos Obrigatórios</div>
          {REQUIRED.map(doc => {
            const done = present.includes(doc);
            return (
              <div
                key={doc}
                className="flex items-center justify-between"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <span style={{ marginRight: 8 }}>{done ? '✅' : '⬜'}</span>
                  <span style={{ fontSize: 13 }}>{doc.replace(/_/g, ' ')}</span>
                </div>
                {!done && (
                  <button className="btn btn-secondary btn-sm" onClick={() => addDoc(doc)}>
                    + Simular upload
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-title">Submissão</div>

          <div style={{ marginBottom: 16 }}>
            <div className="stat-label">Estado do Portefólio</div>
            <div className="mt-2">
              <Badge status={status?.portfolio?.status || 'pending'} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="stat-label">Documentos</div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontWeight: 700,
                  color: complete ? 'var(--green)' : 'var(--yellow)',
                }}
              >
                {present.length}/{REQUIRED.length}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>
                completos
              </span>
            </div>
            <div className="progress-bar mt-2">
              <div
                className="progress-fill"
                style={{ width: `${(present.length / REQUIRED.length) * 100}%` }}
              />
            </div>
          </div>

          {!complete && (
            <Alert type="info">Faltam: {missing.join(', ')}</Alert>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!complete || submitting || status?.portfolio?.status === 'submitted'}
            onClick={submit}
          >
            {submitting
              ? 'A submeter…'
              : status?.portfolio?.status === 'submitted'
              ? '✓ Já Submetido'
              : 'Submeter Portefólio'}
          </button>
        </div>
      </div>
    </div>
  );
}