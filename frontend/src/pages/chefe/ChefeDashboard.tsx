import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, del } from '../../api/api';

/* ─── Tipos locais ─── */
interface UserData {
  id: number;
  name: string;
  email: string;
  roles?: { name: string }[];
  role?: string;
  status?: string;
}

interface Instituicao {
  id: number;
  name: string;
  nuit?: string;
  address?: string;
  phone?: string;
  email?: string;
  ponto_focal_nome?: string;
  ponto_focal_contacto?: string;
  status?: string;
}

interface Estagio {
  id: number;
  titulo?: string;
  descricao?: string;
  status?: string;
  instituicao?: { name: string };
  estagiario?: { name: string };
  user?: { name: string };
}

interface Departamento {
  id: number;
  name: string;
  code: string;
}

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

/* ─── Componente principal ─── */
export default function ChefeDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Dados
  const [users, setUsers] = useState<UserData[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // UI
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'instituicoes' | 'estagios'>('dashboard');
  const [loading, setLoading] = useState({ users: false, instituicoes: false, estagios: false, departamentos: false });
  const [error, setError] = useState({ users: '', instituicoes: '', estagios: '', departamentos: '' });
  const [search, setSearch] = useState('');

  // Modal de instituição
  const [instModal, setInstModal] = useState<{ type: 'create' | 'edit'; data?: Instituicao } | null>(null);
  const [instForm, setInstForm] = useState({
    name: '',
    nuit: '',
    address: '',
    phone: '',
    email: '',
    ponto_focal_nome: '',
    ponto_focal_contacto: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal de criação de utilizador (apenas coordenador)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', department_id: '' });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userError, setUserError] = useState('');

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    setLoading(l => ({ ...l, users: true }));
    setError(e => ({ ...e, users: '' }));
    try {
      const res = await get<{ data: UserData[] }>('/users');
      setUsers(res.data || []);
    } catch (err: any) {
      setError(e => ({ ...e, users: err?.message || 'Erro ao carregar utilizadores.' }));
    } finally {
      setLoading(l => ({ ...l, users: false }));
    }
  }, []);

  const fetchInstituicoes = useCallback(async () => {
    setLoading(l => ({ ...l, instituicoes: true }));
    setError(e => ({ ...e, instituicoes: '' }));
    try {
      const res = await get<{ data: Instituicao[] }>('/institutions');
      setInstituicoes(res.data || []);
    } catch (err: any) {
      setError(e => ({ ...e, instituicoes: err?.message || 'Erro ao carregar instituições.' }));
    } finally {
      setLoading(l => ({ ...l, instituicoes: false }));
    }
  }, []);

  const fetchEstagios = useCallback(async () => {
    setLoading(l => ({ ...l, estagios: true }));
    setError(e => ({ ...e, estagios: '' }));
    try {
      const res = await get<{ data: Estagio[] }>('/internships');
      setEstagios(res.data || []);
    } catch (err: any) {
      setError(e => ({ ...e, estagios: err?.message || 'Erro ao carregar estágios.' }));
    } finally {
      setLoading(l => ({ ...l, estagios: false }));
    }
  }, []);

  const fetchDepartamentos = useCallback(async () => {
    setLoading(l => ({ ...l, departamentos: true }));
    setError(e => ({ ...e, departamentos: '' }));
    try {
      const res = await get<{ data: Departamento[] }>('/departments');
      setDepartamentos(res.data || []);
    } catch (err: any) {
      setError(e => ({ ...e, departamentos: err?.message || 'Erro ao carregar departamentos.' }));
    } finally {
      setLoading(l => ({ ...l, departamentos: false }));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchInstituicoes();
    fetchEstagios();
    fetchDepartamentos();
  }, [fetchUsers, fetchInstituicoes, fetchEstagios, fetchDepartamentos]);

  // CRUD Instituição
  const openCreateInst = () => {
    setInstForm({
      name: '',
      nuit: '',
      address: '',
      phone: '',
      email: '',
      ponto_focal_nome: '',
      ponto_focal_contacto: '',
    });
    setInstModal({ type: 'create' });
  };

  const openEditInst = (inst: Instituicao) => {
    setInstForm({
      name: inst.name || '',
      nuit: inst.nuit || '',
      address: inst.address || '',
      phone: inst.phone || '',
      email: inst.email || '',
      ponto_focal_nome: inst.ponto_focal_nome || '',
      ponto_focal_contacto: inst.ponto_focal_contacto || '',
    });
    setInstModal({ type: 'edit', data: inst });
  };

  const handleSaveInst = async () => {
    setSubmitting(true);
    try {
      if (instModal?.type === 'create') {
        await post('/institutions', instForm);
      } else if (instModal?.data) {
        await patch(`/institutions/${instModal.data.id}`, instForm);
      }
      setInstModal(null);
      fetchInstituicoes();
    } catch (err: any) {
      alert(err?.message || 'Erro ao guardar instituição.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInst = async (id: number) => {
    if (!window.confirm('Eliminar esta instituição?')) return;
    try {
      await del(`/institutions/${id}`);
      fetchInstituicoes();
    } catch (err: any) {
      alert(err?.message || 'Erro ao eliminar instituição.');
    }
  };

  // CRUD Utilizador (apenas coordenador)
  const openCreateUser = () => {
    setUserForm({ name: '', email: '', department_id: '' });
    setUserError('');
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    setUserSubmitting(true);
    setUserError('');
    try {
      await post('/users', {
        name: userForm.name,
        email: userForm.email,
        role: 'coordinator',
        department_id: Number(userForm.department_id),
      });
      setUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserError(err?.message || 'Erro ao criar utilizador.');
    } finally {
      setUserSubmitting(false);
    }
  };

  // Handlers genéricos
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filtros
  const filteredInst = instituicoes.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Estatísticas
  const activeEstagios = estagios.filter(e => (e.status || '').toUpperCase() === 'ATIVO');
  const pendingEstagios = estagios.filter(e => ['PENDENTE', 'PENDING'].includes((e.status || '').toUpperCase()));

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Estágios UP</h1>
          <span>Chefe de Repartição</span>
        </div>

        <nav className="nav">
          <div
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
            role="button"
            tabIndex={0}
          >
            <span className="nav-icon material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </div>
          <div
            className={`nav-item ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentView('users')}
            role="button"
            tabIndex={0}
          >
            <span className="nav-icon material-symbols-outlined">group</span>
            <span>Utilizadores</span>
          </div>
          <div
            className={`nav-item ${currentView === 'instituicoes' ? 'active' : ''}`}
            onClick={() => setCurrentView('instituicoes')}
            role="button"
            tabIndex={0}
          >
            <span className="nav-icon material-symbols-outlined">corporate_fare</span>
            <span>Instituições</span>
          </div>
          <div
            className={`nav-item ${currentView === 'estagios' ? 'active' : ''}`}
            onClick={() => setCurrentView('estagios')}
            role="button"
            tabIndex={0}
          >
            <span className="nav-icon material-symbols-outlined">work</span>
            <span>Estágios</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Chefe de Repartição</div>
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
              {pendingEstagios.length > 0 && (
                <span className="notification-badge">{pendingEstagios.length}</span>
              )}
            </button>
            <div className="divider" />
            <div className="user-info" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>{initials(user?.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Chefe de Repartição</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {currentView === 'dashboard' && (
            <>
              <div className="section-header">
                <div>
                  <div className="page-title">Dashboard</div>
                  <div className="page-subtitle">Bem-vindo ao Sistema de Estágios Profissionalizantes</div>
                </div>
              </div>
              <div className="grid grid-4">
                <div className="stat-card">
                  <div className="stat-label">Total Utilizadores</div>
                  <div className="stat-value">{loading.users ? '…' : users.length}</div>
                  <div className="stat-sub">Registados no sistema</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Instituições Parceiras</div>
                  <div className="stat-value">{loading.instituicoes ? '…' : instituicoes.length}</div>
                  <div className="stat-sub">Geridas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Estágios Ativos</div>
                  <div className="stat-value">{loading.estagios ? '…' : activeEstagios.length}</div>
                  <div className="stat-sub">De {estagios.length} no total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pendências</div>
                  <div className="stat-value">{loading.estagios ? '…' : pendingEstagios.length}</div>
                  <div className="stat-sub">{pendingEstagios.length > 0 ? 'Ação urgente' : 'Sem pendências'}</div>
                </div>
              </div>
            </>
          )}

          {currentView === 'users' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Gestão de Utilizadores</div>
                  <div className="page-subtitle">Lista de utilizadores registados</div>
                </div>
                <button className="btn btn-primary" onClick={openCreateUser}>
                  <span className="material-symbols-outlined">person_add</span> Novo Coordenador
                </button>
              </div>
              {error.users && <div className="alert alert-error">{error.users}</div>}
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Função</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">Nenhum utilizador</td></tr>
                      ) : (
                        users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(u.name)}</div>
                                {u.name}
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>{u.roles?.[0]?.name || u.role || '—'}</td>
                            <td><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-muted'}`}>{u.status || 'active'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'instituicoes' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Gestão de Instituições Parceiras</div>
                  <div className="page-subtitle">Registar, editar e remover instituições</div>
                </div>
                <button className="btn btn-primary" onClick={openCreateInst}>
                  <span className="material-symbols-outlined">add</span> Nova Instituição
                </button>
              </div>
              {error.instituicoes && <div className="alert alert-error">{error.instituicoes}</div>}
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>NUIT</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Ponto Focal (Nome)</th>
                        <th>Ponto Focal (Contacto)</th>
                        <th className="text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInst.length === 0 ? (
                        <tr><td colSpan={7} className="text-center">Nenhuma instituição encontrada</td></tr>
                      ) : (
                        filteredInst.map(inst => (
                          <tr key={inst.id}>
                            <td>{inst.name || '—'}</td>
                            <td>{inst.nuit || '—'}</td>
                            <td>{inst.email || '—'}</td>
                            <td>{inst.phone || '—'}</td>
                            <td>{inst.ponto_focal_nome || '—'}</td>
                            <td>{inst.ponto_focal_contacto || '—'}</td>
                            <td className="text-right">
                              <button className="btn btn-sm btn-secondary" style={{ marginRight: 4 }} onClick={() => openEditInst(inst)}>Editar</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInst(inst.id)}>Eliminar</button>
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

          {currentView === 'estagios' && (
            <div>
              <div className="page-title">Estágios</div>
              <div className="page-subtitle">Lista de estágios em curso</div>
              {error.estagios && <div className="alert alert-error">{error.estagios}</div>}
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Título / Descrição</th>
                        <th>Instituição</th>
                        <th>Estagiário</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estagios.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">Nenhum estágio encontrado</td></tr>
                      ) : (
                        estagios.map(e => (
                          <tr key={e.id}>
                            <td>{e.titulo || e.descricao || '—'}</td>
                            <td>{e.instituicao?.name || '—'}</td>
                            <td>{e.estagiario?.name || e.user?.name || '—'}</td>
                            <td><span className={`badge ${e.status === 'ATIVO' ? 'badge-green' : 'badge-yellow'}`}>{e.status || 'PENDENTE'}</span></td>
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

      {/* Modal Instituição */}
      {instModal && (
        <div className="modal-overlay" onClick={() => setInstModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>{instModal.type === 'create' ? 'Nova Instituição' : 'Editar Instituição'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleSaveInst(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input className="form-input" value={instForm.name} onChange={e => setInstForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nome da empresa" />
                </div>
                <div className="form-group">
                  <label className="form-label">NUIT</label>
                  <input className="form-input" value={instForm.nuit} onChange={e => setInstForm(f => ({ ...f, nuit: e.target.value }))} placeholder="400123456" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={instForm.email} onChange={e => setInstForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.co.mz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-input" value={instForm.phone} onChange={e => setInstForm(f => ({ ...f, phone: e.target.value }))} placeholder="+258..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-input" value={instForm.address} onChange={e => setInstForm(f => ({ ...f, address: e.target.value }))} placeholder="Local" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ponto Focal (Nome)</label>
                  <input className="form-input" value={instForm.ponto_focal_nome} onChange={e => setInstForm(f => ({ ...f, ponto_focal_nome: e.target.value }))} placeholder="Nome do responsável" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ponto Focal (Email)</label>
                  <input className="form-input" type="email" value={instForm.ponto_focal_contacto} onChange={e => setInstForm(f => ({ ...f, ponto_focal_contacto: e.target.value }))} placeholder="Email do responsável" />
                </div>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setInstModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'A guardar…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Utilizador (apenas Coordenador) */}
      {userModalOpen && (
        <div className="modal-overlay" onClick={() => setUserModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>Novo Coordenador</h3>
            {userError && <div className="alert alert-error">{userError}</div>}
            <form onSubmit={e => { e.preventDefault(); handleSaveUser(); }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">person</span>
                  <input className="form-input" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nome do coordenador" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">mail</span>
                  <input className="form-input" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@up.ac.mz" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <div className="inputWrapper">
                  <span className="inputIcon material-symbols-outlined">account_balance</span>
                  <select className="form-select" value={userForm.department_id} onChange={e => setUserForm(f => ({ ...f, department_id: e.target.value }))} required>
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={userSubmitting}>
                  {userSubmitting ? 'A criar…' : 'Criar Coordenador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}