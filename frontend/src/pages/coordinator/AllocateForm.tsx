import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { get, post } from '../../api/api';
import { Alert } from '../../components/ui/Alert';

interface Supervisor {
  id: number;
  user?: { name: string };
  active_students: number;
}

interface Period {
  id: number;
  name: string;
  academic_year: string;
}

interface Institution {
  id: number;
  name: string;
}

interface Tutor {
  id: number;
  name: string;
  position: string;
}

export function AllocateForm() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    supervisor_id: '',
    period_id: '',
    institution_id: '',
    tutor_id: '',
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    get<{ supervisors: Supervisor[]; periods: Period[]; institutions: Institution[] }>('/dashboard').then(d => {
      setSupervisors(d.supervisors || []);
      setPeriods(d.periods || []);
      setInstitutions(d.institutions || []);
    });
    get<Institution[]>('/institutions').then(inst => setInstitutions(inst));
  }, []);

  const onInstitutionChange = (id: string) => {
    setForm(f => ({ ...f, institution_id: id, tutor_id: '' }));
    if (id) {
      get<Tutor[]>(`/institutions/${id}/tutors`).then(setTutors);
    } else {
      setTutors([]);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await post('/internships/allocate', {
        student_id: Number(form.student_id),
        supervisor_id: Number(form.supervisor_id),
        period_id: Number(form.period_id),
        institution_id: form.institution_id ? Number(form.institution_id) : undefined,
        tutor_id: form.tutor_id ? Number(form.tutor_id) : undefined,
      });
      setResult(r);
    } catch (err: any) {
      setError(err.message || JSON.stringify(err.errors || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-title">Alocar Estagiário</div>
      <div className="page-subtitle">
        RF-002 · RF-004 — Alocação com verificação de pré-requisitos e limite de supervisor
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card">
          {error && <Alert>{error}</Alert>}
          {result && <Alert type="success">Estágio criado com sucesso! ID #{result.id}</Alert>}

          <Alert type="info">
            <strong>Regras aplicadas:</strong>
            <br />
            · Máx. 5 estudantes por supervisor (RF-002)
            <br />
            · Estudante deve ter concluído 3º ano (curso 4a) ou 4º ano (curso 5a) (RF-004)
          </Alert>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">ID do Estudante</label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 1"
                value={form.student_id}
                onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Estudante 1 (OK): ID 1 · Estudante 3 (NOK, 2º ano): ID 3
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Supervisor</label>
              <select
                className="form-select"
                value={form.supervisor_id}
                onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}
              >
                <option value="">-- Seleccionar --</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.active_students}/5 estudantes)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Período</label>
              <select
                className="form-select"
                value={form.period_id}
                onChange={e => setForm(f => ({ ...f, period_id: e.target.value }))}
              >
                <option value="">-- Seleccionar --</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.academic_year})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Instituição (opcional)</label>
              <select
                className="form-select"
                value={form.institution_id}
                onChange={e => onInstitutionChange(e.target.value)}
              >
                <option value="">-- Nenhuma --</option>
                {institutions.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            {tutors.length > 0 && (
              <div className="form-group">
                <label className="form-label">Tutor</label>
                <select
                  className="form-select"
                  value={form.tutor_id}
                  onChange={e => setForm(f => ({ ...f, tutor_id: e.target.value }))}
                >
                  <option value="">-- Seleccionar --</option>
                  {tutors.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.position}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'A processar…' : 'Alocar Estagiário'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}