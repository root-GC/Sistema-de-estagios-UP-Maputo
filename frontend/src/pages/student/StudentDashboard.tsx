import { useEffect, useState } from 'react';
import { get } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';

interface Internship {
  id: number;
  period?: { name: string };
  status: string;
  supervisor?: { user?: { name: string } };
  tutor?: { name: string };
  institution?: { name: string };
  result?: { final_score: number; tutor_score: number; supervisor_score: number; approved: boolean };
  development_plans?: { id: number; title: string; status: string }[];
  portfolio?: { id: number; status: string; documents: { id: number; document_type: string }[] };
}

interface DashboardData {
  internship: Internship | null;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<DashboardData>('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const int = data.internship;
  if (!int) {
    return (
      <div>
        <div className="page-title">Bem-vindo, {user?.name}</div>
        <Alert type="info">
          Ainda não tem estágio atribuído. Aguarde a alocação pelo coordenador.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">O Meu Estágio</div>
      <div className="page-subtitle">{int.period?.name}</div>

      <div className="grid grid-3 mb-4">
        <div className="stat-card">
          <div className="stat-label">Estado</div>
          <div className="mt-2">
            <Badge status={int.status} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Supervisor</div>
          <div style={{ marginTop: 6, fontWeight: 500 }}>
            {int.supervisor?.user?.name || '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tutor</div>
          <div style={{ marginTop: 6, fontWeight: 500 }}>
            {int.tutor?.name || 'Não atribuído'}
          </div>
          {int.tutor && (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{int.institution?.name}</div>
          )}
        </div>
      </div>

      {int.result && (
        <div className="card mb-4">
          <div className="card-title">Resultado Final</div>
          <div className="flex gap-4 items-center">
            <div className={`score-display ${int.result.approved ? 'approved' : 'failed'}`}>
              {int.result.final_score}
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Tutor: {int.result.tutor_score}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Supervisor: {int.result.supervisor_score}
              </div>
              <Badge status={int.result.approved ? 'approved' : 'rejected'} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">PDI / Plano de Actividades</div>
          {(int.development_plans || []).map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ fontSize: 13 }}>{p.title}</div>
              <Badge status={p.status} />
            </div>
          ))}
          {int.development_plans?.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum PDI submetido.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Portefólio</div>
          {int.portfolio ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 13 }}>Estado:</span>
                <Badge status={int.portfolio.status} />
              </div>
              {(int.portfolio.documents || []).map(d => (
                <div key={d.id} style={{ fontSize: 12, color: 'var(--green)', padding: '3px 0' }}>
                  ✓ {d.document_type}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Portefólio não iniciado.</p>
          )}
        </div>
      </div>
    </div>
  );
}