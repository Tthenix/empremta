export default function Loading({ label = 'Cargando…' }) {
  return (
    <p className="loading" role="status" aria-live="polite">
      {label}
    </p>
  )
}
