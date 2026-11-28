import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  getConfig,
  getMerchantRedemptions,
  getMerchants,
  humanError,
} from '../lib/api.js'
import { formatAmount, formatDate, formatUsdc, isPlaceholder, randomRef } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'
import { MerchantLogo } from '../components/MerchantOffer.jsx'

export default function Merchant() {
  const { id } = useParams()
  const [merchant, setMerchant] = useState(null)
  const [config, setConfig] = useState(null)
  const [amount, setAmount] = useState('10000')
  const [refCode, setRefCode] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [redemption, setRedemption] = useState(null)
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
    if (!refCode || redemption) return undefined
    const tick = async () => {
      try {
        const list = await getMerchantRedemptions(id, sinceRef.current)
        const match = list.find((r) => r.ref === refCode)
        if (match) setRedemption(match)
      } catch {
        /* keep polling */
      }
    }
    tick()
    const t = setInterval(tick, 3000)
    return () => clearInterval(t)
  }, [refCode, id, redemption])

  async function onGenerate(e) {
    e.preventDefault()
    setError('')
    setRedemption(null)
    const amt = amount.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(amt) || Number(amt) <= 0) {
      setError('Ingresá un monto en pesos válido.')
      return
    }
    const maxTicket = Number(config?.maxTicketArs ?? 50000)
    if (Number(amt) > maxTicket) {
      setError(`El monto máximo para un canje es $${maxTicket.toLocaleString('es-AR')}.`)
      return
    }
    const ref = randomRef(8)
    sinceRef.current = Date.now()
    const origin = window.location.origin
    const url = `${origin}/canjear?m=${encodeURIComponent(id)}&monto=${encodeURIComponent(amt)}&ref=${ref}`
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
      <MerchantLogo merchant={merchant} size={72} />
      <p className={isPlaceholder(merchant.nombre) ? 'placeholder-inline' : 'merchant-title'}>
        {merchant.nombre}
      </p>
      <ErrorMsg>{error}</ErrorMsg>

      <form className="cash-form" onSubmit={onGenerate}>
        <label htmlFor="monto">Ticket en pesos (ARS)</label>
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
          Generar canje
        </button>
      </form>

      {qrDataUrl && (
        <section className="qr-panel" aria-live="polite" aria-atomic="true">
          {redemption ? (
            <div className="success-box payment-live" role="status">
              <p>
                Huellas canjeadas · aplicá un descuento de ${formatAmount(redemption.discountArs, 2)} · cobrale ${formatAmount(Number(redemption.amountArs) - Number(redemption.discountArs), 2)} por tu medio habitual
              </p>
              <p>
                Aporte al Centro: {formatUsdc(redemption.aporteUsdc)} {config?.usdcLabel || 'USDC'}
              </p>
              <p className="fine-print">{formatDate(redemption.createdAt)}</p>
              <TxLink hash={redemption.txHash} explorerTxUrl={config?.explorerTxUrl} />
              <p className="fine-print">Para otro canje, ingresá un monto y tocá “Generar canje”.</p>
            </div>
          ) : (
            <p className="waiting payment-live" role="status">
              Esperando canje…
            </p>
          )}
          {!redemption && (
            <>
              <img className="qr-img" src={qrDataUrl} alt={`Código QR de canje, referencia ${refCode}`} />
              <p className="fine-print">Ref. {refCode}</p>
              <details className="qr-details">
                <summary>Ver enlace de canje</summary>
                <p className="qr-url">{qrUrl}</p>
              </details>
            </>
          )}
        </section>
      )}
    </div>
  )
}
