import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';

interface Internship {
  id: number;
  student?: { user?: { name: string }; student_number: string; course?: { code: string } };
  supervisor?: { user?: { name: string } };
  institution?: { name: string };
  status: string;
  result?: { final_score: number; approved: boolean };
}

export function InternshipList() {
  const [list, setList] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    get<Internship[]>('/internships')
      .then(setList)
      .catch(e => setError(e.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-title">Estágios</div>
      <div className="page-subtitle">Lista de todos os estágios do curso</div>

      {error && <Alert>{error}</Alert>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Nº</th>
                <th>Curso</th>
                <th>Supervisor</th>
                <th>Instituição</th>
                <th>Estado</th>
                <th>Nota</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500 }}>{i.student?.user?.name}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    {i.student?.student_number}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{i.student?.course?.code}</td>
                  <td>{i.supervisor?.user?.name || '—'}</td>
                  <td>{i.institution?.name || '—'}</td>
                  <td>
                    <Badge status={i.status} />
                  </td>
                  <td>
                    {i.result?.final_score ? (
                      <span className={`badge ${i.result.approved ? 'badge-green' : 'badge-red'}`}>
                        {i.result.final_score}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/internships/${i.id}`)}
                    >
                      Detalhe
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