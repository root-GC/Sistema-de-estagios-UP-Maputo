// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post, patch, del } from '../../api/api';

/* ─── Tipos actualizados com base nos JSON reais ─── */
interface User {
  id: number;
  name: string;
  email: string;
  roles: { name: string }[];
  status: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  description?: string;
}

interface Faculdade {
  id: number;
  name: string;
  code: string;
}

interface Departamento {
  id: number;
  faculty_id: number;
  name: string;
  code: string;
  faculty?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Curso {
  id: number;
  department_id: number;
  name: string;
  code: string;
  duration_years: number;
  weight_contact_hours?: string;
  weight_independent_study?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  active?: boolean;          // campo usado para activo/inactivo
}

interface Instituicao {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'suspensa';
}

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface AuditLog {
  id: number;
  user?: { name: string };
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
}

interface ActiveSession {
  id: number;
  name: string;
  email: string;
  last_login: string;
  last_ip: string;
  failed_attempts: number;
}

type Menu =
  | 'users'
  | 'roles'
  | 'faculdades'
  | 'departamentos'
  | 'cursos'
  | 'instituicoes'
  | 'notifications'
  | 'logs'
  | 'sessions';

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

/* ─── Componentes UI ─── */
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
    active: ['badge-green', 'Activo'],
    inactive: ['badge-muted', 'Inactivo'],
    suspended: ['badge-red', 'Suspenso'],
    aprovada: ['badge-green', 'Aprovada'],
    rejeitada: ['badge-red', 'Rejeitada'],
    pendente: ['badge-yellow', 'Pendente'],
    suspensa: ['badge-red', 'Suspensa'],
  };
  const [css, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${css}`}>{label}</span>;
}

/* ─── Barra lateral do Admin ─── */
const adminMenu: [Menu, string, string][] = [
  ['users', 'group', 'Utilizadores'],
  ['roles', 'admin_panel_settings', 'Papéis'],
  ['faculdades', 'apartment', 'Faculdades'],
  ['departamentos', 'account_balance', 'Departamentos'],
  ['cursos', 'class', 'Cursos'],
  ['instituicoes', 'business', 'Instituições'],
  ['notifications', 'notifications', 'Notificações'],
  ['logs', 'history_edu', 'Logs'],
  ['sessions', 'devices', 'Sessões'],
];

function AdminSidebar({ active, onSelect, onLogout }: { active: Menu; onSelect: (m: Menu) => void; onLogout: () => void }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Estágios UP</h1>
        <span>Painel Admin</span>
      </div>

      <nav className="nav">
        {adminMenu.map(([key, icon, label]) => (
          <div
            key={key}
            className={`nav-item ${active === key ? 'active' : ''}`}
            onClick={() => onSelect(key)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelect(key)}
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
            <div className="user-role">Administrador</div>
          </div>
          <button className="btn btn-secondary btn-sm logout-btn" onClick={onLogout} title="Sair">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── Dashboard Admin ─── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menu, setMenu] = useState<Menu>('users');
  const [search, setSearch] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [faculdades, setFaculdades] = useState<Faculdade[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      get<{ data: User[] }>('/users').then(r => setUsers(r.data || [])),
      get<{ data: Role[] }>('/roles').then(r => setRoles(r.data || [])),
      get<{ data: Faculdade[] }>('/faculties').then(r => setFaculdades(r.data || [])),
      get<{ data: Departamento[] }>('/departments').then(r => setDepartamentos(r.data || [])),
      get<{ data: Curso[] }>('/courses').then(r => setCursos(r.data || [])),
      get<{ data: Instituicao[] }>('/institutions').then(r => setInstituicoes(r.data || [])),
      get<{ data: Notificacao[] }>('/notifications').then(r => setNotifications(r.data || [])),
      get<{ data: AuditLog[] }>('/audit-logs').then(r => setLogs(r.data || [])),
      get<{ data: ActiveSession[] }>('/active-sessions').then(r => setSessions(r.data || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const updateState = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, data: Partial<T>) =>
    setter(prev => prev.map(item => (item as any).id === id ? { ...item, ...data } : item));
  const removeFromState = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) =>
    setter(prev => prev.filter(item => (item as any).id !== id));

  const toggleUserStatus = async (u: User) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    await patch(`/users/${u.id}`, { status: newStatus });
    updateState(setUsers, u.id, { status: newStatus } as any);
  };

  const deleteFaculdade = async (id: number) => {
    if (!confirm('Eliminar faculdade?')) return;
    await del(`/faculties/${id}`);
    removeFromState(setFaculdades, id);
  };

  const deleteDepartamento = async (id: number) => {
    if (!confirm('Eliminar departamento?')) return;
    await del(`/departments/${id}`);
    removeFromState(setDepartamentos, id);
  };

  const toggleCursoStatus = async (c: Curso) => {
    const newActive = !c.active;
    await patch(`/courses/${c.id}`, { active: newActive });
    updateState(setCursos, c.id, { active: newActive } as any);
  };
  const deleteCurso = async (id: number) => {
    if (!confirm('Eliminar curso?')) return;
    await del(`/courses/${id}`);
    removeFromState(setCursos, id);
  };

  const updateInstituicaoStatus = async (id: number, status: string) => {
    await patch(`/institutions/${id}`, { status });
    updateState(setInstituicoes, id, { status } as any);
  };

  const deleteRole = async (id: number) => {
    if (!confirm('Eliminar papel?')) return;
    await del(`/roles/${id}`);
    removeFromState(setRoles, id);
  };

  const markAllNotificationsRead = async () => {
    await patch('/notifications/mark-all-read', {});
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const openModal = (type: string, data?: any) => setModal({ type, data });
  const closeModal = () => setModal(null);

  if (loading) return <Spinner />;

  return (
    <div className="layout">
      <AdminSidebar active={menu} onSelect={setMenu} onLogout={handleLogout} />
      <main className="main">
        <header className="header">
          <div className="header-left">
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input className="search-input" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="header-right">
            <button className="notification-btn">
              <span className="material-symbols-outlined">notifications</span>
              <span className="notification-badge">{notifications.filter(n => !n.lida).length}</span>
            </button>
            <div className="divider" />
            <div className="user-info" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>A</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Admin</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Gestão do Sistema</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {menu === 'users' && <UsersSection users={users} onToggle={toggleUserStatus} onCreate={() => openModal('user')} />}
          {menu === 'roles' && <RolesSection roles={roles} onDelete={deleteRole} onCreate={() => openModal('role')} />}
          {menu === 'faculdades' && <FaculdadesSection faculdades={faculdades} onDelete={deleteFaculdade} onCreate={() => openModal('faculdade')} />}
          {menu === 'departamentos' && <DepartamentosSection departamentos={departamentos} onDelete={deleteDepartamento} onCreate={() => openModal('departamento')} />}
          {menu === 'cursos' && <CursosSection cursos={cursos} onToggle={toggleCursoStatus} onDelete={deleteCurso} onCreate={() => openModal('curso')} />}
          {menu === 'instituicoes' && <InstituicoesSection instituicoes={instituicoes} onUpdateStatus={updateInstituicaoStatus} onCreate={() => openModal('instituicao')} />}
          {menu === 'notifications' && <NotificationsSection notifications={notifications} onMarkAllRead={markAllNotificationsRead} />}
          {menu === 'logs' && <LogsSection logs={logs} />}
          {menu === 'sessions' && <SessionsSection sessions={sessions} />}
        </div>

        {modal && (
          <ModalRouter
            type={modal.type}
            data={modal.data}
            onClose={closeModal}
            refresh={fetchData}
            departamentos={departamentos}
            faculdades={faculdades}
            cursos={cursos}
          />
        )}
      </main>
    </div>
  );
}

/* ─── Secções (agora com os campos correctos) ─── */

function UsersSection({ users, onToggle, onCreate }: { users: User[]; onToggle: (u: User) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Gestão de Utilizadores</div>
          <div className="page-subtitle">Criar, activar e suspender contas</div>
        </div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">person_add</span> Novo Utilizador</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Estado</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><div className="flex items-center gap-2"><div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(u.name)}</div>{u.name}</div></td>
                  <td>{u.email}</td>
                  <td>{u.roles?.[0]?.name ?? '—'}</td>
                  <td><Badge status={u.status} /></td>
                  <td className="text-right">
                    <button className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => onToggle(u)}>
                      {u.status === 'active' ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center">Nenhum utilizador</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RolesSection({ roles, onDelete, onCreate }: { roles: Role[]; onDelete: (id: number) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Papéis (Roles)</div><div className="page-subtitle">Gerir funções do sistema</div></div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">add</span> Novo Papel</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Guard</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td><td>{r.guard_name}</td>
                  <td className="text-right"><button className="btn btn-sm btn-danger" onClick={() => onDelete(r.id)}>Eliminar</button></td>
                </tr>
              ))}
              {roles.length === 0 && <tr><td colSpan={3} className="text-center">Nenhum papel</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FaculdadesSection({ faculdades, onDelete, onCreate }: { faculdades: Faculdade[]; onDelete: (id: number) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Faculdades</div><div className="page-subtitle">Estrutura orgânica da UP</div></div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">add</span> Nova Faculdade</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Código</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {faculdades.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td><td>{f.code}</td>
                  <td className="text-right"><button className="btn btn-sm btn-danger" onClick={() => onDelete(f.id)}>Eliminar</button></td>
                </tr>
              ))}
              {faculdades.length === 0 && <tr><td colSpan={3} className="text-center">Nenhuma faculdade</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DepartamentosSection({ departamentos, onDelete, onCreate }: { departamentos: Departamento[]; onDelete: (id: number) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Departamentos</div><div className="page-subtitle">Unidades académicas</div></div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">add</span> Novo</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Código</th><th>Faculdade</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {departamentos.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.code}</td>
                  <td>{d.faculty?.name ?? '—'}</td>
                  <td className="text-right"><button className="btn btn-sm btn-danger" onClick={() => onDelete(d.id)}>Eliminar</button></td>
                </tr>
              ))}
              {departamentos.length === 0 && <tr><td colSpan={4} className="text-center">Nenhum departamento</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CursosSection({ cursos, onToggle, onDelete, onCreate }: { cursos: Curso[]; onToggle: (c: Curso) => void; onDelete: (id: number) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Cursos</div><div className="page-subtitle">Planos de estágio</div></div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">add</span> Novo Curso</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Código</th><th>Departamento</th><th>Duração</th><th>Estado</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.code}</td>
                  <td>{c.department?.name ?? '—'}</td>
                  <td>{c.duration_years} anos</td>
                  <td><Badge status={c.active ? 'active' : 'inactive'} /></td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(c.id)}>Eliminar</button>
                    <button className="btn btn-sm btn-secondary ml-2" onClick={() => onToggle(c)}>
                      {c.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {cursos.length === 0 && <tr><td colSpan={6} className="text-center">Nenhum curso</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InstituicoesSection({ instituicoes, onUpdateStatus, onCreate }: { instituicoes: Instituicao[]; onUpdateStatus: (id: number, status: string) => void; onCreate: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Instituições Parceiras</div><div className="page-subtitle">Empresas de estágio</div></div>
        <button className="btn btn-primary" onClick={onCreate}><span className="material-symbols-outlined">add</span> Nova Instituição</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Status</th><th className="text-right">Acções</th></tr></thead>
            <tbody>
              {instituicoes.map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td><td>{i.email}</td><td>{i.phone}</td>
                  <td><Badge status={i.status} /></td>
                  <td className="text-right">
                    {i.status !== 'aprovada' && <button className="btn btn-sm btn-success mr-1" onClick={() => onUpdateStatus(i.id, 'aprovada')}>Aprovar</button>}
                    {i.status !== 'rejeitada' && <button className="btn btn-sm btn-danger mr-1" onClick={() => onUpdateStatus(i.id, 'rejeitada')}>Rejeitar</button>}
                    {i.status !== 'suspensa' && <button className="btn btn-sm btn-secondary" onClick={() => onUpdateStatus(i.id, 'suspensa')}>Suspender</button>}
                  </td>
                </tr>
              ))}
              {instituicoes.length === 0 && <tr><td colSpan={5} className="text-center">Nenhuma instituição</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({ notifications, onMarkAllRead }: { notifications: Notificacao[]; onMarkAllRead: () => void }) {
  return (
    <div>
      <div className="section-header">
        <div><div className="page-title">Notificações</div><div className="page-subtitle">Mensagens do sistema</div></div>
        <button className="btn btn-secondary" onClick={onMarkAllRead}>
          <span className="material-symbols-outlined">done_all</span> Marcar todas lidas
        </button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Título</th><th>Mensagem</th><th>Data</th><th>Lida</th></tr></thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id}>
                  <td>{n.titulo}</td><td>{n.mensagem}</td>
                  <td>{new Date(n.created_at).toLocaleString('pt-PT')}</td>
                  <td>{n.lida ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
              {notifications.length === 0 && <tr><td colSpan={4} className="text-center">Nenhuma notificação</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LogsSection({ logs }: { logs: AuditLog[] }) {
  return (
    <div>
      <div className="page-title">Logs de Actividade</div>
      <div className="page-subtitle">Rastreabilidade do sistema</div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Utilizador</th><th>Acção</th><th>Descrição</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                  <td>{log.user?.name || '—'}</td>
                  <td><span className="badge badge-blue">{log.action}</span></td>
                  <td>{log.description}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="text-center">Nenhum log</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionsSection({ sessions }: { sessions: ActiveSession[] }) {
  return (
    <div>
      <div className="page-title">Sessões Activas</div>
      <div className="page-subtitle">Utilizadores online</div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Último Acesso</th><th>IP</th><th>Tentativas Falhadas</th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td><td>{s.email}</td>
                  <td>{s.last_login ? new Date(s.last_login).toLocaleString('pt-PT') : '—'}</td>
                  <td>{s.last_ip || '—'}</td>
                  <td>{s.failed_attempts}</td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={5} className="text-center">Nenhuma sessão</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Roteador de modais (inalterado, já compatível) ─── */
function ModalRouter({
  type,
  data,
  onClose,
  refresh,
  departamentos,
  faculdades,
  cursos,
}: {
  type: string;
  data?: any;
  onClose: () => void;
  refresh: () => void;
  departamentos: Departamento[];
  faculdades: Faculdade[];
  cursos: Curso[];
}) {
  if (type === 'user') return <UserModal onClose={onClose} refresh={refresh} departamentos={departamentos} cursos={cursos} />;
  if (type === 'faculdade') return <FaculdadeModal onClose={onClose} refresh={refresh} />;
  if (type === 'departamento') return <DepartamentoModal onClose={onClose} refresh={refresh} faculdades={faculdades} />;
  if (type === 'curso') return <CursoModal onClose={onClose} refresh={refresh} departamentos={departamentos} />;
  if (type === 'instituicao') return <InstituicaoModal onClose={onClose} refresh={refresh} />;
  return null;
}

/* ─── Modais (mantidos; campos já usam os nomes correctos) ─── */
function UserModal({ onClose, refresh, departamentos, cursos }: { onClose: () => void; refresh: () => void; departamentos: Departamento[]; cursos: Curso[] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student',
    department_id: '',
    course_id: '',
    academic_rank: '',
  });

  const availableRoles = ['admin', 'dept_head', 'coordinator', 'supervisor'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, any> = { name: form.name, email: form.email, role: form.role };
      if (form.role === 'dept_head' || form.role === 'supervisor') payload.department_id = Number(form.department_id);
      if (form.role === 'coordinator') payload.course_id = Number(form.course_id);
      if (form.role === 'supervisor') payload.academic_rank = form.academic_rank;
      await post('/users', payload);
      onClose();
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar utilizador.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>Criar Novo Utilizador</h3>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">person</span>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do utilizador" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">mail</span>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@up.ac.mz" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Perfil (Role)</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">badge</span>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {(form.role === 'dept_head' || form.role === 'supervisor') && (
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">account_balance</span>
                <select className="form-select" value={form.department_id} onChange={e => set('department_id', e.target.value)} required>
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {form.role === 'coordinator' && (
            <div className="form-group">
              <label className="form-label">Curso</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">class</span>
                <select className="form-select" value={form.course_id} onChange={e => set('course_id', e.target.value)} required>
                  <option value="">Seleccionar curso</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {form.role === 'supervisor' && (
            <div className="form-group">
              <label className="form-label">Rank Académico</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">school</span>
                <input className="form-input" value={form.academic_rank} onChange={e => set('academic_rank', e.target.value)} placeholder="Ex: Assistente, Professor Associado" />
              </div>
            </div>
          )}
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A criar…' : 'Criar Utilizador'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FaculdadeModal({ onClose, refresh }: { onClose: () => void; refresh: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await post('/faculties', { name, code });
      onClose();
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar faculdade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>Nova Faculdade</h3>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">apartment</span>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da faculdade" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">tag</span>
              <input className="form-input" value={code} onChange={e => setCode(e.target.value)} placeholder="Código" required />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A criar…' : 'Criar Faculdade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepartamentoModal({ onClose, refresh, faculdades }: { onClose: () => void; refresh: () => void; faculdades: Faculdade[] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', faculty_id: '' });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await post('/departments', {
        name: form.name,
        code: form.code,
        faculty_id: Number(form.faculty_id),
      });
      onClose();
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar departamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>Novo Departamento</h3>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">account_balance</span>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do departamento" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Faculdade</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">apartment</span>
              <select className="form-select" value={form.faculty_id} onChange={e => set('faculty_id', e.target.value)} required>
                <option value="">Seleccionar faculdade</option>
                {faculdades.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">tag</span>
              <input className="form-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Código" required />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A criar…' : 'Criar Departamento'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CursoModal({ onClose, refresh, departamentos }: { onClose: () => void; refresh: () => void; departamentos: Departamento[] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    department_id: '',
    duration_years: '',
    weight_contact_hours: '',
    weight_independent_study: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, any> = {
        name: form.name,
        code: form.code,
        department_id: Number(form.department_id),
        duration_years: Number(form.duration_years),
      };
      if (form.weight_contact_hours) payload.weight_contact_hours = Number(form.weight_contact_hours);
      if (form.weight_independent_study) payload.weight_independent_study = Number(form.weight_independent_study);
      await post('/courses', payload);
      onClose();
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar curso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>Novo Curso</h3>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">class</span>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do curso" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Departamento</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">account_balance</span>
              <select className="form-select" value={form.department_id} onChange={e => set('department_id', e.target.value)} required>
                <option value="">Seleccionar departamento</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duração (anos)</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">schedule</span>
                <input className="form-input" type="number" value={form.duration_years} onChange={e => set('duration_years', e.target.value)} placeholder="Ex: 4" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Código</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">tag</span>
                <input className="form-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Código" />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Horas Contacto</label>
              <input className="form-input" type="number" value={form.weight_contact_hours} onChange={e => set('weight_contact_hours', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Estudo Independente</label>
              <input className="form-input" type="number" value={form.weight_independent_study} onChange={e => set('weight_independent_study', e.target.value)} />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A criar…' : 'Criar Curso'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InstituicaoModal({ onClose, refresh }: { onClose: () => void; refresh: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    nuit: '',
    ponto_focal_nome: '',
    ponto_focal_contacto: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await post('/institutions', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        nuit: form.nuit,
        ponto_focal_nome: form.ponto_focal_nome,
        ponto_focal_contacto: form.ponto_focal_contacto,
      });
      onClose();
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar instituição.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3>Nova Instituição</h3>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">business</span>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome da empresa" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">mail</span>
                <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.co.mz" />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">call</span>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+258..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">NUIT</label>
              <div className="inputWrapper">
                <span className="inputIcon material-symbols-outlined">fingerprint</span>
                <input className="form-input" value={form.nuit} onChange={e => set('nuit', e.target.value)} placeholder="NUIT" />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <div className="inputWrapper">
              <span className="inputIcon material-symbols-outlined">location_on</span>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Morada" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ponto Focal (Nome)</label>
              <input className="form-input" value={form.ponto_focal_nome} onChange={e => set('ponto_focal_nome', e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="form-group">
              <label className="form-label">Ponto Focal (Contacto)</label>
              <input className="form-input" value={form.ponto_focal_contacto} onChange={e => set('ponto_focal_contacto', e.target.value)} placeholder="Contacto" />
            </div>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A criar…' : 'Criar Instituição'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}