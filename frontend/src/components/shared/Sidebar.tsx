import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/helpers';

interface NavItem {
  path: string;
  icon: string;          // nome do ícone Material Symbols
  label: string;
  roles?: string[] | null;
}

const navItems: NavItem[] = [
  { path: '/',                icon: 'dashboard',        label: 'Dashboard',        roles: null },
  { path: '/admin/users',    icon: 'group',             label: 'Utilizadores',     roles: ['admin'] },
  { path: '/admin/audit',    icon: 'history',           label: 'Auditoria',       roles: ['admin'] },
  { path: '/coordinator',    icon: 'apartment',         label: 'Instituições',     roles: ['dept_head', 'admin'] },
  { path: '/internships',    icon: 'assignment',        label: 'Estágios',        roles: ['coordinator', 'admin', 'dept_head'] },
  { path: '/allocate',       icon: 'link',              label: 'Alocar',          roles: ['coordinator', 'admin'] },
  { path: '/gradesheets',    icon: 'bar_chart',         label: 'Pautas',          roles: ['coordinator', 'admin'] },
  { path: '/supervisor',     icon: 'school',            label: 'Os Meus Estudantes', roles: ['supervisor'] },
  { path: '/student',        icon: 'workspace_premium', label: 'O Meu Estágio',   roles: ['student'] },
  { path: '/journals',       icon: 'book',              label: 'Diários',         roles: ['student'] },
  { path: '/portfolio',      icon: 'folder_open',       label: 'Portefólio',      roles: ['student'] },
  { path: '/notifications',  icon: 'notifications',     label: 'Notificações',    roles: null },
];

export function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visible = navItems.filter(i => !i.roles || hasRole(...i.roles));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Estágios UP</h1>
        <span>Universidade Pedagógica</span>
      </div>

      <nav className="nav">
        {visible.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
          >
            <span className="nav-icon material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{initials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.roles?.[0]}</div>
          </div>
          <button
            className="btn btn-secondary btn-sm logout-btn"
            onClick={handleLogout}
            title="Terminar sessão"
            aria-label="Terminar sessão"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}