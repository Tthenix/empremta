import { useEffect, useState } from 'react'
import { getConfig, getTransparencia, humanError } from '../lib/api.js'
import { formatAmount, formatDate, isPlaceholder } from '../lib/format.js'
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

  return (
    <div className="page transparency">
      <header className="transparency-hero">
        <p className="eyebrow">Público y verificable</p>
        <h1>Transparencia</h1>
        <p className="lede">
          Cada pago de la ruta destina una parte al {centroLabel}. Acá se puede ver el total y
          cada transferencia en la red Stellar (testnet).
        </p>
      </header>

      <section className="hero-total" aria-label="Total recibido">
        <p className="hero-total-label">Recibido por el centro</p>
        <p className="hero-total-value">
          {formatAmount(data.totalCentro)} <span>{label}</span>
        </p>
        <p className="hero-total-meta">
          {data.pagos} {data.pagos === 1 ? 'pago' : 'pagos'}
        </p>
        {config?.explorerAccountUrl && data.centroPub && (
          <a
            className="tx-link"
            href={`${config.explorerAccountUrl}${data.centroPub}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver cuenta del centro en Stellar
          </a>
        )}
      </section>

      <section>
        <h2>Por comercio</h2>
        {!data.porComercio?.length ? (
          <p className="empty">Todavía no hay aportes registrados.</p>
        ) : (
          <ul className="commerce-breakdown">
            {data.porComercio.map((c) => (
              <li key={c.merchantId}>
                <div>
                  <p className={isPlaceholder(c.nombre) ? 'placeholder-inline' : ''}>
                    {c.nombre}
                  </p>
                  <p className="muted">
                    {c.pagos} {c.pagos === 1 ? 'pago' : 'pagos'}
                  </p>
                </div>
                <p className="amount">
                  {formatAmount(c.totalCentro)} {label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Últimos aportes</h2>
        {!data.lista?.length ? (
          <p className="empty">Cuando haya pagos, van a aparecer acá con su enlace a Stellar.</p>
        ) : (
          <div className="table-wrap">
            <table className="pay-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Comercio</th>
                  <th scope="col">Al centro</th>
                  <th scope="col">Transacción</th>
                </tr>
              </thead>
              <tbody>
                {data.lista.map((p) => (
                  <tr key={p.txHash}>
                    <td>{formatDate(p.createdAt)}</td>
                    <td className={isPlaceholder(p.nombre) ? 'placeholder-inline' : ''}>
                      {p.nombre}
                    </td>
                    <td>
                      {formatAmount(p.toCentro)} {label}
                    </td>
                    <td>
                      <TxLink hash={p.txHash} explorerTxUrl={config?.explorerTxUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
