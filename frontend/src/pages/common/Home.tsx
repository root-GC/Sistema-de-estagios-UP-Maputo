import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Home() {
  const { user, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (hasRole('admin'))        return <Navigate to="/admin" replace />;
  if (hasRole('coordinator'))  return <Navigate to="/coordinator" replace />;
  if (hasRole('supervisor'))   return <Navigate to="/supervisor" replace />;
  if (hasRole('student'))      return <Navigate to="/student" replace />;
  if (hasRole('dept_head'))    return <Navigate to="/chefe" replace />;

  // fallback
  return <Navigate to="/notifications" replace />;
}