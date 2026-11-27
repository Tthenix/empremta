import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  confirmRedeem,
  ensureOnboarded,
  getAccount,
  getConfig,
  humanError,
  redeemBuild,
} from '../lib/api.js'
import { formatAmount, formatUsdc, isPlaceholder } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

function missingStops(account, costo, huellasPorVisita) {
  const needed = Math.ceil((costo || 30) / (huellasPorVisita || 10))
  const visited = new Set((account?.visits || []).map((v) => v.stopId)).size
  return Math.max(0, needed - visited)
}

export default function Redeem() {
  const [params] = useSearchParams()
  const merchantId = params.get('m') || ''
  const amountArs = params.get('monto') || ''
  const ref = params.get('ref') || ''

  const [config, setConfig] = useState(null)
  const [account, setAccount] = useState(null)
  const [built, setBuilt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureOnboarded()
        const [cfg, acc] = await Promise.all([getConfig(), getAccount()])
        if (cancelled) return
        setConfig(cfg)
        setAccount(acc)
        if (merchantId && amountArs && ref) {
          const result = await redeemBuild({ merchantId, amountArs, ref })
          if (!cancelled) setBuilt(result)
        }
      } catch (e) {
        if (!cancelled) setError(humanError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [merchantId, amountArs, ref])

  async function onConfirm() {
    if (!built?.xdr) return
    setBusy(true)
    setError('')
    try {
      setDone(await confirmRedeem({ xdr: built.xdr }))
    } catch (e) {
      setError(humanError(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Preparando el canje…" />

  if (!merchantId || !amountArs || !ref) {
    return (
      <div className="page">
        <ErrorMsg>Falta información del canje. Escaneá el QR de la caja del comercio.</ErrorMsg>
        <Link className="btn btn-primary btn-block" to="/escanear">
          Escanear el QR del comercio
        </Link>
      </div>
    )
  }

  const centroLabel = config?.centroLabel || 'Centro de Veteranos (cuenta de demostración)'

  if (done) {
    return (
      <div className="page pay">
        <section className="success-panel" role="status" aria-live="polite" aria-atomic="true">
          <h1>Canje hecho</h1>
          <p>Mostrale esta pantalla al comercio. El aporte al centro quedó registrado en la misma operación.</p>
          <TxLink hash={done.txHash} explorerTxUrl={config?.explorerTxUrl} />
        </section>
        <div className="btn-row">
          <Link className="btn btn-primary" to="/recorrido">
            Mis huellas
          </Link>
          <Link className="btn btn-secondary" to="/transparencia">
            Ver transparencia
          </Link>
        </div>
      </div>
    )
  }

  const d = built?.desglose
  const costo = config?.costoCanje || 30
  const huellas = Number(account?.huella || 0)
  const faltan = missingStops(account, costo, config?.huellasPorVisita)
  const merchantName = d?.merchant?.nombre

  return (
    <div className="page pay">
      <h1>Canjear mis Huellas</h1>
      <p className="lede">Pagás en el comercio como siempre. Acá solo se canjean tus Huellas.</p>
      <ErrorMsg>{error}</ErrorMsg>

      {!d ? (
        !error && <Loading label="Calculando el canje…" />
      ) : (
        <>
          <section className="pay-hero" aria-label="Datos del ticket">
            <p className="payment-context-label">
              Canje en{' '}
              <span className={isPlaceholder(merchantName) ? 'placeholder-inline' : 'payment-merchant'}>
                {merchantName}
              </span>
            </p>
            <p className="pay-total">
              ${formatAmount(d.totalArs, 2)} <span>ARS</span>
            </p>
            <p className="pay-saving">Pagás ese total en el comercio, por tu medio habitual.</p>
            <p className="muted">Ref. {ref}</p>
          </section>

          <ul className="breakdown">
            <li>
              <span>Ticket del comercio</span>
              <strong>${formatAmount(d.amountArs, 2)}</strong>
            </li>
            <li className="discount-row">
              <span>Tu descuento ({config?.descuentoPct ?? 10} %, tope ${formatAmount(config?.descuentoMaxArs ?? '2000', 0)})</span>
              <strong>−${formatAmount(d.discountArs, 2)}</strong>
            </li>
            <li className="total-row">
              <span>Pagás en el comercio</span>
              <strong>${formatAmount(d.totalArs, 2)}</strong>
            </li>
            <li className="emphasis centro">
              <span>El comercio aporta al {centroLabel}</span>
              <strong>{formatUsdc(d.aporteUsdc)} {config?.usdcLabel || 'USDC'}</strong>
            </li>
          </ul>

          <p className="hint">
            El aporte es {d.aportePct} % de ${formatAmount(d.totalArs, 2)} al tipo de cambio de referencia de ${formatAmount(d.arsPerUsdc, 0)} por USDC. Se registra en la misma transacción en que se usan {costo} Huellas.
          </p>
          {huellas < costo && (
            <p className="field-help">
              Tenés {formatAmount(huellas, 0)} Huellas. Te {faltan === 1 ? 'falta' : 'faltan'} {faltan || 1} lugar{faltan === 1 ? '' : 'es'} por visitar para canjear.
            </p>
          )}
          <div className="sr-status" role="status" aria-live="polite" aria-atomic="true">
            {busy ? 'Confirmando en la red. Puede tardar unos segundos.' : ''}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onConfirm}
            disabled={busy || !built || huellas < costo}
          >
            {busy ? 'Canjeando…' : 'Canjear mis Huellas'}
          </button>
        </>
      )}
    </div>
  )
}
