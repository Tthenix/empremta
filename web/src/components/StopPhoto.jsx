/** Foto del lugar con su crédito siempre visible. `linkCredit` en false cuando la foto está dentro de otro enlace. */
export default function StopPhoto({ stop, className = '', decorative = false, linkCredit = true }) {
  if (!stop?.foto) return null
  const credit = stop.fotoCredito
  return (
    <figure className={`stop-photo ${className}`}>
      <img src={stop.foto} alt={decorative ? '' : stop.fotoAlt || `Vista de ${stop.nombre}`} loading="lazy" />
      {credit && (
        <figcaption>
          {linkCredit && stop.fotoFuente ? (
            <a href={stop.fotoFuente} target="_blank" rel="noreferrer">
              {credit}
            </a>
          ) : (
            credit
          )}
        </figcaption>
      )}
    </figure>
  )
}
