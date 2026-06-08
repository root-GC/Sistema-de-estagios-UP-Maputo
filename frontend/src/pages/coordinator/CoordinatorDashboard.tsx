import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, del } from '../../api/api';

/* ─── Tipos ─── */
interface Student {
  id: number;
  name: string;
  email?: string;
  student_number: string;
  current_year: number;
  course?: { id: number; name: string; code: string };
}

interface RequisicaoEstagio {
  id: number;
  student: Student;
  empresas_pretendidas?: string[];   // nomes das empresas que o estudante indicou
  status: 'pendente' | 'aprovada' | 'rejeitada';
  supervisor_id?: number | null;
  supervisor?: { id: number; name: string };
  period_id?: number;
  period?: { name: string; academic_year: string };
}

interface Supervisor {
  id: number;
  name: string;
  email: string;
  department?: { name: string };
  academic_rank?: string;
  estagiarios_count?: number;   // número de alunos já atribuídos
}

interface Carta {
  id: number;
  internship_id: number;
  file_path: string;
  generated_at: string;
  student_name?: string;
}

interface Avaliacao {
  id: number;
  student_name: string;
  nota: string;
  estado: string;
}

/* ─── Utilitários ─── */
function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Componentes internos ─── */
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
    pendente:  ['badge-yellow', 'Pendente'],
    aprovada:  ['badge-green', 'Aprovada'],
    rejeitada: ['badge-red', 'Rejeitada'],
    active:    ['badge-green', 'Activo'],
    inactive:  ['badge-muted', 'Inactivo'],
  };
  const [css, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${css}`}>{label}</span>;
}

/* ─── Componente principal ─── */
export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Abas
  type View = 'dashboard' | 'requisicoes' | 'supervisores' | 'cartas' | 'pauta' | 'sigeup';
  const [view, setView] = useState<View>('dashboard');
  const [search, setSearch] = useState('');

  // Dados
  const [requisicoes, setRequisicoes] = useState<RequisicaoEstagio[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de criação de supervisor
  const [showSupModal, setShowSupModal] = useState(false);
  const [supForm, setSupForm] = useState({ name: '', email: '', academic_rank: '', department_id: '' });
  const [supSubmitting, setSupSubmitting] = useState(false);
  const [supError, setSupError] = useState('');

  // Modal de alocação (aprovar + escolher supervisor)
  const [allocReq, setAllocReq] = useState<RequisicaoEstagio | null>(null);
  const [allocSupervisorId, setAllocSupervisorId] = useState<number | string>('');

  // Fetch principal
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, supRes] = await Promise.all([
        get<{ data: RequisicaoEstagio[] }>('/internships?status=pendente,aprovada'),
        get<{ data: Supervisor[] }>('/users?role=supervisor'),
      ]);
      setRequisicoes(reqRes.data || []);
      setSupervisores(supRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega cartas e avaliações quando a aba mudar
  useEffect(() => {
    if (view === 'cartas') {
      get<{ data: Carta[] }>('/credential-letters').then(r => setCartas(r.data || [])).catch(() => {});
    }
    if (view === 'pauta') {
      get<{ data: Avaliacao[] }>('/grade-sheets').then(r => setAvaliacoes(r.data || [])).catch(() => {});
    }
  }, [view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Aprovar / Rejeitar pedido
  const handleRejeitar = async (id: number) => {
    await patch(`/internships/${id}/status`, { status: 'rejeitada' });
    fetchData();
  };

  const openAlocacao = (req: RequisicaoEstagio) => {
    setAllocReq(req);
    setAllocSupervisorId('');
  };

  const handleAlocar = async () => {
    if (!allocReq || !allocSupervisorId) return;
    const sup = supervisores.find(s => s.id === Number(allocSupervisorId));
    if (sup && (sup.estagiarios_count ?? 0) >= 5) {
      alert('Este supervisor já atingiu o limite de 5 estudantes.');
      return;
    }
    try {
      await post('/internships/allocate', {
        student_id: allocReq.student.id,
        supervisor_id: Number(allocSupervisorId),
        period_id: allocReq.period_id,
      });
      setAllocReq(null);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao alocar.');
    }
  };

  // Criar supervisor
  const handleCreateSupervisor = async () => {
    setSupSubmitting(true);
    setSupError('');
    try {
      await post('/users', {
        name: supForm.name,
        email: supForm.email,
        role: 'supervisor',
        department_id: Number(supForm.department_id) || undefined,
        academic_rank: supForm.academic_rank,
      });
      setShowSupModal(false);
      setSupForm({ name: '', email: '', academic_rank: '', department_id: '' });
      fetchData();
    } catch (err: any) {
      setSupError(err?.message || 'Erro ao criar supervisor.');
    } finally {
      setSupSubmitting(false);
    }
  };

  // Cartas
  const gerarCarta = async (internshipId: number) => {
    try {
      await post(`/internships/${internshipId}/credential`, {});
      get<{ data: Carta[] }>('/credential-letters').then(r => setCartas(r.data || []));
      alert('Carta gerada com sucesso.');
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerar carta.');
    }
  };

  const baixarCarta = (carta: Carta) => {
    window.open(`/storage/${carta.file_path}`, '_blank');
  };

  // Pauta
  const exportarPauta = async () => {
    try {
      await post('/grade-sheets', {});
      alert('Pauta gerada. Consulte a lista.');
      get<{ data: Avaliacao[] }>('/grade-sheets').then(r => setAvaliacoes(r.data || []));
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerar pauta.');
    }
  };

  // SIGEUP
  const exportarSigeup = async () => {
    try {
      const res = await post<{ file_path: string }>('/grade-sheets/export', {});
      window.open(`/storage/${res.file_path}`, '_blank');
    } catch (err: any) {
      alert(err?.message || 'Erro ao exportar SIGEUP.');
    }
  };

  // Filtros
  const reqFiltradas = requisicoes.filter(r =>
    r.student.name.toLowerCase().includes(search.toLowerCase()) ||
    r.student.student_number.includes(search)
  );

  if (loading) return <Spinner />;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Estágios UP</h1>
          <span>Coordenação</span>
        </div>
        <nav className="nav">
          {[
            ['dashboard', 'dashboard', 'Dashboard'],
            ['requisicoes', 'inbox', 'Pedidos'],
            ['supervisores', 'group', 'Supervisores'],
            ['cartas', 'description', 'Cartas'],
            ['pauta', 'grade', 'Pauta'],
            ['sigeup', 'upload', 'SIGEUP'],
          ].map(([key, icon, label]) => (
            <div
              key={key}
              className={`nav-item ${view === key ? 'active' : ''}`}
              onClick={() => setView(key as View)}
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
              <div className="user-role">Coordenador</div>
            </div>
            <button className="btn btn-secondary btn-sm logout-btn" onClick={handleLogout} title="Sair">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="header">
          <div className="header-left">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input
                className="search-input"
                placeholder="Pesquisar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
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
                <div style={{ fontSize: 10, opacity: 0.8 }}>Coordenador de Curso</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {error && <Alert>{error}</Alert>}

          {/* ─── Dashboard ─── */}
          {view === 'dashboard' && (
            <>
              <div className="section-header">
                <div>
                  <div className="page-title">Dashboard do Coordenador</div>
                  <div className="page-subtitle">Visão geral do curso</div>
                </div>
              </div>
              <div className="grid grid-3">
                <div className="stat-card">
                  <div className="stat-label">Pedidos Pendentes</div>
                  <div className="stat-value">{requisicoes.filter(r => r.status === 'pendente').length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Supervisores</div>
                  <div className="stat-value">{supervisores.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Cartas Emitidas</div>
                  <div className="stat-value">{cartas.length}</div>
                </div>
              </div>
            </>
          )}

          {/* ─── Requisições ─── */}
          {view === 'requisicoes' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Pedidos de Estágio</div>
                  <div className="page-subtitle">Aprovar, rejeitar e alocar supervisor (RF-002)</div>
                </div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Estudante</th>
                        <th>Nº</th>
                        <th>Empresas Pretendidas</th>
                        <th>Estado</th>
                        <th className="text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqFiltradas.length === 0 ? (
                        <tr><td colSpan={5} className="text-center">Nenhum pedido encontrado</td></tr>
                      ) : (
                        reqFiltradas.map(r => (
                          <tr key={r.id}>
                            <td><div className="flex items-center gap-2"><div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(r.student.name)}</div>{r.student.name}</div></td>
                            <td>{r.student.student_number}</td>
                            <td>{r.empresas_pretendidas?.join(', ') || '—'}</td>
                            <td><Badge status={r.status} /></td>
                            <td className="text-right">
                              {r.status === 'pendente' && (
                                <>
                                  <button className="btn btn-sm btn-success" onClick={() => openAlocacao(r)}>Aprovar</button>
                                  <button className="btn btn-sm btn-danger ml-2" onClick={() => handleRejeitar(r.id)}>Rejeitar</button>
                                </>
                              )}
                              {r.status === 'aprovada' && !r.supervisor_id && (
                                <button className="btn btn-sm btn-secondary" onClick={() => openAlocacao(r)}>Alocar Sup.</button>
                              )}
                              {r.supervisor && <span>Sup: {r.supervisor.name}</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── Supervisores ─── */}
          {view === 'supervisores' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Supervisores</div>
                  <div className="page-subtitle">Máximo 5 estagiários por supervisor</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowSupModal(true)}>
                  <span className="material-symbols-outlined">person_add</span> Novo Supervisor
                </button>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Nome</th><th>Email</th><th>Rank</th><th>Estagiários</th></tr></thead>
                    <tbody>
                      {supervisores.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.email}</td>
                          <td>{s.academic_rank || '—'}</td>
                          <td>{s.estagiarios_count ?? 0} / 5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── Cartas ─── */}
          {view === 'cartas' && (
            <div>
              <div className="section-header">
                <div><div className="page-title">Cartas Credenciais</div><div className="page-subtitle">Emitir e descarregar (RF-003)</div></div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Estudante</th><th>Data</th><th className="text-right">Ação</th></tr></thead>
                    <tbody>
                      {requisicoes.filter(r => r.status === 'aprovada').map(r => (
                        <tr key={r.id}>
                          <td>{r.student.name}</td>
                          <td>—</td>
                          <td className="text-right">
                            <button className="btn btn-sm btn-primary" onClick={() => gerarCarta(r.id)}>Gerar Carta</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {cartas.length > 0 && (
                <div className="mt-4">
                  <h3>Cartas Emitidas</h3>
                  <div className="card">
                    <table>
                      <thead><tr><th>ID</th><th>Data</th><th className="text-right">Download</th></tr></thead>
                      <tbody>
                        {cartas.map(c => (
                          <tr key={c.id}>
                            <td>{c.student_name || `Estágio #${c.internship_id}`}</td>
                            <td>{new Date(c.generated_at).toLocaleDateString('pt-PT')}</td>
                            <td className="text-right">
                              <button className="btn btn-sm btn-secondary" onClick={() => baixarCarta(c)}>Download</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Pauta ─── */}
          {view === 'pauta' && (
            <div>
              <div className="section-header">
                <div><div className="page-title">Pauta de Avaliação</div><div className="page-subtitle">RF-013 — Exportar pauta final</div></div>
                <button className="btn btn-primary" onClick={exportarPauta}>Gerar Pauta</button>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Estudante</th><th>Nota</th><th>Estado</th></tr></thead>
                    <tbody>
                      {avaliacoes.length === 0 ? (
                        <tr><td colSpan={3} className="text-center">Nenhuma avaliação</td></tr>
                      ) : (
                        avaliacoes.map(av => (
                          <tr key={av.id}><td>{av.student_name}</td><td>{av.nota}</td><td>{av.estado}</td></tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── SIGEUP ─── */}
          {view === 'sigeup' && (
            <div>
              <div className="page-title">Exportação SIGEUP</div>
              <div className="page-subtitle">RF-014 — Gerar ficheiro para o SIGEUP</div>
              <button className="btn btn-primary" onClick={exportarSigeup}>Exportar para SIGEUP</button>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modal: Alocar Supervisor ─── */}
      {allocReq && (
        <div className="modal-overlay" onClick={() => setAllocReq(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3>Alocar Supervisor</h3>
            <p style={{ marginBottom: 16 }}>
              <strong>{allocReq.student.name}</strong> — {allocReq.student.student_number}
              <br />
              Empresas: {allocReq.empresas_pretendidas?.join(', ') || 'Nenhuma'}
            </p>
            <div className="form-group">
              <label className="form-label">Supervisor</label>
              <select className="form-select" value={allocSupervisorId} onChange={e => setAllocSupervisorId(e.target.value)}>
                <option value="">Selecionar</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.id} disabled={(s.estagiarios_count ?? 0) >= 5}>
                    {s.name} ({s.estagiarios_count ?? 0}/5)
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setAllocReq(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAlocar}>Confirmar Alocação</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Novo Supervisor ─── */}
      {showSupModal && (
        <div className="modal-overlay" onClick={() => setShowSupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3>Novo Supervisor</h3>
            {supError && <Alert>{supError}</Alert>}
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleCreateSupervisor(); }}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-input" value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={supForm.email} onChange={e => setSupForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Rank Académico</label>
                <input className="form-input" value={supForm.academic_rank} onChange={e => setSupForm(f => ({ ...f, academic_rank: e.target.value }))} />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={supSubmitting}>{supSubmitting ? 'A criar…' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}