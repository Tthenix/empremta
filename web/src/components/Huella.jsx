/** Isotipo Empremta como marca de progreso: llena = lugar visitado. */
export default function Huella({ filled = false, size = 40, className = '' }) {
  return (
    <img
      src="/brand/empremta-isotipo-medio-color.svg"
      alt=""
      width={size}
      height={Math.round(size * 1.25)}
      className={`huella ${filled ? 'is-filled' : 'is-empty'} ${className}`}
    />
  )
}

export function HuellaRow({ total, filled, size = 40 }) {
  return (
    <span className="huella-row" role="img" aria-label={`${filled} de ${total} huellas`}>
      {Array.from({ length: total }, (_, i) => (
        <Huella key={i} filled={i < filled} size={size} />
      ))}
    </span>
  )
}
