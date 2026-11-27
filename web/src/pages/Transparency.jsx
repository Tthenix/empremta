import { useEffect, useState } from 'react'
import { getConfig, getTransparencia, humanError } from '../lib/api.js'
import { formatDate, formatUsdc, isPlaceholder } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

export default function Transparency() {
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, t] = await Promise.all([getConfig(), getTransparencia()])
        if (cancelled) return
        setConfig(cfg)
        setData(t)
      } catch (e) {
        if (!cancelled) setError(humanError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Loading label="Cargando transparencia…" />
  if (error) return <ErrorMsg>{error}</ErrorMsg>
  if (!data) return null

  const label = config?.usdcLabel || 'USDC'
  const centroLabel = config?.centroLabel || 'Centro de Veteranos (cuenta de demostración)'
  const hasPayments = data.lista?.length > 0

  return (
    <div className="page transparency">
      <header className="transparency-hero">
        <h1>Transparencia</h1>
        <p className="lede">
          Cada pago de la ruta destina una parte al {centroLabel}. Acá se puede ver el total y
          cada transferencia en la red Stellar (testnet).
        </p>
        <p className="verification-note">
          Stellar es un registro público: cualquiera puede abrir el enlace de una operación y
          comprobar que la plata llegó a esta cuenta.
        </p>
      </header>

      <section className="summary-card" aria-labelledby="total-centro-title">
        <div>
          <p className="summary-label" id="total-centro-title">
            Recibido por el centro
          </p>
          <p className="hero-total-value">
            {formatUsdc(data.totalCentro)} <span>{label}</span>
          </p>
          <p className="hero-total-meta">
            {data.pagos} {data.pagos === 1 ? 'pago registrado' : 'pagos registrados'}
          </p>
        </div>
        {config?.explorerAccountUrl && data.centroPub && (
          <a
            className="tx-link summary-account-link"
            href={`${config.explorerAccountUrl}${data.centroPub}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver cuenta del centro en Stellar
          </a>
        )}
      </section>

      <section className="transparency-section">
        <h2>Por comercio</h2>
        {!data.porComercio?.length ? (
          <div className="empty-state">
            <p className="empty-title">Todavía no hay pagos registrados</p>
            <p>Cuando un comercio reciba un pago de la ruta, su aporte va a aparecer acá.</p>
          </div>
        ) : (
          <ul className="commerce-breakdown">
            {data.porComercio.map((c) => (
              <li key={c.merchantId}>
                <div>
                  <p className={isPlaceholder(c.nombre) ? 'placeholder-inline' : 'commerce-name'}>
                    {c.nombre}
                  </p>
                  <p className="muted">
                    {c.pagos} {c.pagos === 1 ? 'pago' : 'pagos'}
                  </p>
                </div>
                <p className="amount">
                  {formatUsdc(c.totalCentro)} <span>{label}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="transparency-section">
        <h2>Pagos verificables</h2>
        {!hasPayments ? (
          <div className="empty-state">
            <p className="empty-title">Todavía no hay pagos registrados</p>
            <p>Cada pago va a tener su enlace público para verificarlo en Stellar.</p>
          </div>
        ) : (
          <ul className="payment-list">
            {data.lista.map((p) => (
              <li key={p.txHash} className="payment-item">
                <div className="payment-main">
                  <p className={isPlaceholder(p.nombre) ? 'placeholder-inline' : 'payment-merchant'}>
                    {p.nombre}
                  </p>
                  <p className="payment-date">{formatDate(p.createdAt)}</p>
                </div>
                <div className="payment-side">
                  <p className="payment-amount">
                    {formatUsdc(p.toCentro)} <span>{label}</span>
                  </p>
                  <TxLink hash={p.txHash} explorerTxUrl={config?.explorerTxUrl} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
