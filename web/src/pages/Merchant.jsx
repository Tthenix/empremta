import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  getConfig,
  getMerchantPayments,
  getMerchants,
  humanError,
} from '../lib/api.js'
import { formatAmount, formatDate, isPlaceholder, randomRef } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

export default function Merchant() {
  const { id } = useParams()
  const [merchant, setMerchant] = useState(null)
  const [config, setConfig] = useState(null)
  const [amount, setAmount] = useState('2.50')
  const [refCode, setRefCode] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const sinceRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [list, cfg] = await Promise.all([getMerchants(), getConfig()])
        if (cancelled) return
        setConfig(cfg)
        const m = list.find((x) => x.id === id)
        if (!m) {
          throw Object.assign(new Error('No encontramos ese comercio'), {
            apiError: { code: 'NOT_FOUND', message: 'No encontramos ese comercio' },
          })
        }
        setMerchant(m)
      } catch (e) {
        if (!cancelled) setError(humanError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!refCode || payment) return undefined
    const tick = async () => {
      try {
        const list = await getMerchantPayments(id, sinceRef.current)
        const match = list.find((p) => p.ref === refCode)
        if (match) setPayment(match)
      } catch {
        /* keep polling */
      }
    }
    tick()
    const t = setInterval(tick, 3000)
    return () => clearInterval(t)
  }, [refCode, id, payment])

  async function onGenerate(e) {
    e.preventDefault()
    setError('')
    setPayment(null)
    const amt = amount.trim()
    if (!/^\d+(\.\d{1,7})?$/.test(amt) || Number(amt) <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    const ref = randomRef(8)
    sinceRef.current = Date.now()
    const origin = window.location.origin
    const url = `${origin}/pagar?m=${encodeURIComponent(id)}&monto=${encodeURIComponent(amt)}&ref=${ref}`
    setRefCode(ref)
    setQrUrl(url)
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      setError(humanError(err))
    }
  }

  if (loading) return <Loading label="Cargando la caja…" />
  if (!merchant) return <ErrorMsg>{error || 'No encontramos ese comercio.'}</ErrorMsg>

  return (
    <div className="page merchant">
      <h1>Caja</h1>
      <p className={isPlaceholder(merchant.nombre) ? 'placeholder-inline' : 'merchant-title'}>
        {merchant.nombre}
      </p>
      <ErrorMsg>{error}</ErrorMsg>

      <form className="cash-form" onSubmit={onGenerate}>
        <label htmlFor="monto">Monto ({config?.usdcLabel || 'USDC'})</label>
        <input
          id="monto"
          name="monto"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          Generar cobro
        </button>
      </form>

      {qrDataUrl && (
        <section className="qr-panel" aria-live="polite" aria-atomic="true">
          {payment ? (
            <div className="success-box payment-live" role="status">
              <p>Pago recibido</p>
              <p>
                {formatAmount(payment.amount)} · {formatDate(payment.createdAt)}
              </p>
              <TxLink hash={payment.txHash} explorerTxUrl={config?.explorerTxUrl} />
              <p className="fine-print">Para otro cobro, ingresá un monto y tocá “Generar cobro”.</p>
            </div>
          ) : (
            <p className="waiting payment-live" role="status">
              Esperando pago…
            </p>
          )}
          {!payment && (
            <>
              <img className="qr-img" src={qrDataUrl} alt={`Código QR de cobro, referencia ${refCode}`} />
              <p className="fine-print">Ref. {refCode}</p>
              <details className="qr-details">
                <summary>Ver enlace de cobro</summary>
                <p className="qr-url">{qrUrl}</p>
              </details>
            </>
          )}
        </section>
      )}
    </div>
  )
}
