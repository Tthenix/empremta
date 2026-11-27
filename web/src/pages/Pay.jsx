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
import { formatAmount } from '../lib/format.js'
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

  if (done) {
    const d = done.desglose || built?.desglose
    return (
      <div className="page pay">
        <h1>Pago hecho</h1>
        <p>Gracias. El apoyo al centro ya quedó registrado en la red.</p>
        {d && (
          <ul className="breakdown done">
            <li>
              Al comercio: <strong>{formatAmount(d.toMerchant)} {config?.usdcLabel}</strong>
            </li>
            <li>
              Al Centro de Veteranos: <strong>{formatAmount(d.toCentro)} {config?.usdcLabel}</strong>
            </li>
          </ul>
        )}
        <TxLink hash={done.txHash} explorerTxUrl={config?.explorerTxUrl} />
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
  const canToggle =
    Number(account?.huella || 0) >= (config?.costoCanje || 30)

  return (
    <div className="page pay">
      <h1>Confirmar pago</h1>
      <p className="hint">Revisá el desglose antes de confirmar. Nada se firma solo.</p>
      <ErrorMsg>{error}</ErrorMsg>

      {!d ? (
        <Loading label="Calculando desglose…" />
      ) : (
        <>
          <ul className="breakdown">
            <li>
              <span>Total del comercio</span>
              <strong>
                {formatAmount(d.amount)} {config?.usdcLabel}
              </strong>
            </li>
            <li className="discount-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useHuellas && canToggle}
                  disabled={!canToggle}
                  onChange={(e) => setUseHuellas(e.target.checked)}
                />
                Descuento por tu recorrido
              </label>
              <strong>
                −{formatAmount(d.discount)} {config?.usdcLabel}
              </strong>
            </li>
            <li className="emphasis">
              <span>Va al comercio</span>
              <strong>
                {formatAmount(d.toMerchant)} {config?.usdcLabel}
              </strong>
            </li>
            <li className="emphasis centro">
              <span>Va al Centro de Veteranos de Malvinas</span>
              <strong>
                {formatAmount(d.toCentro)} {config?.usdcLabel}
              </strong>
            </li>
            {d.huellasBurned > 0 && (
              <li className="muted-row">
                Se usan {d.huellasBurned} Huellas en este canje.
              </li>
            )}
          </ul>

          <p className="merchant-name">{d.merchant?.nombre}</p>
          <p className="fine-print">Ref. {ref}</p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={busy || !built}
          >
            {busy ? 'Confirmando…' : 'Confirmar pago'}
          </button>
        </>
      )}
    </div>
  )
}
