import { useAuth } from './context/AuthContext';
import { AppRouter } from './routes/AppRouter';
import { Spinner } from './components/ui/Spinner';

export default function App() {
  const { ready } = useAuth();

  if (!ready) return <Spinner />;

  return <AppRouter />;
}