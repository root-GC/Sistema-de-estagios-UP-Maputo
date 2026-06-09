// src/pages/student/StudentDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { get, post } from '../../api/api';

/* ─── Tipos ─── */
interface InternshipData {
  id: number;
  period?: { name: string; academic_year: string };
  status: string;
  supervisor?: { user?: { name: string }; academic_rank?: string };
  tutor?: { name: string; position?: string };
  institution?: { name: string };
  result?: {
    final_score: number;
    tutor_score: number;
    supervisor_score: number;
    approved: boolean;
  };
}

interface DevelopmentPlan {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
}

interface ActivityPlan {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
}

interface Journal {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  file_path?: string;
  submitted_at?: string;
}

interface PortfolioStatus {
  portfolio?: {
    id: number;
    status: string;
    documents: { id: number; document_type: string }[];
  };
  missing_documents: string[];
  is_complete: boolean;
}

interface CoordinatorInfo {
  id: number;
  name: string;
  email: string;
}

const REQUIRED_DOCS = ['development_plan', 'activity_plan', 'journal', 'project', 'final_report'];

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
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  type View = 'estagio' | 'solicitar' | 'planos' | 'diarios' | 'projetos' | 'portfolio';
  const [view, setView] = useState<View>('estagio');

  // Dados do estágio
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Coordenador do curso (para visualização)
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);

  // Planos
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>([]);
  const [actPlans, setActPlans] = useState<ActivityPlan[]>([]);
  const [formPDI, setFormPDI] = useState({ title: '', file_path: '' });
  const [formPlanoAtiv, setFormPlanoAtiv] = useState({ file_path: '' });
  const [savingPDI, setSavingPDI] = useState(false);
  const [savingPlano, setSavingPlano] = useState(false);

  // Diários
  const [journals, setJournals] = useState<Journal[]>([]);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [formJournal, setFormJournal] = useState({ title: '', content: '' });
  const [savingJournal, setSavingJournal] = useState(false);

  // Projetos
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [formProject, setFormProject] = useState({ title: '', description: '', file_path: '' });
  const [savingProject, setSavingProject] = useState(false);

  // Portefólio
  const [portfolio, setPortfolio] = useState<PortfolioStatus | null>(null);
  const [submittingPortfolio, setSubmittingPortfolio] = useState(false);
  const [portfolioMsg, setPortfolioMsg] = useState('');

  // Solicitação de estágio
  const [empresas, setEmpresas] = useState<string[]>(['', '', '', '', '']);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  // Carregar dados do dashboard
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await get<{ internship: InternshipData | null }>('/dashboard');
      if (res.internship) {
        setInternship(res.internship);
        // Carregar dados relacionados
        const [dev, act, jour, proj, port] = await Promise.all([
          get<DevelopmentPlan[]>(`/internships/${res.internship.id}/development-plans`).catch(() => [] as DevelopmentPlan[]),
          get<ActivityPlan[]>(`/internships/${res.internship.id}/activity-plans`).catch(() => [] as ActivityPlan[]),
          get<Journal[]>(`/internships/${res.internship.id}/journals`).catch(() => [] as Journal[]),
          get<Project[]>(`/internships/${res.internship.id}/projects`).catch(() => [] as Project[]),
          get<PortfolioStatus>(`/internships/${res.internship.id}/portfolio`).catch(() => null),
        ]);
        setDevPlans(dev || []);
        setActPlans(act || []);
        setJournals(jour || []);
        setProjects(proj || []);
        setPortfolio(port);
      } else {
        setInternship(null);
      }
      // Buscar coordenador do curso (para exibição na aba solicitar)
      const coordRes = await get<{ data: CoordinatorInfo }>('/dashboard/coordinator').catch(() => null);
      if (coordRes?.data) setCoordinator(coordRes.data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Atualizar array de empresas
  const updateEmpresa = (index: number, value: string) => {
    const newEmpresas = [...empresas];
    newEmpresas[index] = value;
    setEmpresas(newEmpresas);
  };

  // Enviar requisição de estágio
  const submitInternshipRequest = async (e: FormEvent) => {
    e.preventDefault();
    const filled = empresas.filter(e => e.trim() !== '');
    if (filled.length === 0) {
      alert('Indique pelo menos uma empresa.');
      return;
    }
    setSendingRequest(true);
    setRequestMsg('');
    try {
      await post('/internships/request', {
        empresas_pretendidas: filled,
      });
      setRequestMsg('Requisição enviada com sucesso! Aguarde a aprovação do coordenador.');
      setEmpresas(['', '', '', '', '']);
      fetchDashboard(); // recarregar para mostrar o estágio pendente
    } catch (err: any) {
      alert(err?.message || 'Erro ao enviar requisição.');
    } finally {
      setSendingRequest(false);
    }
  };

  // Submeter PDI
  const submitPDI = async (e: FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setSavingPDI(true);
    try {
      await post(`/internships/${internship.id}/development-plans`, formPDI);
      setFormPDI({ title: '', file_path: '' });
      const plans = await get<DevelopmentPlan[]>(`/internships/${internship.id}/development-plans`);
      setDevPlans(plans);
    } catch (err: any) {
      alert(err?.message || 'Erro ao submeter PDI.');
    } finally {
      setSavingPDI(false);
    }
  };

  // Submeter Plano de Actividades
  const submitPlanoAtiv = async (e: FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setSavingPlano(true);
    try {
      await post(`/internships/${internship.id}/activity-plans`, formPlanoAtiv);
      setFormPlanoAtiv({ file_path: '' });
      const plans = await get<ActivityPlan[]>(`/internships/${internship.id}/activity-plans`);
      setActPlans(plans);
    } catch (err: any) {
      alert(err?.message || 'Erro ao submeter plano.');
    } finally {
      setSavingPlano(false);
    }
  };

  // Submeter Diário
  const submitJournal = async (e: FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setSavingJournal(true);
    try {
      await post(`/internships/${internship.id}/journals`, formJournal);
      setFormJournal({ title: '', content: '' });
      setShowJournalForm(false);
      const j = await get<Journal[]>(`/internships/${internship.id}/journals`);
      setJournals(j);
    } catch (err: any) {
      alert(err?.message || 'Erro ao guardar diário.');
    } finally {
      setSavingJournal(false);
    }
  };

  // Submeter Projeto
  const submitProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setSavingProject(true);
    try {
      await post(`/internships/${internship.id}/projects`, formProject);
      setFormProject({ title: '', description: '', file_path: '' });
      setShowProjectForm(false);
      const p = await get<Project[]>(`/internships/${internship.id}/projects`);
      setProjects(p);
    } catch (err: any) {
      alert(err?.message || 'Erro ao submeter projeto.');
    } finally {
      setSavingProject(false);
    }
  };

  // Portefólio: adicionar documento
  const addPortfolioDoc = async (type: string) => {
    if (!internship) return;
    try {
      await post(`/internships/${internship.id}/portfolio/document`, {
        document_type: type,
        file_path: `uploads/${type}_${Date.now()}.pdf`,
      });
      const port = await get<PortfolioStatus>(`/internships/${internship.id}/portfolio`);
      setPortfolio(port);
      setPortfolioMsg(`Documento "${type}" adicionado.`);
    } catch (err: any) {
      alert(err?.message || 'Erro ao adicionar documento.');
    }
  };

  // Portefólio: submeter
  const submitPortfolio = async () => {
    if (!internship) return;
    setSubmittingPortfolio(true);
    setPortfolioMsg('');
    try {
      await post(`/internships/${internship.id}/portfolio/submit`, {});
      const port = await get<PortfolioStatus>(`/internships/${internship.id}/portfolio`);
      setPortfolio(port);
      setPortfolioMsg('Portefólio submetido com sucesso!');
    } catch (err: any) {
      alert(err?.message || 'Erro ao submeter portefólio.');
    } finally {
      setSubmittingPortfolio(false);
    }
  };

  const presentDocs = portfolio?.portfolio?.documents?.map(d => d.document_type) || [];
  const missingDocs = REQUIRED_DOCS.filter(d => !presentDocs.includes(d));
  const portfolioComplete = missingDocs.length === 0;

  if (loading) return <Spinner />;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Estágios UP</h1>
          <span>Estagiário</span>
        </div>
        <nav className="nav">
          {[
            ['estagio', 'school', 'Meu Estágio'],
            ['solicitar', 'send', 'Solicitar Estágio'],
            ['planos', 'assignment', 'Planos'],
            ['diarios', 'book', 'Diários'],
            ['projetos', 'emoji_objects', 'Projetos'],
            ['portfolio', 'task_alt', 'Portefólio'],
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
              <div className="user-role">Estagiário</div>
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
              <input className="search-input" placeholder="Pesquisar..." readOnly />
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
                <div style={{ fontSize: 10, opacity: 0.8 }}>Estagiário</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {error && <Alert>{error}</Alert>}

          {/* ─── Meu Estágio ─── */}
          {view === 'estagio' && (
            <>
              {!internship ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Alert type="info">Ainda não tem estágio atribuído. Vá à aba "Solicitar Estágio" para fazer o seu pedido.</Alert>
                </div>
              ) : (
                <>
                  <div className="page-title">O Meu Estágio</div>
                  <div className="page-subtitle">{internship.period?.name || internship.period?.academic_year}</div>

                  <div className="grid grid-3 mb-4">
                    <div className="stat-card">
                      <div className="stat-label">Estado</div>
                      <div className="mt-2"><Badge status={internship.status} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Supervisor</div>
                      <div style={{ marginTop: 6, fontWeight: 500 }}>{internship.supervisor?.user?.name || '—'}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Tutor</div>
                      <div style={{ marginTop: 6, fontWeight: 500 }}>{internship.tutor?.name || 'Não atribuído'}</div>
                      {internship.tutor && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{internship.institution?.name}</div>}
                    </div>
                  </div>

                  {internship.result && (
                    <div className="card mb-4">
                      <div className="card-title">Resultado Final</div>
                      <div className="flex gap-4 items-center">
                        <span className={`badge ${internship.result.approved ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 24 }}>
                          {internship.result.final_score}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Tutor: {internship.result.tutor_score}</div>
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Supervisor: {internship.result.supervisor_score}</div>
                          <Badge status={internship.result.approved ? 'approved' : 'rejected'} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ─── Solicitar Estágio ─── */}
          {view === 'solicitar' && (
            <div>
              <div className="page-title">Solicitar Estágio</div>
              <div className="page-subtitle">Indique até 5 empresas onde gostaria de estagiar</div>

              {coordinator && (
                <div className="card mb-4" style={{ maxWidth: 400 }}>
                  <div className="card-title">Coordenador do Curso</div>
                  <div>{coordinator.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{coordinator.email}</div>
                </div>
              )}

              {requestMsg && <Alert type="success">{requestMsg}</Alert>}

              <div className="card" style={{ maxWidth: 500 }}>
                <form onSubmit={submitInternshipRequest}>
                  {empresas.map((emp, idx) => (
                    <div className="form-group" key={idx}>
                      <label className="form-label">Empresa {idx + 1}</label>
                      <input
                        className="form-input"
                        value={emp}
                        onChange={e => updateEmpresa(idx, e.target.value)}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary" disabled={sendingRequest}>
                    {sendingRequest ? 'A enviar…' : 'Enviar Requisição'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ─── Planos (PDI + Plano de Actividades) ─── */}
          {view === 'planos' && internship && (
            <div>
              <div className="page-title">Planos de Desenvolvimento e Actividades</div>
              <div className="page-subtitle">Submeter PDI e Plano de Actividades para aprovação</div>

              <div className="grid grid-2">
                {/* PDI */}
                <div className="card">
                  <div className="card-title">Plano de Desenvolvimento Individual (PDI)</div>
                  <form onSubmit={submitPDI} style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input className="form-input" value={formPDI.title} onChange={e => setFormPDI(f => ({ ...f, title: e.target.value }))} placeholder="Título do PDI" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ficheiro (caminho simulado)</label>
                      <input className="form-input" value={formPDI.file_path} onChange={e => setFormPDI(f => ({ ...f, file_path: e.target.value }))} placeholder="Ex: uploads/pdi_meu.pdf" />
                    </div>
                    <button className="btn btn-primary" disabled={savingPDI}>{savingPDI ? 'A submeter…' : 'Submeter PDI'}</button>
                  </form>
                  <hr />
                  {devPlans.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum PDI submetido.</p>}
                  {devPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center" style={{ padding: '8px 0' }}>
                      <div><strong>{p.title}</strong><br /><span style={{ fontSize: 11 }}>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('pt-PT') : ''}</span></div>
                      <Badge status={p.status} />
                    </div>
                  ))}
                </div>

                {/* Plano de Actividades */}
                <div className="card">
                  <div className="card-title">Plano de Actividades</div>
                  <form onSubmit={submitPlanoAtiv} style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Ficheiro (caminho simulado)</label>
                      <input className="form-input" value={formPlanoAtiv.file_path} onChange={e => setFormPlanoAtiv(f => ({ ...f, file_path: e.target.value }))} placeholder="Ex: uploads/plano_ativ.pdf" />
                    </div>
                    <button className="btn btn-primary" disabled={savingPlano}>{savingPlano ? 'A submeter…' : 'Submeter Plano'}</button>
                  </form>
                  <hr />
                  {actPlans.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum plano submetido.</p>}
                  {actPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center" style={{ padding: '8px 0' }}>
                      <div><span style={{ fontSize: 11 }}>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('pt-PT') : ''}</span></div>
                      <Badge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Diários ─── */}
          {view === 'diarios' && internship && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Diários Reflexivos</div>
                  <div className="page-subtitle">Registo das actividades no sector laboral</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowJournalForm(!showJournalForm)}>
                  {showJournalForm ? 'Cancelar' : '+ Novo Diário'}
                </button>
              </div>

              {showJournalForm && (
                <div className="card mb-4">
                  <form onSubmit={submitJournal}>
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input className="form-input" value={formJournal.title} onChange={e => setFormJournal(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Semana 1 — Integração" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Conteúdo</label>
                      <textarea className="form-textarea" rows={5} value={formJournal.content} onChange={e => setFormJournal(f => ({ ...f, content: e.target.value }))} placeholder="Descreva as actividades..." required />
                    </div>
                    <button className="btn btn-primary" disabled={savingJournal}>{savingJournal ? 'A guardar…' : 'Guardar Diário'}</button>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {journals.map(j => (
                  <div key={j.id} className="card">
                    <div className="flex justify-between items-center mb-2">
                      <div style={{ fontWeight: 600 }}>{j.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(j.created_at).toLocaleDateString('pt-PT')}</div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{j.content}</p>
                  </div>
                ))}
                {journals.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40 }}>Nenhum diário registado.</div>}
              </div>
            </div>
          )}

          {/* ─── Projetos ─── */}
          {view === 'projetos' && internship && (
            <div>
              <div className="section-header">
                <div>
                  <div className="page-title">Projetos Experimentais</div>
                  <div className="page-subtitle">Submeter projetos de melhoria ou resolução de problemas</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowProjectForm(!showProjectForm)}>
                  {showProjectForm ? 'Cancelar' : '+ Novo Projeto'}
                </button>
              </div>

              {showProjectForm && (
                <div className="card mb-4">
                  <form onSubmit={submitProject}>
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input className="form-input" value={formProject.title} onChange={e => setFormProject(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Descrição</label>
                      <textarea className="form-textarea" rows={3} value={formProject.description} onChange={e => setFormProject(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ficheiro (caminho simulado)</label>
                      <input className="form-input" value={formProject.file_path} onChange={e => setFormProject(f => ({ ...f, file_path: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary" disabled={savingProject}>{savingProject ? 'A submeter…' : 'Submeter Projeto'}</button>
                  </form>
                </div>
              )}

              {projects.map(p => (
                <div key={p.id} className="card mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>{p.title}</strong>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.description}</div>
                      <div style={{ fontSize: 11 }}>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('pt-PT') : ''}</div>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40 }}>Nenhum projeto submetido.</div>}
            </div>
          )}

          {/* ─── Portefólio ─── */}
          {view === 'portfolio' && internship && (
            <div>
              <div className="page-title">Portefólio Final</div>
              <div className="page-subtitle">Submissão do portefólio com todos os documentos obrigatórios</div>

              {portfolioMsg && <Alert type="success">{portfolioMsg}</Alert>}

              <div className="grid grid-2">
                <div className="card">
                  <div className="card-title">Documentos Obrigatórios</div>
                  {REQUIRED_DOCS.map(doc => {
                    const done = presentDocs.includes(doc);
                    return (
                      <div key={doc} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{done ? '✅' : '⬜'} {doc.replace(/_/g, ' ')}</span>
                        {!done && (
                          <button className="btn btn-sm btn-secondary" onClick={() => addPortfolioDoc(doc)}>+ Adicionar</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <div className="card-title">Submissão</div>
                  <div className="mb-4">
                    <div className="stat-label">Estado</div>
                    <Badge status={portfolio?.portfolio?.status || 'pending'} />
                  </div>
                  <div className="mb-4">
                    <div className="stat-label">Progresso</div>
                    <span>{presentDocs.length}/{REQUIRED_DOCS.length}</span>
                    <div className="progress-bar mt-2">
                      <div className="progress-fill" style={{ width: `${(presentDocs.length / REQUIRED_DOCS.length) * 100}%` }} />
                    </div>
                  </div>
                  {!portfolioComplete && <Alert type="info">Documentos em falta: {missingDocs.join(', ')}</Alert>}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={!portfolioComplete || submittingPortfolio || portfolio?.portfolio?.status === 'submitted'}
                    onClick={submitPortfolio}
                  >
                    {submittingPortfolio ? 'A submeter…' : portfolio?.portfolio?.status === 'submitted' ? '✓ Já Submetido' : 'Submeter Portefólio'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!internship && view !== 'estagio' && view !== 'solicitar' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Alert type="info">Sem estágio atribuído. Não é possível aceder a esta secção.</Alert>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}