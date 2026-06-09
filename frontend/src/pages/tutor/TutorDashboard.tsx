import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post } from '../../api/api';

/* ─── Tipos ─── */
interface InternshipData {
  id: number;
  student: {
    user: { name: string };
    student_number: string;
    course?: { code: string; name: string };
  };
  institution?: { name: string };
  period?: { name: string };
  status: string;
  tutor_evaluation?: {
    id: number;
    score: number;
    observations?: string;
    items?: { criteria: string; score: number }[];
  };
}

interface TutorDashboardData {
  internships: InternshipData[];
}

/* ─── Constantes ─── */
const CRITERIA = [
  'Conhecimentos Práticos',
  'Assiduidade',
  'Pontualidade',
  'Responsabilidade',
  'Iniciativa',
  'Relacionamento Interpessoal',
  'Capacidade de Aprendizagem',
  'Qualidade do Trabalho',
  'Criatividade',
  'Apresentação Pessoal',
];

/* ─── Utilitários ─── */
function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Spinner() {
  return (
    <div className="loading" role="status" aria-label="A carregar">
      <span className="spinner-icon material-symbols-outlined">progress_activity</span>
      <span>A carregar…</span>
    </div>
  );
}

function Alert({ type = 'error', children }: { type?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const icons = { error: 'error', success: 'check_circle', info: 'info' };
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    allocated: ['badge-blue', 'Alocado'],
    in_progress: ['badge-yellow', 'Em Progresso'],
    submitted: ['badge-purple', 'Submetido'],
    evaluated: ['badge-green', 'Avaliado'],
    completed: ['badge-green', 'Concluído'],
    pending: ['badge-yellow', 'Pendente'],
    approved: ['badge-green', 'Aprovado'],
    rejected: ['badge-red', 'Rejeitado'],
  };
  const [css, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${css}`}>{label}</span>;
}

/* ─── Componente principal ─── */
export default function TutorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [internships, setInternships] = useState<InternshipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de avaliação
  const [evalModal, setEvalModal] = useState<number | null>(null); // internship id
  const [criteriaScores, setCriteriaScores] = useState<number[]>(Array(10).fill(0));
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Carregar dados do tutor
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // O endpoint /dashboard, quando acedido por um tutor, deve devolver { internships: [...] }
      const res = await get<TutorDashboardData>('/dashboard');
      if (res.internships) {
        setInternships(res.internships);
      } else {
        setInternships([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar os estágios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Abrir modal de avaliação
  const openEval = (internshipId: number) => {
    const existing = internships.find(i => i.id === internshipId)?.tutor_evaluation;
    if (existing) {
      // pré‑preencher com valores existentes
      const scores = existing.items?.map(item => item.score) || Array(10).fill(0);
      setCriteriaScores(scores);
      setObservations(existing.observations || '');
    } else {
      setCriteriaScores(Array(10).fill(0));
      setObservations('');
    }
    setEvalModal(internshipId);
    setSuccessMsg('');
  };

  const closeEval = () => {
    setEvalModal(null);
  };

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...criteriaScores];
    const num = parseFloat(value);
    newScores[index] = isNaN(num) ? 0 : Math.min(20, Math.max(0, num));
    setCriteriaScores(newScores);
  };

  const handleSubmitEval = async () => {
    if (!evalModal) return;
    setSubmitting(true);
    try {
      const items = CRITERIA.map((criteria, i) => ({
        criteria,
        score: criteriaScores[i],
      }));
      await post(`/internships/${evalModal}/tutor-evaluation`, {
        observations,
        items,
      });
      setSuccessMsg('Avaliação registada com sucesso!');
      fetchData(); // recarregar a lista
      setTimeout(() => {
        closeEval();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Erro ao submeter avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Estatísticas
  const totalEstagios = internships.length;
  const avaliacoesConcluidas = internships.filter(i => i.tutor_evaluation).length;
  const mediaNotas = avaliacoesConcluidas
    ? (internships.reduce((sum, i) => sum + (i.tutor_evaluation?.score || 0), 0) / avaliacoesConcluidas).toFixed(1)
    : '—';

  if (loading) return <Spinner />;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Estágios UP</h1>
          <span>Tutor Externo</span>
        </div>
        <nav className="nav">
          <div className="nav-item active" role="button" tabIndex={0}>
            <span className="nav-icon material-symbols-outlined">group</span>
            <span>Os Meus Estagiários</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Tutor</div>
            </div>
            <button className="btn btn-secondary btn-sm logout-btn" onClick={handleLogout} title="Sair">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input className="search-input" placeholder="Pesquisar estagiário..." readOnly />
            </div>
          </div>
          <div className="header-right">
            <button className="notification-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="divider" />
            <div className="user-info" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>{initials(user?.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Tutor</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {error && <Alert>{error}</Alert>}

          {/* Estatísticas */}
          <div className="grid grid-3 mb-4">
            <div className="stat-card">
              <div className="stat-label">Estagiários Atribuídos</div>
              <div className="stat-value">{totalEstagios}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avaliações Concluídas</div>
              <div className="stat-value">{avaliacoesConcluidas} / {totalEstagios}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Média das Notas</div>
              <div className="stat-value">{mediaNotas}</div>
            </div>
          </div>

          {/* Tabela de estágios */}
          <div className="card">
            <div className="card-title">Estagiários sob a sua tutela</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Estudante</th>
                    <th>Curso</th>
                    <th>Estado</th>
                    <th>Nota (Tutor)</th>
                    <th className="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.length === 0 ? (
                    <tr><td colSpan={5} className="text-center">Nenhum estágio atribuído.</td></tr>
                  ) : (
                    internships.map(intern => (
                      <tr key={intern.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(intern.student.user.name)}</div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{intern.student.user.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{intern.student.student_number}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{intern.student.course?.code || intern.student.course?.name || '—'}</td>
                        <td><Badge status={intern.status} /></td>
                        <td>
                          {intern.tutor_evaluation ? (
                            <span className={`badge ${intern.tutor_evaluation.score >= 10 ? 'badge-green' : 'badge-red'}`}>
                              {intern.tutor_evaluation.score}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button className="btn btn-sm btn-primary" onClick={() => openEval(intern.id)}>
                            {intern.tutor_evaluation ? 'Ver / Editar' : 'Avaliar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Modal de avaliação ─── */}
        {evalModal && (
          <div className="modal-overlay" onClick={closeEval}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh', overflowY: 'auto' }}>
              <h3>Avaliação do Estagiário</h3>
              {successMsg && <Alert type="success">{successMsg}</Alert>}

              <div className="form-group">
                <label className="form-label">Critérios (0‑20)</label>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Critério</th>
                        <th style={{ width: 80 }}>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CRITERIA.map((criterio, i) => (
                        <tr key={i}>
                          <td>{criterio}</td>
                          <td>
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={criteriaScores[i]}
                              onChange={e => handleScoreChange(i, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 600 }}>
                        <td>Média</td>
                        <td>
                          {(criteriaScores.reduce((a, b) => a + b, 0) / 10).toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Comentários adicionais..."
                />
              </div>

              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={closeEval}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmitEval} disabled={submitting}>
                  {submitting ? 'A submeter…' : 'Submeter Avaliação'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}