import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  demoFund,
  getAccount,
  getBackupSecret,
  getConfig,
  getMerchants,
  getStops,
  humanError,
  restoreBackupSecret,
} from '../lib/api.js'
import { formatAmount, formatDate, readFlag, writeFlag } from '../lib/format.js'
import { themeStyle } from '../lib/experiences.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'
import Huella from '../components/Huella.jsx'
import MerchantOffer from '../components/MerchantOffer.jsx'
import { partnerMerchants } from '../lib/format.js'

const BACKUP_FLAG = 'empremta-respaldo'

export default function Journey() {
  const [account, setAccount] = useState(null)
  const [config, setConfig] = useState(null)
  const [stops, setStops] = useState([])
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [fundMsg, setFundMsg] = useState('')
  const [funding, setFunding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [backedUp, setBackedUp] = useState(() => readFlag(BACKUP_FLAG) === '1')
  const { hash } = useLocation()
  const [backupOpen, setBackupOpen] = useState(hash === '#respaldo')
  const [restoreInput, setRestoreInput] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState('')
  const backupRef = useRef(null)

  function openBackup() {
    setBackupOpen(true)
    requestAnimationFrame(() => backupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function markBackedUp() {
    writeFlag(BACKUP_FLAG, '1')
    setBackedUp(true)
  }

  async function showSecret() {
    setSecret(await getBackupSecret())
    markBackedUp()
  }

  async function copySecret() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    markBackedUp()
  }

  async function onRestore(e) {
    e.preventDefault()
    setRestoreMsg('')
    if (Number(account?.huella || 0) > 0 && !window.confirm('Este celular ya tiene huellas. Si seguís, se reemplazan por las de la clave que pegaste. ¿Seguir?')) {
      return
    }
    setRestoring(true)
    try {
      await restoreBackupSecret(restoreInput)
      setRestoreInput('')
      setSecret('')
      await reload()
      markBackedUp()
      setRestoreMsg('Listo: recuperaste tus huellas en este celular.')
    } catch (err) {
      setRestoreMsg(humanError(err))
    } finally {
      setRestoring(false)
    }
  }

  async function reload() {
    const [cfg, list, acc, shops] = await Promise.all([getConfig(), getStops(), getAccount(), getMerchants().catch(() => [])])
    setConfig(cfg)
    setStops(list)
    setMerchants(partnerMerchants(shops))
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

  useEffect(() => {
    if (!loading && hash === '#respaldo') backupRef.current?.scrollIntoView({ block: 'start' })
  }, [loading, hash])

  if (loading) return <Loading label="Cargando tus huellas…" />

  const visitByStop = Object.fromEntries((account?.visits || []).map((v) => [v.stopId, v]))
  const visited = stops.filter((s) => visitByStop[s.id]).length
  const huellas = Number(account?.huella || 0)
  const usdc = Number(account?.usdc || 0)
  const costo = config?.costoCanje ?? 30
  const canRedeem = huellas >= costo
  const centro = config?.centroLabel || 'Centro de Veteranos'
  const shopName = merchants.length === 1 ? merchants[0].nombre : 'un comercio adherido'

  return (
    <div className="page journey-xp">
      <h1>Mis huellas</h1>
      <ErrorMsg>{error}</ErrorMsg>
      {fundMsg && (
        <p className="success-inline" role="status">
          {fundMsg}
        </p>
      )}

      <ol className="huella-slots">
        {stops.map((s) => {
          const v = visitByStop[s.id]
          return (
            <li key={s.id} className={v ? 'is-visited' : ''} style={themeStyle(s.id)}>
              <Huella filled={Boolean(v)} size={48} />
              <div>
                <Link to={`/v/${s.id}`} className="slot-name">
                  {s.nombre}
                </Link>
                {v ? (
                  <p className="slot-meta">
                    {formatDate(v.createdAt)} · <TxLink hash={v.txHash} explorerTxUrl={config?.explorerTxUrl} label="registro" />
                  </p>
                ) : (
                  <p className="slot-meta">Todavía no pasaste por acá</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {visited > 0 && !backedUp && (
        <section className="backup-reminder" aria-labelledby="reminder-title">
          <p id="reminder-title" className="register-title">
            No pierdas tus huellas
          </p>
          <p>
            Viven solo en este celular. Si borrás los datos del navegador o cambiás de celular, vas a
            necesitar tu clave para recuperarlas.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={openBackup}>
            Guardar mi clave
          </button>
        </section>
      )}

      <section className={canRedeem ? 'reward-card is-ready' : 'reward-card'} aria-labelledby="reward-title">
        <h2 id="reward-title">{canRedeem ? 'Tu descuento está listo' : 'Tu descuento'}</h2>
        <MerchantOffer merchants={merchants} config={config} ready={canRedeem} />
        {canRedeem ? (
          <ol className="how-steps">
            <li>
              <span className="how-n" aria-hidden="true">1</span>
              <span>
                <strong>Andá a {shopName}</strong>
                <span>y pedí pagar con Empremta.</span>
              </span>
            </li>
            <li>
              <span className="how-n" aria-hidden="true">2</span>
              <span>
                <strong>Escaneá el QR de la caja</strong>
                <span>
                  con la cámara del celular o con <Link to="/escanear">el escáner de Empremta</Link>.
                </span>
              </span>
            </li>
            <li>
              <span className="how-n" aria-hidden="true">3</span>
              <span>
                <strong>Revisá y confirmá</strong>
                <span>Vas a ver cuánto va al comercio y cuánto al {centro}.</span>
              </span>
            </li>
          </ol>
        ) : (
          <p>
            Cuando tengas las {stops.length || 3} huellas, el descuento tiene un tope de{' '}
            {config?.descuentoMaxUsdc ?? '1'} USDC por compra.{' '}
            {visited < (stops.length || 3) && (
              <strong>
                Te {(stops.length || 3) - visited === 1 ? 'falta' : 'faltan'} {(stops.length || 3) - visited}.
              </strong>
            )}
          </p>
        )}
        {!visited && (
          <Link className="btn btn-primary btn-block" to="/">
            Ver los lugares
          </Link>
        )}
      </section>

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
        <button type="button" className="btn btn-secondary btn-block" onClick={onFund} disabled={funding}>
          {funding ? 'Cargando saldo de prueba…' : 'Cargar saldo de prueba'}
        </button>
      )}

      <details
        className="backup-details"
        id="respaldo"
        ref={backupRef}
        open={backupOpen}
        onToggle={(e) => setBackupOpen(e.currentTarget.open)}
      >
        <summary>Guardar o recuperar mis huellas</summary>
        <div className="backup-body">
          <h3>Guardar mi clave</h3>
          <p className="warn">
            Guardala en un lugar seguro, por ejemplo en tus notas o en un mensaje para vos. Quien la
            tenga puede usar tus huellas y tu saldo: nunca se la pases a nadie.
          </p>
          {!secret ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={showSecret}>
              Mostrar mi clave
            </button>
          ) : (
            <>
              <pre className="secret-box" tabIndex={0} aria-label="Tu clave secreta">
                {secret}
              </pre>
              {navigator.clipboard && (
                <button type="button" className="btn btn-secondary btn-block" onClick={copySecret}>
                  {copied ? 'Copiada ✓' : 'Copiar la clave'}
                </button>
              )}
            </>
          )}

          <h3>Recuperar mis huellas en este celular</h3>
          <form onSubmit={onRestore} className="restore-form">
            <label htmlFor="restore-secret">Pegá tu clave (empieza con S)</label>
            <textarea
              id="restore-secret"
              rows={3}
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={!restoreInput.trim() || restoring}>
              {restoring ? 'Recuperando…' : 'Recuperar mis huellas'}
            </button>
          </form>
          <div className="progress-note" role="status" aria-live="polite">
            {restoreMsg}
          </div>
        </div>
      </details>
    </div>
  )
}
