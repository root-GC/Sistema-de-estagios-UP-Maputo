// src/routes/AppRouter.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';

// Páginas de autenticação
import { LoginPage }          from '../pages/auth/LoginPage';
import { RegisterPage }       from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage }  from '../pages/auth/ResetPasswordPage';

// Páginas comuns
import { Home }          from '../pages/common/Home';
import { NotFound }      from '../pages/common/NotFound';
import { Notifications } from '../pages/common/Notifications';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';

// Coordenador
import  CoordinatorDashboard  from '../pages/coordinator/CoordinatorDashboard';
import { InternshipList }       from '../pages/coordinator/InternshipList';
import { AllocateForm }         from '../pages/coordinator/AllocateForm';
import { GradeSheets }          from '../pages/coordinator/GradeSheets';
import { Institutions }         from '../pages/coordinator/Institutions';

// Supervisor
import { SupervisorDashboard } from '../pages/supervisor/SupervisorDashboard';

// Estudante
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { Journals }         from '../pages/student/Journals';
import { Portfolio }        from '../pages/student/Portfolio';

//Chefe da repartição
import ChefeDashboard from '../pages/chefe/ChefeDashboard';


// ── Ecrã público de autenticação (já isolado) ────────────
function AuthGate() {
  const { authScreen } = useAuth();

  if (authScreen === 'register') return <RegisterPage />;
  if (authScreen === 'forgot')   return <ForgotPasswordPage />;
  if (authScreen === 'reset-password')    return <ResetPasswordPage />;
  return <LoginPage />;
}

export function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ─── Páginas específicas de função (protegidas) ─── */}
      <Route
        path="/chefe"
        element={
          <ProtectedRoute roles={['dept_head']}>
            <ChefeDashboard />
          </ProtectedRoute>
        }
      />

      {/* ─── Páginas públicas de autenticação ─── */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthGate />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/" replace /> : <AuthGate />}
      />

      {/* ─── Páginas protegidas (todas isoladas) ─── */}

      {/* Home (pode ser um dashboard simples ou redirecionamento) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Notificações */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Coordenador */}
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute roles={['coordinator']}>
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institutions"
        element={
          <ProtectedRoute roles={['dept_head', 'admin']}>
            <Institutions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/internships"
        element={
          <ProtectedRoute roles={['coordinator', 'admin', 'dept_head']}>
            <InternshipList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/allocate"
        element={
          <ProtectedRoute roles={['coordinator', 'admin']}>
            <AllocateForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gradesheets"
        element={
          <ProtectedRoute roles={['coordinator', 'admin']}>
            <GradeSheets />
          </ProtectedRoute>
        }
      />

      {/* Supervisor */}
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute roles={['supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Estudante */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journals"
        element={
          <ProtectedRoute roles={['student']}>
            <Journals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute roles={['student']}>
            <Portfolio />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}