// src/pages/supervisor/SupervisorDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, storageUrl } from '../../api/api';

/* ─── Tipos ─── */
interface Estagio {
  id: number;
  student: {
    id: number;
    user: { name: string };
    student_number: string;
    course?: { code: string; name: string };
  };
  institution?: { name: string };
  status: string;
  nota_final?: number | null;
}

interface DevelopmentPlan {
  id: number;
  title: string;
  file_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
}

interface ActivityPlan {
  id: number;
  file_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
}

interface Journal {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface PortfolioStatus {
  portfolio?: {
    id: number;
    status: string;
    documents: { id: number; document_type: string; file_url?: string | null }[];
  };
  missing_documents: string[];
  is_complete: boolean;
}

/* ─── Utilitários ─── */
function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  type View = 'dashboard' | 'planos' | 'diarios' | 'portfolio' | 'avaliacao';
  const [view, setView] = useState<View>('dashboard');

  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');

  // Planos
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>([]);
  const [actPlans, setActPlans] = useState<ActivityPlan[]>([]);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewType, setReviewType] = useState<'dev' | 'act'>('dev');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Diários
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  // Portfólio
  const [portfolio, setPortfolio] = useState<PortfolioStatus | null>(null);

  // Avaliação
  const [nota, setNota] = useState('');
  const [obs, setObs] = useState('');
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [notaSalva, setNotaSalva] = useState(false);

  const fetchEstagios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await get<{ students: Estagio[] }>('/dashboard');
      setEstagios(res.students || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar estágios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEstagios(); }, []);

  // Ao selecionar um estágio, carregar planos, diários e portfólio
  useEffect(() => {
    if (!selectedId) return;
    get<DevelopmentPlan[]>(`/internships/${selectedId}/development-plans`)
      .then(setDevPlans)
      .catch(() => setDevPlans([]));
    get<ActivityPlan[]>(`/internships/${selectedId}/activity-plans`)
      .then(setActPlans)
      .catch(() => setActPlans([]));
    get<Journal[]>(`/internships/${selectedId}/journals`)
      .then(setJournals)
      .catch(() => setJournals([]));
    // Portfólio (carrega sempre que o estágio muda)
    get<PortfolioStatus>(`/internships/${selectedId}/portfolio`)
      .then(setPortfolio)
      .catch(() => setPortfolio(null));
    setNota('');
    setObs('');
    setNotaSalva(false);
  }, [selectedId]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const selecionarEstagiario = (id: number, nome: string) => {
    setSelectedId(id);
    setSelectedName(nome);
    setView('planos');
  };

  const abrirRevisao = (id: number, tipo: 'dev' | 'act') => {
    setReviewingId(id);
    setReviewType(tipo);
    setReviewComment('');
  };

  const handleRevisar = async (status: 'approved' | 'rejected') => {
    if (!reviewingId) return;
    setReviewing(true);
    try {
      const endpoint = reviewType === 'dev'
        ? `/development-plans/${reviewingId}/review`
        : `/activity-plans/${reviewingId}/review`;
      await patch(endpoint, { status, comment: reviewComment });
      if (reviewType === 'dev') {
        const p = await get<DevelopmentPlan[]>(`/internships/${selectedId}/development-plans`);
        setDevPlans(p);
      } else {
        const p = await get<ActivityPlan[]>(`/internships/${selectedId}/activity-plans`);
        setActPlans(p);
      }
      setReviewingId(null);
    } catch (err: any) {
      alert(err?.message || 'Erro ao revisar.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSubmeterAvaliacao = async () => {
    if (!selectedId || !nota) return;
    setSalvandoNota(true);
    try {
      await post(`/internships/${selectedId}/supervisor-evaluation`, {
        score: Number(nota),
        observations: obs,
      });
      setNotaSalva(true);
      alert('Avaliação registada com sucesso!');
      fetchEstagios();
    } catch (err: any) {
      alert(err?.message || 'Erro ao registar avaliação.');
    } finally {
      setSalvandoNota(false);
    }
  };

  const pendentes = estagios.filter(e => e.status === 'in_progress').length;
  const notasLancadas = estagios.filter(e => e.nota_final != null).length;

  if (loading) return <Spinner />;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Estágios UP</h1>
          <span>Supervisor</span>
        </div>
        <nav className="nav">
          {[
            ['dashboard', 'dashboard', 'Painel'],
            ['planos', 'assignment', 'Planos'],
            ['diarios', 'book', 'Diários'],
            ['portfolio', 'folder', 'Portefólio'],
            ['avaliacao', 'grading', 'Avaliação'],
          ].map(([key, icon, label]) => (
            <div
              key={key}
              className={`nav-item ${view === key ? 'active' : ''}`}
              onClick={() => {
                setView(key as View);
                if (key !== 'dashboard' && !selectedId && estagios.length > 0) {
                  const first = estagios[0];
                  selecionarEstagiario(first.id, first.student.user.name);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="nav-icon material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Supervisor</div>
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
              <input className="search-input" placeholder="Pesquisar estagiário..." />
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
                <div style={{ fontSize: 10, opacity: 0.8 }}>Supervisor</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {error && <Alert>{error}</Alert>}

          {/* ─── Dashboard ─── */}
          {view === 'dashboard' && (
            <>
              <div className="page-title">Os Meus Estagiários</div>
              <div className="page-subtitle">Gestão de estágios e documentos</div>

              <div className="grid grid-3 mb-4">
                <div className="stat-card">
                  <div className="stat-label">Estágios Activos</div>
                  <div className="stat-value">{estagios.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pendências</div>
                  <div className="stat-value">{pendentes}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Notas Lançadas</div>
                  <div className="stat-value">{notasLancadas}</div>
                </div>
              </div>

              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Estudante</th>
                        <th>Instituição</th>
                        <th>Estado</th>
                        <th>Nota Final</th>
                        <th className="text-right">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estagios.map(e => (
                        <tr key={e.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(e.student.user.name)}</div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{e.student.user.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.student.student_number}</div>
                              </div>
                            </div>
                          </td>
                          <td>{e.institution?.name || '—'}</td>
                          <td><Badge status={e.status} /></td>
                          <td>
                            {e.nota_final != null ? (
                              <span className={`badge ${e.nota_final >= 10 ? 'badge-green' : 'badge-red'}`}>
                                {e.nota_final}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>—</span>
                            )}
                          </td>
                          <td className="text-right">
                            <button className="btn btn-sm btn-primary" onClick={() => selecionarEstagiario(e.id, e.student.user.name)}>
                              Gerir
                            </button>
                            <button className="btn btn-sm btn-secondary ml-2" onClick={() => navigate(`/internships/${e.id}`)}>
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                      {estagios.length === 0 && (
                        <tr><td colSpan={5} className="text-center">Nenhum estágio atribuído.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ─── Planos ─── */}
          {view === 'planos' && selectedId && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Planos de {selectedName}</div>
                  <div className="page-subtitle">Aprovar ou rejeitar documentos</div>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="card">
                  <div className="card-title">Plano de Desenvolvimento (PDI)</div>
                  {devPlans.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum plano submetido.</p>}
                  {devPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong>{p.title}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('pt-PT') : '—'}
                        </div>
                        <Badge status={p.status} />
                        {p.file_url && (
                          <a href={storageUrl(p.file_url)} target="_blank" className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>
                            Download
                          </a>
                        )}
                      </div>
                      {p.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => abrirRevisao(p.id, 'dev')}>Revisar</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-title">Plano de Actividades</div>
                  {actPlans.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum plano submetido.</p>}
                  {actPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('pt-PT') : '—'}
                        </div>
                        <Badge status={p.status} />
                        {p.file_url && (
                          <a href={storageUrl(p.file_url)} target="_blank" className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>
                            Download
                          </a>
                        )}
                      </div>
                      {p.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => abrirRevisao(p.id, 'act')}>Revisar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Diários ─── */}
          {view === 'diarios' && selectedId && (
            <div>
              <div className="page-title">Diários de {selectedName}</div>
              <div className="page-subtitle">Leitura dos diários reflexivos</div>
              <div className="grid grid-2">
                <div className="card" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {journals.map(j => (
                    <div
                      key={j.id}
                      className="flex justify-between items-center"
                      style={{ padding: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setSelectedJournal(j)}
                    >
                      <div>
                        <strong>{j.title}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {new Date(j.created_at).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: 'var(--muted)' }}>chevron_right</span>
                    </div>
                  ))}
                  {journals.length === 0 && <p style={{ padding: '12px', color: 'var(--muted)' }}>Nenhum diário.</p>}
                </div>
                {selectedJournal && (
                  <div className="card">
                    <h4>{selectedJournal.title}</h4>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                      {new Date(selectedJournal.created_at).toLocaleDateString('pt-PT')}
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedJournal.content}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Portefólio ─── */}
          {view === 'portfolio' && selectedId && (
            <div>
              <div className="page-title">Portefólio de {selectedName}</div>
              <div className="page-subtitle">Documentos submetidos pelo estudante</div>
              {portfolio?.portfolio ? (
                <div className="card">
                  <div className="mb-4">
                    <div className="stat-label">Estado</div>
                    <Badge status={portfolio.portfolio.status || 'pending'} />
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Documento</th>
                          <th className="text-right">Download</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.portfolio.documents.map(doc => (
                          <tr key={doc.id}>
                            <td>{doc.document_type.replace(/_/g, ' ')}</td>
                            <td className="text-right">
                              {doc.file_url ? (
                                <a href={storageUrl(doc.file_url)} target="_blank" className="btn btn-sm btn-secondary">Download</a>
                              ) : (
                                <span style={{ color: 'var(--muted)' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {portfolio.portfolio.documents.length === 0 && (
                          <tr><td colSpan={2} className="text-center">Nenhum documento.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--muted)' }}>Portefólio ainda não iniciado.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Avaliação ─── */}
          {view === 'avaliacao' && selectedId && (
            <div>
              <div className="page-title">Avaliação de {selectedName}</div>
              <div className="page-subtitle">Registar nota final do estágio (0-20)</div>
              <div className="card" style={{ maxWidth: 500 }}>
                {notaSalva ? (
                  <Alert type="success">Avaliação registada com sucesso!</Alert>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nota</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                        placeholder="Ex: 15.5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observações</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={obs}
                        onChange={e => setObs(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleSubmeterAvaliacao} disabled={salvandoNota}>
                      {salvandoNota ? 'A submeter…' : 'Submeter Avaliação'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!selectedId && view !== 'dashboard' && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--muted)' }}>Selecione um estagiário na aba Painel para começar.</p>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modal de Revisão ─── */}
      {reviewingId && (
        <div className="modal-overlay" onClick={() => setReviewingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>Revisar {reviewType === 'dev' ? 'PDI' : 'Plano de Actividades'}</h3>
            <div className="form-group">
              <label className="form-label">Comentário</label>
              <textarea className="form-textarea" rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
            </div>
            <div className="modal-buttons">
              <button className="btn btn-danger" onClick={() => handleRevisar('rejected')} disabled={reviewing}>Rejeitar</button>
              <button className="btn btn-primary" onClick={() => handleRevisar('approved')} disabled={reviewing}>Aprovar</button>
              <button className="btn btn-secondary" onClick={() => setReviewingId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}