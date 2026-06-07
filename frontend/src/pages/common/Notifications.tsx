import { useEffect, useState } from 'react';
import { get, patch } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    get<{ data: Notification[] }>('/notifications')
      .then(r => setNotifs(r.data || []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await patch('/notifications/mark-all-read', {});
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  if (loading) return <Spinner />;

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Notificações</div>
          <div className="page-subtitle">{unread} não lidas</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAll}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="grid" style={{ gap: 8 }}>
        {notifs.map(n => (
          <div
            key={n.id}
            className="card"
            style={{
              borderLeft: `3px solid ${n.is_read ? 'var(--border)' : 'var(--accent)'}`,
              opacity: n.is_read ? 0.6 : 1,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
              <div
                style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}
              >
                {new Date(n.created_at).toLocaleString('pt-PT')}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{n.message}</p>
          </div>
        ))}
        {notifs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
            Sem notificações.
          </div>
        )}
      </div>
    </div>
  );
}