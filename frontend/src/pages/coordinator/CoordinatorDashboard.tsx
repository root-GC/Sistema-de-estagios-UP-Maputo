// src/pages/coordinator/CoordinatorDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch } from '../../api/api';

/* ─── Tipos ─── */
interface Student {
  id: number;
  user: { name: string; email?: string };   // ← agora com user.name
  student_number: string;
  current_year: number;
  course?: { id: number; name: string; code: string };
}

interface RequisicaoEstagio {
  id: number;
  student: Student;
  empresas_pretendidas?: string[];
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
  supervisor_profile_id?: number;
  department?: { name: string };
  department_id?: number;
  academic_rank?: string;
  estagiarios_count?: number;
  status?: string;
}

interface Carta {
  id: number;
  internship_id: number;
  file_path: string;
  generated_at: string;
  student_name?: string;          // nome do estudante devolvido pelo backend
}

interface Avaliacao {
  id: number;
  student_name: string;
  nota: string;
  estado: string;
}

interface Departamento {
  id: number;
  name: string;
  code: string;
}

interface Institution {
  id: number;
  name: string;
  tutors: Tutor[];
}

interface Tutor {
  id: number;
  name: string;
  email: string;
  position?: string;
}

interface Notificacao {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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

  type View = 'dashboard' | 'requisicoes' | 'supervisores' | 'cartas' | 'pauta' | 'sigeup' | 'notificacoes';
  const [view, setView] = useState<View>('dashboard');
  const [search, setSearch] = useState('');

