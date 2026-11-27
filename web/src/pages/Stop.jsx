import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ensureOnboarded,
  getConfig,
  getStop,
  humanError,
  registerVisit,
} from '../lib/api.js'
import PlaceholderBox from '../components/PlaceholderBox.jsx'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'

function getGeo() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 8000, maximumAge: 60000 },
    )
  })
}

export default function Stop() {
  const { stopId } = useParams()
  const [params] = useSearchParams()
  const code = params.get('c') || ''

  const [stop, setStop] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, cfg] = await Promise.all([getStop(stopId), getConfig()])
        if (cancelled) return
        setStop(s)
        setConfig(cfg)
      } catch (e) {
        if (!cancelled) setError(humanError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [stopId])

  async function onRegister() {
    setError('')
    setBusy(true)
    try {
      if (!code || code.length < 8) {
        throw Object.assign(new Error('Escaneá el QR del lugar para registrar tu visita.'), {
          apiError: { code: 'INVALID_CODE', message: 'Escaneá el QR del lugar para registrar tu visita.' },
        })
      }
      await ensureOnboarded()
      const { lat, lng } = await getGeo()
      const result = await registerVisit({ stopId, code, lat, lng })
      setDone(result)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Cargando la parada…" />
  if (!stop && error) return <ErrorMsg>{error}</ErrorMsg>
  if (!stop) return <ErrorMsg>No encontramos esa parada.</ErrorMsg>

  return (
    <div className="page stop">
      <p className="eyebrow">{stop.lugar}</p>
      <h1>{stop.nombre}</h1>

      {stop.foto ? (
        <img className="stop-photo" src={stop.foto} alt="" />
      ) : (
        <div className="photo-placeholder" aria-hidden="true" />
      )}

      <section aria-labelledby="historia-title">
        <h2 id="historia-title">La historia de este lugar</h2>
        <PlaceholderBox text={stop.historia} />
        {stop.fuente && <PlaceholderBox text={stop.fuente} label="Fuente" />}
        {stop.audio && (
          <audio controls src={stop.audio} className="stop-audio">
            Tu navegador no reproduce audio.
          </audio>
        )}
      </section>

      {done ? (
        <div className="success-box" role="status">
          <p>Tu visita quedó registrada.</p>
          <p>
            Huellas ahora: <strong>{Number(done.huellas).toFixed(0)}</strong>
          </p>
          <TxLink hash={done.txHash} explorerTxUrl={config?.explorerTxUrl} />
          <div className="btn-row">
            <Link className="btn" to="/recorrido">
              Ver mi recorrido
            </Link>
            <Link className="btn btn-secondary" to="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ErrorMsg>{error}</ErrorMsg>
          <button type="button" className="btn btn-primary" onClick={onRegister} disabled={busy}>
            {busy ? 'Registrando…' : 'Registrar mi visita'}
          </button>
          <p className="hint">
            Se crea una billetera en tu celular. La clave no sale del navegador.
          </p>
        </>
      )}
    </div>
  )
}
