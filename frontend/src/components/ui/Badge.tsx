interface BadgeProps {
  status: string;
}

const badgeMap: Record<string, [string, string]> = {
  allocated:    ['badge-blue',   'Alocado'],
  in_progress:  ['badge-yellow', 'Em Progresso'],
  submitted:    ['badge-blue',   'Submetido'],
  evaluated:    ['badge-green',  'Avaliado'],
  completed:    ['badge-green',  'Completo'],
  approved:     ['badge-green',  'Aprovado'],
  rejected:     ['badge-red',    'Rejeitado'],
  pending:      ['badge-muted',  'Pendente'],
  active:       ['badge-green',  'Activo'],
  inactive:     ['badge-muted',  'Inactivo'],
  suspended:    ['badge-red',    'Suspenso'],
};

export function Badge({ status }: BadgeProps) {
  const [cssClass, label] = badgeMap[status] || ['badge-muted', status];
  return <span className={`badge ${cssClass}`}>{label}</span>;
}