  const [requisicoes, setRequisicoes] = useState<RequisicaoEstagio[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de supervisor (criação/edição)
  const [showSupModal, setShowSupModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [supForm, setSupForm] = useState({ name: '', email: '', academic_rank: '', department_id: '' });
  const [supSubmitting, setSupSubmitting] = useState(false);
  const [supError, setSupError] = useState('');

  // Modal de visualização (detalhes)
  const [viewingSupervisor, setViewingSupervisor] = useState<Supervisor | null>(null);

  // Modal de alocação (aprovar requisição)
  const [allocReq, setAllocReq] = useState<RequisicaoEstagio | null>(null);
  const [allocSupervisorId, setAllocSupervisorId] = useState<number | string>('');
  const [allocInstitutionId, setAllocInstitutionId] = useState<number | string>('');
  const [allocTutorId, setAllocTutorId] = useState<number | string>('');

  // Modal de pré‑visualização da carta
  const [cartaEstagio, setCartaEstagio] = useState<RequisicaoEstagio | null>(null);
  const [gerandoCarta, setGerandoCarta] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Cursos do coordenador
  const cursosNomes = user?.profile?.courses?.map((c: any) => c.name)?.join(', ') ?? '';
  const cursoDisplay = cursosNomes ? `Coord. de ${cursosNomes}` : 'Coordenador de Curso';

  // Carregar dados principais
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, supRes, depRes, instRes] = await Promise.all([
        get<{ data: RequisicaoEstagio[] }>('/internships?status=pendente,aprovada'),
        get<{ data: Supervisor[] }>('/users?role=supervisor'),
        get<{ data: Departamento[] }>('/departments').catch(() => ({ data: [] as Departamento[] })),
        get<{ data: Institution[] }>('/institutions').catch(() => ({ data: [] as Institution[] })),
      ]);
      setRequisicoes(reqRes.data || []);
      setSupervisores(supRes.data || []);
      setDepartamentos(depRes.data || []);
      setInstitutions(instRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar notificações
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await get<{ data: Notificacao[] }>('/notifications');
      setNotifications(res.data || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [fetchData, fetchNotifications]);

  useEffect(() => {
    if (view === 'cartas') {
      get<{ data: Carta[] }>('/credential-letters').then(r => setCartas(r.data || [])).catch(() => {});
    }
    if (view === 'pauta') {
      get<{ data: Avaliacao[] }>('/grade-sheets').then(r => setAvaliacoes(r.data || [])).catch(() => {});
    }
    if (view === 'notificacoes') {
      fetchNotifications();
    }
  }, [view, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Rejeitar requisição
  const handleRejeitar = async (id: number) => {
    await patch(`/internships/${id}/status`, { status: 'rejeitada' });
    fetchData();
  };

  // Abrir modal de aprovação com alocação
  const openAlocacao = (req: RequisicaoEstagio) => {
    setAllocReq(req);
    setAllocSupervisorId('');
    setAllocInstitutionId('');
    setAllocTutorId('');
  };

  // Aprovar e alocar
  const handleAlocar = async () => {
    if (!allocReq) return;
    try {
      await patch(`/internships/${allocReq.id}/approve`, {
        supervisor_id: allocSupervisorId ? Number(allocSupervisorId) : undefined,
        institution_id: allocInstitutionId ? Number(allocInstitutionId) : undefined,
        tutor_id: allocTutorId ? Number(allocTutorId) : undefined,
      });
      setAllocReq(null);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao aprovar e alocar.');
    }
  };

  // Criar supervisor
  const openCreateSupervisor = () => {
    setEditingSupervisor(null);
    setSupForm({ name: '', email: '', academic_rank: '', department_id: '' });
    setSupError('');
    setShowSupModal(true);
  };

  // Editar supervisor
  const openEditSupervisor = (sup: Supervisor) => {
    setEditingSupervisor(sup);
    setSupForm({
      name: sup.name || '',
      email: sup.email || '',
      academic_rank: sup.academic_rank || '',
      department_id: sup.department_id?.toString() || '',
    });
    setSupError('');
    setShowSupModal(true);
  };

  // Ver supervisor (modal de detalhes)
  const openViewSupervisor = (sup: Supervisor) => {
    setViewingSupervisor(sup);
  };

  const handleSaveSupervisor = async () => {
    setSupSubmitting(true);
    setSupError('');
    try {
      const payload = {
        name: supForm.name,
        email: supForm.email,
        role: 'supervisor',
        department_id: Number(supForm.department_id) || undefined,
        academic_rank: supForm.academic_rank,
      };

      if (editingSupervisor) {
        await patch(`/users/${editingSupervisor.id}`, payload);
      } else {
        await post('/users', payload);
      }

      setShowSupModal(false);
      setEditingSupervisor(null);
      fetchData();
    } catch (err: any) {
      setSupError(err?.message || 'Erro ao guardar supervisor.');
    } finally {
      setSupSubmitting(false);
    }
  };

  // Abrir modal de pré‑visualização da carta
  const abrirCartaModal = (req: RequisicaoEstagio) => {
    setCartaEstagio(req);
  };

  // Gerar a carta (depois de confirmar no modal)
  const gerarCartaConfirmada = async () => {
    if (!cartaEstagio) return;
    setGerandoCarta(true);
    try {
      await post(`/internships/${cartaEstagio.id}/credential`, {});
      // Recarrega a lista de cartas emitidas
      const res = await get<{ data: Carta[] }>('/credential-letters');
      setCartas(res.data || []);
      setCartaEstagio(null);
      alert('Carta gerada com sucesso.');
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerar carta.');
    } finally {
      setGerandoCarta(false);
    }
  };

  const baixarCarta = (carta: Carta) => {
  window.open(carta.file_path, '_blank');
};

  const exportarPauta = async () => {
    try {
      await post('/grade-sheets', {});
      alert('Pauta gerada. Consulte a lista.');
      get<{ data: Avaliacao[] }>('/grade-sheets').then(r => setAvaliacoes(r.data || []));
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerar pauta.');
    }
  };

  const exportarSigeup = async () => {
    try {
      const res = await post<{ file_path: string }>('/grade-sheets/export', {});
      window.open(`/storage/${res.file_path}`, '_blank');
    } catch (err: any) {
      alert(err?.message || 'Erro ao exportar SIGEUP.');
    }
  };

  // Marcar todas as notificações como lidas
  const markAllNotificationsRead = async () => {
    try {
      await patch('/notifications/mark-all-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err: any) {
      alert(err?.message || 'Erro ao marcar notificações.');
    }
  };

  // Filtro protegido contra campos undefined
  const reqFiltradas = requisicoes.filter(r =>
    (r.student?.user?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.student?.student_number ?? '').includes(search)
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
            ['notificacoes', 'notifications', 'Notificações'],
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
              <div className="user-role">{cursoDisplay}</div>
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
              <input
                className="search-input"
                placeholder="Pesquisar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="header-right">
            <button className="notification-btn" onClick={() => setView('notificacoes')}>
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            <div className="divider" />
            <div className="user-info" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>{initials(user?.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{cursoDisplay}</div>
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
                            <td><div className="flex items-center gap-2"><div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(r.student.user?.name)}</div>{r.student.user?.name || '—'}</div></td>
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
                <button className="btn btn-primary" onClick={openCreateSupervisor}>
                  <span className="material-symbols-outlined">person_add</span> Novo Supervisor
                </button>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Departamento</th>
                        <th>Rank</th>
                        <th>Estagiários</th>
                        <th className="text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisores.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.email}</td>
                          <td>{s.department?.name || '—'}</td>
                          <td>{s.academic_rank || '—'}</td>
                          <td>{s.estagiarios_count ?? 0} / 5</td>
                          <td className="text-right">
                            <button className="btn btn-sm btn-secondary" style={{ marginRight: 4 }} onClick={() => openViewSupervisor(s)}>Ver</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditSupervisor(s)}>Editar</button>
                          </td>
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
                          <td>{r.student.user?.name || '—'}</td>
                          <td>—</td>
                          <td className="text-right">
                            <button className="btn btn-sm btn-primary" onClick={() => abrirCartaModal(r)}>Gerar Carta</button>
                          </td>
                        </tr>
                      ))}
                      {requisicoes.filter(r => r.status === 'aprovada').length === 0 && (
                        <tr><td colSpan={3} className="text-center">Nenhum estágio aprovado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {cartas.length > 0 && (
                <div className="mt-4">
                  <h3>Cartas Emitidas</h3>
                  <div className="card">
                    <table>
                      <thead><tr><th>Estudante</th><th>Data</th><th className="text-right">Download</th></tr></thead>
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

          {/* ─── Notificações ─── */}
          {view === 'notificacoes' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Notificações</div>
                  <div className="page-subtitle">Comunicações do sistema</div>
                </div>
                {unreadCount > 0 && (
                  <button className="btn btn-secondary" onClick={markAllNotificationsRead}>
                    <span className="material-symbols-outlined">done_all</span> Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Mensagem</th>
                        <th>Data</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">Nenhuma notificação</td></tr>
                      ) : (
                        notifications.map(n => (
                          <tr key={n.id} style={{ fontWeight: n.is_read ? 'normal' : 600 }}>
                            <td>{n.title}</td>
                            <td>{n.message}</td>
                            <td>{new Date(n.created_at).toLocaleString('pt-PT')}</td>
                            <td>{n.is_read ? '✅ Lida' : '🔵 Nova'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modal: Alocar e Aprovar ─── */}
      {allocReq && (
        <div className="modal-overlay" onClick={() => setAllocReq(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3>Aprovar Requisição e Alocar</h3>
            <p style={{ marginBottom: 16 }}>
              <strong>{allocReq.student.user?.name || '—'}</strong> — {allocReq.student.student_number}
              <br />
              Empresas pretendidas: {allocReq.empresas_pretendidas?.join(', ') || 'Nenhuma'}
            </p>
            <div className="form-group">
              <label className="form-label">Supervisor</label>
              <select className="form-select" value={allocSupervisorId} onChange={e => setAllocSupervisorId(e.target.value)}>
                <option value="">Selecionar</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.supervisor_profile_id} disabled={(s.estagiarios_count ?? 0) >= 5}>
                    {s.name} ({s.estagiarios_count ?? 0}/5)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Instituição</label>
              <select className="form-select" value={allocInstitutionId} onChange={e => { setAllocInstitutionId(e.target.value); setAllocTutorId(''); }}>
                <option value="">Nenhuma</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            {allocInstitutionId && (
              <div className="form-group">
                <label className="form-label">Tutor</label>
                <select className="form-select" value={allocTutorId} onChange={e => setAllocTutorId(e.target.value)}>
                  <option value="">Nenhum</option>
                  {institutions.find(i => i.id === Number(allocInstitutionId))?.tutors.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.position ? `(${t.position})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setAllocReq(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAlocar}>Confirmar Aprovação</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Pré‑visualizar e Gerar Carta ─── */}
      {cartaEstagio && (
        <div className="modal-overlay" onClick={() => setCartaEstagio(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <h3>Gerar Carta de Estágio</h3>
            <p style={{ marginBottom: 16 }}>
              Confirme os dados do estagiário e do estágio antes de gerar a carta.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Estudante:</strong> {cartaEstagio.student.user?.name || '—'}</div>
              <div><strong>Nº de estudante:</strong> {cartaEstagio.student.student_number}</div>
              <div><strong>Curso:</strong> {cartaEstagio.student.course?.name || '—'}</div>
              <div><strong>Empresas pretendidas:</strong> {cartaEstagio.empresas_pretendidas?.join(', ') || 'Nenhuma'}</div>
              <div><strong>Período:</strong> {cartaEstagio.period?.name || cartaEstagio.period?.academic_year || '—'}</div>
              <div><strong>Supervisor:</strong> {cartaEstagio.supervisor?.name || 'Não atribuído'}</div>
            </div>
            <div className="modal-buttons" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setCartaEstagio(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={gerarCartaConfirmada} disabled={gerandoCarta}>
                {gerandoCarta ? 'A gerar…' : 'Gerar Carta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Criar / Editar Supervisor ─── */}
      {showSupModal && (
        <div className="modal-overlay" onClick={() => setShowSupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>{editingSupervisor ? 'Editar Supervisor' : 'Novo Supervisor'}</h3>
            {supError && <Alert>{supError}</Alert>}
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleSaveSupervisor(); }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input className="form-input" value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nome do supervisor" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={supForm.email} onChange={e => setSupForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@up.ac.mz" />
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <select className="form-select" value={supForm.department_id} onChange={e => setSupForm(f => ({ ...f, department_id: e.target.value }))} required>
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rank Académico</label>
                <select className="form-select" value={supForm.academic_rank} onChange={e => setSupForm(f => ({ ...f, academic_rank: e.target.value }))} required>
                  <option value="">Seleccionar rank</option>
                  <option value="Docente">Docente</option>
                  <option value="Assistente">Assistente</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={supSubmitting}>
                  {supSubmitting ? 'A guardar…' : (editingSupervisor ? 'Atualizar' : 'Criar Supervisor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Ver Supervisor (detalhes) ─── */}
      {viewingSupervisor && (
        <div className="modal-overlay" onClick={() => setViewingSupervisor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Detalhes do Supervisor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div><strong>Nome:</strong> {viewingSupervisor.name}</div>
              <div><strong>Email:</strong> {viewingSupervisor.email}</div>
              <div><strong>Departamento:</strong> {viewingSupervisor.department?.name || '—'}</div>
              <div><strong>Rank Académico:</strong> {viewingSupervisor.academic_rank || '—'}</div>
              <div><strong>Estagiários:</strong> {viewingSupervisor.estagiarios_count ?? 0} / 5</div>
              <div><strong>Estado:</strong> <Badge status={viewingSupervisor.status || 'active'} /></div>
            </div>
            <div className="modal-buttons" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingSupervisor(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}