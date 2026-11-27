import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccount, getConfig, getMerchants, getStops, humanError } from '../lib/api.js'
import { getExperience, themeStyle } from '../lib/experiences.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'
import Huella, { HuellaRow } from '../components/Huella.jsx'
import StopPhoto from '../components/StopPhoto.jsx'
import MerchantOffer from '../components/MerchantOffer.jsx'
import { partnerMerchants } from '../lib/format.js'
import { bestOrder, distanceM, formatDistance, mapsRouteUrl } from '../lib/route.js'

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este celular no permite saber tu ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'No diste permiso para usar tu ubicación. Podés seguir el orden de la lista.'
              : 'No pudimos saber dónde estás. Probá de nuevo en un momento.',
          ),
        ),
      { timeout: 10000, maximumAge: 60000 },
    )
  })
}

const StopMap = lazy(() => import('../components/StopMap.jsx'))

const steps = [
  { n: 1, title: 'Andá al lugar', text: 'Son tres monumentos de Malvinas en Mendoza.' },
  { n: 2, title: 'Escaneá el QR', text: 'Está en el cartel. Leé o escuchá la historia y dejá tu huella.' },
  { n: 3, title: 'Completá la ruta', text: 'Con las tres huellas tenés un descuento, y cada compra aporta a los veteranos.' },
]

export default function Home() {
  const [stops, setStops] = useState([])
  const [merchants, setMerchants] = useState([])
  const [config, setConfig] = useState(null)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [origin, setOrigin] = useState(null)
  const [locating, setLocating] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')

  async function onLocate() {
    setLocating(true)
    setGeoMsg('')
    try {
      setOrigin(await locate())
      setGeoMsg('Listo: ordenamos los lugares desde donde estás.')
    } catch (e) {
      setGeoMsg(e.message)
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, list, shops] = await Promise.all([getConfig(), getStops(), getMerchants().catch(() => [])])
        if (cancelled) return
        setConfig(cfg)
        setStops(list)
        setMerchants(partnerMerchants(shops))
        try {
          const acc = await getAccount()
          if (!cancelled) setAccount(acc)
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
  }, [])

  if (loading) return <Loading label="Cargando la ruta…" />
  if (error) return <ErrorMsg>{error}</ErrorMsg>

  const visitedIds = new Set((account?.visits || []).map((v) => v.stopId))
  const total = stops.length || 3
  const visited = stops.filter((s) => visitedIds.has(s.id)).length
  const pending = stops.filter((s) => !visitedIds.has(s.id))
  const route = origin ? [...bestOrder(origin, pending), ...stops.filter((s) => visitedIds.has(s.id))] : stops
  const next = route.find((s) => !visitedIds.has(s.id))
  const legFrom = (i) => (i === 0 ? origin : route[i - 1])

  const cta = { to: next ? `/v/${next.id}` : '/recorrido', label: 'Empezar por el primer lugar' }
  if (origin && next) cta.label = `Empezar por: ${next.nombre}`
  if (visited > 0 && next) cta.label = `Seguir: ${next.nombre}`
  if (!next) cta.label = 'Usar mi descuento'

  return (
    <div className="page home-xp">
      <header className="home-intro">
        <p className="home-kicker">Ruta de la Memoria · Mendoza</p>
        <h1>Tres lugares que recuerdan Malvinas</h1>
        <p className="lede">Caminalos, escuchá sus historias y dejá tu huella en cada uno.</p>
        <div className="home-progress">
          <HuellaRow total={total} filled={visited} size={44} />
          <p>
            {visited === 0 && 'Todavía no dejaste ninguna huella.'}
            {visited > 0 && next && `Llevás ${visited} de ${total} huellas.`}
            {!next && '¡Completaste la ruta!'}
          </p>
        </div>
        <Link className="btn btn-primary btn-block btn-big" to={cta.to}>
          {cta.label}
        </Link>
        <Link className="btn btn-secondary btn-block scan-cta" to="/escanear">
          Escanear un código QR
        </Link>
      </header>

      <section aria-labelledby="ruta-title">
        <h2 id="ruta-title">La ruta</h2>
        {pending.length > 0 && (
          <div className="route-locate">
            {origin ? (
              <>
                <p>Este es el orden más corto desde donde estás. Las distancias son en línea recta.</p>
                <Suspense fallback={<Loading label="Cargando mapa…" />}>
                  <StopMap stops={route} origin={origin} visitedIds={visitedIds} />
                </Suspense>
                <a className="btn btn-secondary btn-block" href={mapsRouteUrl(origin, route.filter((s) => !visitedIds.has(s.id)))} target="_blank" rel="noreferrer">
                  Abrir el recorrido en Google Maps
                </a>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary btn-block" onClick={onLocate} disabled={locating}>
                  {locating ? 'Buscando dónde estás…' : 'Recomendame un orden según dónde estoy'}
                </button>
                <p className="fine-print">Tu ubicación se usa solo en este celular: no se guarda ni se envía.</p>
              </>
            )}
            <p className={origin ? 'visually-hidden' : 'progress-note'} role="status" aria-live="polite">
              {geoMsg}
            </p>
          </div>
        )}
        <ol className="route-path">
          {route.map((s, i) => {
            const isVisited = visitedIds.has(s.id)
            return (
              <li key={s.id} className={isVisited ? 'is-visited' : ''} style={themeStyle(s.id)}>
                <Link to={`/v/${s.id}`} className="route-card">
                  <StopPhoto stop={s} className="route-photo" decorative linkCredit={false} />
                  <span className="route-marker" aria-hidden="true">
                    {isVisited ? <Huella filled size={30} /> : i + 1}
                  </span>
                  <span className="route-copy">
                    <span className="route-tagline">{getExperience(s.id).tagline}</span>
                    <span className="route-name">{s.nombre}</span>
                    <span className="route-place">{s.lugar}</span>
                    {origin && !isVisited && (
                      <span className="route-distance">
                        A {formatDistance(distanceM(legFrom(i), s))}
                        {i === 0 ? ' de vos' : ' del anterior'}
                      </span>
                    )}
                    <span className="route-state">{isVisited ? '✓ Ya dejaste tu huella' : 'Ver la historia →'}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
        {origin ? null : showMap ? (
          <Suspense fallback={<Loading label="Cargando mapa…" />}>
            <StopMap stops={stops} visitedIds={visitedIds} />
          </Suspense>
        ) : (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowMap(true)}>
            Ver los lugares en el mapa
          </button>
        )}
      </section>

      {merchants.length > 0 && (
        <section aria-labelledby="premio-title">
          <h2 id="premio-title">Al completar la ruta</h2>
          <MerchantOffer merchants={merchants} config={config} ready={!next} />
        </section>
      )}

      <section aria-labelledby="como-title">
        <h2 id="como-title">Cómo funciona</h2>
        <ol className="how-steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="how-n" aria-hidden="true">
                {s.n}
              </span>
              <span>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {config && (
        <p className="fine-print">
          Versión de prueba · {config.usdcLabel} · {config.centroLabel}
        </p>
      )}
    </div>
  )
}
