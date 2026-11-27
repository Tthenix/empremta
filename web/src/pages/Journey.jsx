import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoFund, getAccount, getConfig, getStops, humanError } from '../lib/api.js'
import { getPublicKey, getSecretForBackup } from '../lib/wallet.js'
import { formatAmount, formatDate } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

export default function Journey() {
  const [account, setAccount] = useState(null)
  const [config, setConfig] = useState(null)
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [fundMsg, setFundMsg] = useState('')
  const [funding, setFunding] = useState(false)

  async function reload() {
    const [cfg, list, acc] = await Promise.all([
      getConfig(),
      getStops(),
      getAccount(getPublicKey()),
    ])
    setConfig(cfg)
    setStops(list)
    setAccount(acc)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await reload()
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

  async function onFund() {
    setFunding(true)
    setFundMsg('')
    setError('')
    try {
      const r = await demoFund()
      setFundMsg(`Se cargaron ${r.amount} USDC de prueba.`)
      await reload()
    } catch (e) {
      setError(humanError(e))
    } finally {
      setFunding(false)
    }
  }

  if (loading) return <Loading label="Cargando tu recorrido…" />

  const stopMap = Object.fromEntries(stops.map((s) => [s.id, s]))
  const huellas = Number(account?.huella || 0)
  const usdc = Number(account?.usdc || 0)
  const costo = config?.costoCanje ?? 30
  const canRedeem = huellas >= costo

  return (
    <div className="page journey">
      <h1>Mi recorrido</h1>
      <ErrorMsg>{error}</ErrorMsg>
      {fundMsg && (
        <p className="success-inline" role="status">
          {fundMsg}
        </p>
      )}

      <section className="balances" aria-label="Saldos">
        <div>
          <p className="label">Huellas</p>
          <p className="value">{formatAmount(huellas, 0)}</p>
        </div>
        <div>
          <p className="label">{config?.usdcLabel || 'USDC'}</p>
          <p className="value">{formatAmount(usdc, 2)}</p>
        </div>
      </section>

      {config?.demoMode && usdc === 0 && (
        <button type="button" className="btn btn-quiet" onClick={onFund} disabled={funding}>
          {funding ? 'Cargando…' : 'Cargar saldo de prueba'}
        </button>
      )}

      <section>
        <h2>Visitas</h2>
        {!account?.visits?.length ? (
          <p className="empty">Todavía no registraste visitas. Escaneá el QR en un lugar de memoria.</p>
        ) : (
          <ul className="visit-list">
            {account.visits.map((v) => (
              <li key={`${v.stopId}-${v.txHash}`}>
                <Link to={`/v/${v.stopId}`}>
                  {stopMap[v.stopId]?.nombre || v.stopId}
                </Link>
                <span className="muted">{formatDate(v.createdAt)}</span>
                <TxLink hash={v.txHash} explorerTxUrl={config?.explorerTxUrl} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="how-to">
        <h2>Cómo canjear</h2>
        <ol>
          <li>
            Visitá las tres paradas. Con {costo} Huellas obtenés un descuento del{' '}
            {config?.descuentoPct ?? 10}% (tope {config?.descuentoMaxUsdc ?? '1'} USDC).
          </li>
          <li>En un comercio adherido, pedí el QR de cobro.</li>
          <li>
            Antes de confirmar vas a ver el desglose: cuánto va al comercio y cuánto al{' '}
            {config?.centroLabel || 'Centro de Veteranos'}.
          </li>
        </ol>
        <p>
          {canRedeem
            ? 'Ya tenés Huellas suficientes para canjear el descuento en el próximo pago.'
            : `Te faltan ${Math.max(0, costo - huellas)} Huellas para el canje.`}
        </p>
      </section>

      <section>
        <h2>Respaldar mi clave</h2>
        <p className="warn">
          Guardá esta clave en un lugar seguro. Quien la tenga puede usar tu saldo. Nunca la
          compartas.
        </p>
        {!showSecret ? (
          <button type="button" className="btn btn-secondary" onClick={() => setShowSecret(true)}>
            Mostrar clave secreta
          </button>
        ) : (
          <pre className="secret-box" tabIndex={0}>
            {getSecretForBackup()}
          </pre>
        )}
      </section>
    </div>
  )
}
