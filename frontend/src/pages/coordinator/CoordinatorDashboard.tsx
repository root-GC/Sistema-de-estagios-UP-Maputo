import { useEffect, useState } from 'react';
import { get } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

interface Supervisor {
  id: number;
  user?: { name: string };
  academic_rank?: string;
  active_students: number;
}

interface Institution {
  id: number;
  name: string;
  tutors_count: number;
}

interface DashboardData {
  total: number;
  by_status: Record<string, number>;
  supervisors: Supervisor[];
  institutions: Institution[];
}

export function CoordinatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<DashboardData>('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <div>
      <div className="page-title">Dashboard do Coordenador</div>
      <div className="page-subtitle">Gestão de estágios do curso</div>

      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="stat-label">Total Estágios</div>
          <div className="stat-value">{data.total}</div>
        </div>
        {Object.entries(data.by_status || {}).map(([s, n]) => (
          <div key={s} className="stat-card">
            <div className="stat-label">{s}</div>
            <div className="stat-value">{n}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Supervisores</div>
          {data.supervisors.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <div style={{ fontSize: 13 }}>{s.user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.academic_rank}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{s.active_students}/5</div>
                <div className="progress-bar" style={{ width: 60, marginTop: 4 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${(s.active_students / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Instituições Parceiras</div>
          {data.institutions.map(i => (
            <div
              key={i.id}
              className="flex items-center justify-between"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ fontSize: 13 }}>{i.name}</div>
              <span className="badge badge-blue">{i.tutors_count} tutores</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}