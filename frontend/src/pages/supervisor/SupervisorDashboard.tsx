import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

interface Student {
  id: number;
  student?: {
    user?: { name: string };
    student_number: string;
    course?: { code: string };
  };
  status: string;
  result?: { final_score: number; approved: boolean };
}

interface DashboardData {
  active_count: number;
  can_accept_more: boolean;
  students: Student[];
}

export function SupervisorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    get<DashboardData>('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <div>
      <div className="page-title">Os Meus Estagiários</div>
      <div className="page-subtitle">
        {data.active_count}/5 estudantes activos
        {!data.can_accept_more && (
          <span style={{ color: 'var(--red)', marginLeft: 8 }}>· Limite atingido</span>
        )}
      </div>

      <div className="grid grid-3 mb-4">
        <div className="stat-card">
          <div className="stat-label">Estagiários Activos</div>
          <div className="stat-value">{data.active_count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Capacidade</div>
          <div
            className="stat-value"
            style={{ color: data.can_accept_more ? 'var(--green)' : 'var(--red)' }}
          >
            {data.can_accept_more ? 'Disponível' : 'Completo'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avaliados</div>
          <div className="stat-value">{data.students.filter(s => s.result).length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Curso</th>
                <th>Estado</th>
                <th>Nota Final</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.student?.user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {s.student?.student_number}
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{s.student?.course?.code}</td>
                  <td>
                    <Badge status={s.status} />
                  </td>
                  <td>
                    {s.result ? (
                      <span
                        className={`score-display ${s.result.approved ? 'approved' : 'failed'}`}
                        style={{ fontSize: 18 }}
                      >
                        {s.result.final_score}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/internships/${s.id}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}