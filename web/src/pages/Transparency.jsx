import { useEffect, useState } from 'react'
import { getConfig, getTransparencia, humanError } from '../lib/api.js'
import { formatDate, formatUsdc, isPlaceholder } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

function shortPubkey(pubkey) {
  if (!pubkey || pubkey.length < 18) return pubkey || '—'
  return `${pubkey.slice(0, 10)}…${pubkey.slice(-8)}`
}

function paymentsForDisplay(data) {
  const dbPayments = data.lista || []
  if (data.onChain?.source !== 'horizon') return dbPayments

  const dbByHash = new Map(dbPayments.map((payment) => [payment.txHash, payment]))
  return (data.onChain.lista || []).map((payment) => {
    const match = dbByHash.get(payment.txHash)
    return {
      txHash: payment.txHash,
      merchantId: match?.merchantId || null,
      nombre: match?.nombre || 'Otro aporte',
      toCentro: payment.amount,
      createdAt: payment.createdAt,
    }
  })
}

export default function Transparency() {
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

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

  useEffect(() => {
    if (data?.onChain?.source !== 'horizon') return undefined
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [data?.onChain?.source])

  if (loading) return <Loading label="Cargando transparencia…" />
  if (error) return <ErrorMsg>{error}</ErrorMsg>
  if (!data) return null

  const label = config?.usdcLabel || 'USDC'
  const centroLabel = config?.centroLabel || 'Centro de Veteranos (cuenta de demostración)'
  const onChain = data.onChain?.source === 'horizon' ? data.onChain : null
  const visiblePayments = paymentsForDisplay(data)
  const hasPayments = visiblePayments.length > 0
  const totalCentro = onChain?.totalRecibido || data.totalCentro
  const paymentCount = onChain?.pagos ?? data.pagos
  const chainAgeSeconds = onChain
    ? Math.max(0, Math.floor((now - onChain.fetchedAt) / 1000))
    : null

  return (
    <div className="page transparency">
      <header className="transparency-hero">
        <h1>Aportes a veteranos</h1>
        <p className="lede">
          Cada pago de la ruta destina una parte al {centroLabel}. El total y cada transferencia
          quedan visibles en la red Stellar (testnet).
        </p>
      </header>

      <section className="summary-card" aria-labelledby="total-centro-title">
        <div className="summary-total">
          <p className="summary-label" id="total-centro-title">
            Recibido por el centro
          </p>
          <p className="hero-total-value">
            <span className="hero-total-number" style={{ "--digits": formatUsdc(totalCentro).length }}>
              {formatUsdc(totalCentro)}
            </span>
            <span className="hero-total-unit">{label}</span>
          </p>
          <p className="hero-total-meta">
            {paymentCount} {paymentCount === 1 ? 'pago registrado' : 'pagos registrados'}
          </p>
        </div>
        <div className="summary-proof">
          <p className="verification-note">
            Stellar es un registro público: cualquiera puede abrir el enlace de una operación y
            comprobar que la plata llegó a esta cuenta.
          </p>
          {onChain ? (
            <p className="chain-read-line">
              Leído directamente de la red Stellar · actualizado hace {chainAgeSeconds} s
            </p>
          ) : (
            <p className="chain-read-line">
              No se pudo leer la red Stellar ahora; el total grande viene de la base de datos de
              la aplicación.
            </p>
          )}
          {config?.explorerAccountUrl && data.centroPub && (
            <a
              className="tx-link tx-link-inverse summary-account-link"
              href={`${config.explorerAccountUrl}${data.centroPub}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver cuenta del centro en Stellar
            </a>
          )}
        </div>
      </section>

      <section className="transparency-section" aria-labelledby="por-comercio-title">
        <h2 id="por-comercio-title">Por comercio</h2>
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

      <section className="transparency-section" aria-labelledby="pagos-verificables-title">
        <h2 id="pagos-verificables-title">Pagos verificables</h2>
        {!hasPayments ? (
          <div className="empty-state">
            <p className="empty-title">Todavía no hay pagos registrados</p>
            <p>Cada pago va a tener su enlace público para verificarlo en Stellar.</p>
          </div>
        ) : (
          <ul className="payment-list">
            {visiblePayments.map((p) => (
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

      {data.revocaciones?.length > 0 && (
        <section className="transparency-section revocation-section" aria-labelledby="revocaciones-title">
          <h2 id="revocaciones-title">Cuentas suspendidas por el centro</h2>
          <p className="muted">
            Si el centro detecta fraude puede suspender el uso de Huellas. La suspensión también
            queda registrada públicamente en Stellar.
          </p>
          <ul className="revocation-list">
            {data.revocaciones.map((revocation) => (
              <li key={`${revocation.pubkey}-${revocation.txHash}`}>
                <div className="revocation-main">
                  <p className="revocation-key" title={revocation.pubkey}>
                    {shortPubkey(revocation.pubkey)}
                  </p>
                  <p className="payment-date">{formatDate(revocation.createdAt)}</p>
                </div>
                <TxLink hash={revocation.txHash} explorerTxUrl={config?.explorerTxUrl} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
