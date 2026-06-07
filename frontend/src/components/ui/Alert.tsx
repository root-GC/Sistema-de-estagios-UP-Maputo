interface AlertProps {
  type?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}

const iconMap = {
  error:   'error',
  success: 'check_circle',
  info:    'info',
};

export function Alert({ type = 'error', children }: AlertProps) {
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
        {iconMap[type]}
      </span>
      <span>{children}</span>
    </div>
  );
}