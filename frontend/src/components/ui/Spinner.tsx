export function Spinner() {
  return (
    <div className="loading" role="status" aria-label="A carregar">
      <span className="spinner-icon material-symbols-outlined">progress_activity</span>
      <span>A carregar…</span>
    </div>
  );
}