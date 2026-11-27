import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  confirmPay,
  ensureOnboarded,
  getAccount,
  getConfig,
  humanError,
  payBuild,
} from '../lib/api.js'
import { formatUsdc, isPlaceholder } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

export default function Pay() {
  const [params] = useSearchParams()
  const merchantId = params.get('m') || ''
  const amount = params.get('monto') || ''
  const ref = params.get('ref') || ''

  const [config, setConfig] = useState(null)
  const [account, setAccount] = useState(null)
  const [useHuellas, setUseHuellas] = useState(true)
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
        const huellas = Number(acc.huella || 0)
        const can = huellas >= (cfg.costoCanje || 30)
        setUseHuellas(can)
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
    if (loading || !merchantId || !amount || !ref) return
    let cancelled = false
    ;(async () => {
      setError('')
      setBuilt(null)
      try {
        const result = await payBuild({
          merchantId,
          amount,
          ref,
          useHuellas,
        })
        if (!cancelled) setBuilt(result)
      } catch (e) {
        if (!cancelled) setError(humanError(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loading, merchantId, amount, ref, useHuellas])

  async function onConfirm() {
    if (!built?.xdr) return
    setBusy(true)
    setError('')
    try {
      const result = await confirmPay({
        merchantId,
        amount,
        ref,
        useHuellas,
        xdr: built.xdr,
      })
      setDone(result)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Preparando el pago…" />

  if (!merchantId || !amount || !ref) {
    return (
      <div className="page">
        <ErrorMsg>Falta información del cobro. Escaneá el QR del comercio.</ErrorMsg>
        <Link className="btn" to="/">
          Ir al inicio
        </Link>
      </div>
    )
  }

  const label = config?.usdcLabel || 'USDC'
  const centroLabel = config?.centroLabel || 'Centro de Veteranos (cuenta de demostración)'

  if (done) {
    const d = done.desglose || built?.desglose
    return (
      <div className="page pay">
        <section className="success-panel" role="status" aria-live="polite" aria-atomic="true">
          <h1>Pago hecho</h1>
          <p>Gracias. El apoyo al centro quedó registrado en la misma operación.</p>
          {d && (
            <ul className="breakdown done">
              <li>
                <span>Al comercio</span>
                <strong>
                  {formatUsdc(d.toMerchant)} {label}
                </strong>
              </li>
              <li>
                <span>Al centro</span>
                <strong>
                  {formatUsdc(d.toCentro)} {label}
                </strong>
              </li>
            </ul>
          )}
          <TxLink hash={done.txHash} explorerTxUrl={config?.explorerTxUrl} />
        </section>
        <div className="btn-row">
          <Link className="btn" to="/transparencia">
            Ver transparencia
          </Link>
          <Link className="btn btn-secondary" to="/recorrido">
            Mi recorrido
          </Link>
        </div>
      </div>
    )
  }

  const d = built?.desglose
  const costo = config?.costoCanje || 30
  const huellas = Number(account?.huella || 0)
  const canToggle = huellas >= costo
  const merchantName = d?.merchant?.nombre

  return (
    <div className="page pay">
      <h1>Confirmar pago</h1>
      <p className="lede">Revisá el desglose antes de confirmar. Nada se firma solo.</p>
      <ErrorMsg>{error}</ErrorMsg>

      {!d ? (
        <Loading label="Calculando desglose…" />
      ) : (
        <>
          <section className="payment-context" aria-label="Datos del cobro">
            <p className="payment-context-label">Cobro de</p>
            <p className={isPlaceholder(merchantName) ? 'placeholder-inline' : 'payment-merchant'}>
              {merchantName}
            </p>
            <p className="muted">Ref. {ref}</p>
          </section>

          <ul className="breakdown">
            <li>
              <span>Total del cobro</span>
              <strong>
                {formatUsdc(d.amount)} {label}
              </strong>
            </li>
            <li className="discount-row">
              <div>
                <label className="toggle-label" htmlFor="use-huellas">
                  <input
                    id="use-huellas"
                    type="checkbox"
                    checked={useHuellas && canToggle}
                    disabled={!canToggle || busy}
                    aria-describedby="discount-help"
                    onChange={(e) => setUseHuellas(e.target.checked)}
                  />
                  <span>Usar descuento por mi recorrido</span>
                </label>
                <p className="field-help" id="discount-help">
                  {canToggle
                    ? `Se usan ${costo} Huellas en este pago.`
                    : `Necesitás ${costo} Huellas para usar este descuento.`}
                </p>
              </div>
              <strong>
                −{formatUsdc(d.discount)} {label}
              </strong>
            </li>
            <li className="total-row">
              <span>Total que pagás</span>
              <strong>
                {formatUsdc(d.total)} {label}
              </strong>
            </li>
            <li className="emphasis">
              <span>Va al comercio</span>
              <strong>
                {formatUsdc(d.toMerchant)} {label}
              </strong>
            </li>
            <li className="emphasis centro">
              <span>Va al {centroLabel}</span>
              <strong>
                {formatUsdc(d.toCentro)} {label}
              </strong>
            </li>
          </ul>

          <p className="hint">
            La operación es única: si una parte falla, no se confirma ningún pago.
          </p>
          <div className="sr-status" role="status" aria-live="polite" aria-atomic="true">
            {busy ? 'Confirmando en la red. Puede tardar unos segundos.' : ''}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onConfirm}
            disabled={busy || !built}
          >
            {busy ? 'Confirmando en la red…' : 'Confirmar pago'}
          </button>
        </>
      )}
    </div>
  )
}
