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
  const [progress, setProgress] = useState('')

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
      setProgress('Preparando la billetera segura de este celular…')
      await ensureOnboarded()
      setProgress('Consultando tu ubicación para verificar que estás en el lugar…')
      const { lat, lng } = await getGeo()
      setProgress('Registrando la visita. Puede tardar unos segundos…')
      const result = await registerVisit({ stopId, code, lat, lng })
      setDone(result)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setProgress('')
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Cargando la parada…" />
  if (!stop && error) return <ErrorMsg>{error}</ErrorMsg>
  if (!stop) return <ErrorMsg>No encontramos esa parada.</ErrorMsg>

  return (
    <div className="page stop">
      <h1>{stop.nombre}</h1>
      <p className="stop-location">{stop.lugar}</p>

      {stop.foto ? (
        <img className="stop-photo" src={stop.foto} alt={`Vista de ${stop.nombre}`} />
      ) : (
        <div className="photo-placeholder">
          <span>Fotografía pendiente</span>
        </div>
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
        <div className="success-box" role="status" aria-live="polite" aria-atomic="true">
          <p>Tu visita quedó registrada.</p>
          <p>
            Huellas ahora: <strong>{Number(done.huellas).toFixed(0)}</strong>
          </p>
          <TxLink hash={done.txHash} explorerTxUrl={config?.explorerTxUrl} />
          <div className="btn-row">
            <Link className="btn btn-primary" to="/recorrido">
              Ver mi recorrido
            </Link>
            <Link className="btn btn-secondary" to="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      ) : code ? (
        <section className="stop-action" aria-label="Registrar visita">
          <ErrorMsg>{error}</ErrorMsg>
          <button type="button" className="btn btn-primary btn-block" onClick={onRegister} disabled={busy}>
            {busy ? 'Registrando…' : 'Registrar mi visita'}
          </button>
          <div className="progress-note" role="status" aria-live="polite" aria-atomic="true">
            {progress}
          </div>
          <p className="hint">
            La primera vez se crea una billetera segura en este celular. No tenés que escribir
            claves ni instalar nada.
          </p>
        </section>
      ) : (
        <p className="scan-note">
          Para registrar tu visita, escaneá con la cámara del celular el código QR que está en
          este lugar.
        </p>
      )}
    </div>
  )
}
