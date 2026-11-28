import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ensureOnboarded,
  getAccount,
  getConfig,
  getStop,
  getStops,
  humanError,
  registerVisit,
} from '../lib/api.js'
import { getExperience, themeStyle } from '../lib/experiences.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import TxLink from '../components/TxLink.jsx'
import Huella, { HuellaRow } from '../components/Huella.jsx'
import StoryExperience from '../components/StoryExperience.jsx'
import StopPhoto from '../components/StopPhoto.jsx'
import { nextStopFrom } from '../lib/route.js'

function scrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

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

function VisitMoment({ done, stops, visitedIds, explorerTxUrl, next }) {
  const headingRef = useRef(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  const total = stops.length || 3
  const count = visitedIds.size
  return (
    <section className="visit-moment" role="status" aria-live="polite">
      <Huella filled size={88} className="stamp" />
      <h2 ref={headingRef} tabIndex={-1}>
        Dejaste tu huella
      </h2>
      <HuellaRow total={total} filled={count} size={34} />
      {next ? (
        <>
          <p>
            Llevás {count} de {total} lugares. Te {total - count === 1 ? 'falta' : 'faltan'}{' '}
            {total - count}.
          </p>
          <Link className="btn btn-primary btn-block" to={`/v/${next.id}`}>
            Próximo lugar: {next.nombre}
          </Link>
        </>
      ) : (
        <>
          <p>Completaste la ruta. Ya podés usar tu descuento en un comercio adherido.</p>
          <Link className="btn btn-primary btn-block" to="/recorrido">
            Ver cómo usar mi descuento
          </Link>
        </>
      )}
      <TxLink hash={done.txHash} explorerTxUrl={explorerTxUrl} label="Ver el registro público" />
      {count === 1 && (
        <p className="hint">
          Tus huellas viven en este celular.{' '}
          <Link to="/recorrido#respaldo">Guardá tu clave</Link> para no perderlas.
        </p>
      )}
    </section>
  )
}

// Lugares abiertos en esta visita (se olvidan al cerrar el navegador): evitan sugerir uno ya leído.
function markSeen(stopId) {
  try {
    const seen = new Set(JSON.parse(sessionStorage.getItem('empremta-vistos') || '[]'))
    seen.add(stopId)
    sessionStorage.setItem('empremta-vistos', JSON.stringify([...seen]))
    return seen
  } catch {
    return new Set([stopId])
  }
}

// Remontar por parada: al ir al próximo lugar el estado arranca limpio.
export default function StopRoute() {
  const { stopId } = useParams()
  return <Stop key={stopId} stopId={stopId} />
}

function Stop({ stopId }) {
  const [params] = useSearchParams()
  const code = params.get('c') || ''
  const navigate = useNavigate()
  const registerRef = useRef(null)

  const [stop, setStop] = useState(null)
  const [stops, setStops] = useState([])
  const [visitedIds, setVisitedIds] = useState(new Set())
  const [seenIds] = useState(() => markSeen(stopId))
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
        const [s, list, cfg] = await Promise.all([getStop(stopId), getStops(), getConfig()])
        if (cancelled) return
        setStop(s)
        setStops(list)
        setConfig(cfg)
        try {
          const acc = await getAccount()
          if (!cancelled) setVisitedIds(new Set((acc.visits || []).map((v) => v.stopId)))
        } catch {
          /* todavía sin billetera */
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
  }, [stopId])

  async function onRegister() {
    setError('')
    setBusy(true)
    try {
      setProgress('Preparando este celular. Solo pasa la primera vez…')
      await ensureOnboarded()
      setProgress('Confirmando que estás en el lugar…')
      const { lat, lng } = await getGeo()
      setProgress('Guardando tu huella. Puede tardar unos segundos…')
      const result = await registerVisit({ stopId, code, lat, lng })
      setVisitedIds((prev) => new Set(prev).add(stopId))
      setDone(result)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError(humanError(e))
    } finally {
      setProgress('')
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Cargando el lugar…" />
  if (!stop) return <ErrorMsg>{error || 'No encontramos ese lugar.'}</ErrorMsg>

  const exp = getExperience(stop.id)
  const position = stops.findIndex((s) => s.id === stop.id) + 1
  const hasCoords = stop.lat != null && stop.lng != null
  const alreadyVisited = visitedIds.has(stop.id)
  const canRegister = code && !done && !alreadyVisited
  const nextStop = nextStopFrom(stop, stops, visitedIds, seenIds)

  let finishLabel = 'Volver a la ruta'
  let finishDescription = 'Podés volver a la ruta cuando quieras.'
  let onFinish = () => navigate('/')
  if (canRegister) {
    finishLabel = 'Ir a dejar mi huella'
    finishDescription = 'Si estás en el lugar, el próximo paso es dejar tu huella.'
    onFinish = () => {
      registerRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
      registerRef.current?.querySelector('button')?.focus({ preventScroll: true })
    }
  } else if (nextStop) {
    finishLabel = `Próximo lugar: ${nextStop.nombre}`
    finishDescription = `El próximo paso es seguir hacia ${nextStop.nombre}.`
    onFinish = () => navigate(`/v/${nextStop.id}`)
  }

  return (
    <div className="page stop-xp" style={themeStyle(stop.id)}>
      <header className="xp-hero">
        <StopPhoto stop={stop} className="xp-photo" />
        <Link className="xp-back" to="/">
          ← La ruta
        </Link>
        {position > 0 && (
          <p className="xp-step">
            Lugar {position} de {stops.length}
            {alreadyVisited && !done && <span className="xp-visited"> · Ya dejaste tu huella</span>}
          </p>
        )}
        <h1>{stop.nombre}</h1>
        <p className="xp-place">{stop.lugar}</p>
        {hasCoords && (
          <a
            className="xp-maps"
            href={`https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar
          </a>
        )}
        <p className="xp-story-cue">
          <strong>La historia se lee por partes.</strong> Deslizá o tocá Seguir para ver la próxima parte.
        </p>
      </header>

      {done ? (
        <VisitMoment done={done} stops={stops} visitedIds={visitedIds} explorerTxUrl={config?.explorerTxUrl} next={nextStop} />
      ) : canRegister ? (
        <section className="register-card" ref={registerRef} aria-label="Dejar tu huella">
          <Huella filled size={44} />
          <div>
            <p className="register-title">Estás en el lugar</p>
            <p className="register-sub">Tocá el botón para dejar tu huella. No hace falta instalar ni escribir nada.</p>
          </div>
          <ErrorMsg>{error}</ErrorMsg>
          <button type="button" className="btn btn-primary btn-block btn-big" onClick={onRegister} disabled={busy}>
            {busy ? 'Guardando…' : 'Dejar mi huella'}
          </button>
          <p className="field-help">
            Tu visita queda registrada públicamente en Stellar con fecha, hora y lugar bajo una billetera anónima. No guardamos nombre, correo ni datos personales.
          </p>
          <div className="progress-note" role="status" aria-live="polite" aria-atomic="true">
            {progress}
          </div>
        </section>
      ) : (
        !alreadyVisited && (
          <div className="scan-note">
            <p>Cuando estés en el lugar, escaneá el código QR del cartel para dejar tu huella.</p>
            <Link className="btn btn-primary btn-block" to="/escanear">
              Escanear el QR
            </Link>
          </div>
        )
      )}

      <StoryExperience key={stop.id} stop={stop} exp={exp} onFinish={onFinish} finishLabel={finishLabel} finishDescription={finishDescription} />
    </div>
  )
}
