import { useEffect, useState } from 'react';
import { get } from '../../api/api';
import { Spinner } from '../../components/ui/Spinner';

interface AuditLog {
  id: number;
  user?: { name: string };
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ data: AuditLog[] }>('/audit-logs')
      .then(r => setLogs(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-title">Logs de Auditoria</div>
      <div className="page-subtitle">Rastreabilidade completa de todas as acções no sistema</div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilizador</th>
                <th>Acção</th>
                <th>Tipo de Entidade</th>
                <th>ID Entidade</th>
                <th>Descrição</th>
                <th>Data / Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)' }}>person</span>
                      {log.user?.name || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.entity_type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.entity_id}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.description}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('pt-PT')}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle' }}>info</span>
                    {' '}Nenhum registo de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}