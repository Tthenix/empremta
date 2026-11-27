export function MerchantLogo({ merchant, size = 56 }) {
  if (!merchant?.logo) return null
  return <img className="merchant-logo" src={merchant.logo} alt={`Logo de ${merchant.nombre}`} width={size} height={size} />
}

/** Tarjeta del beneficio: qué comercio, qué descuento y a quién ayuda. */
export default function MerchantOffer({ merchants, config, ready = false }) {
  if (!merchants.length) return null
  const pct = config?.descuentoPct ?? 10
  const centro = config?.centroLabel || 'Centro de Veteranos'
  return (
    <div className={ready ? 'merchant-offer is-ready' : 'merchant-offer'}>
      {merchants.map((m) => (
        <div key={m.id} className="merchant-offer-row">
          <MerchantLogo merchant={m} />
          <div>
            <p className="merchant-offer-pct">{pct}% de descuento</p>
            <p className="merchant-offer-name">en {m.nombre}</p>
          </div>
        </div>
      ))}
      <p className="merchant-offer-text">
        {ready ? 'Ya completaste la ruta: el descuento es tuyo.' : 'Para quienes completan las tres huellas.'} Cada compra
        además aporta al {centro}.
      </p>
    </div>
  )
}
