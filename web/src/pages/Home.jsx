import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccount, getConfig, getStops, humanError } from '../lib/api.js'
import { formatAmount } from '../lib/format.js'
import Loading from '../components/Loading.jsx'
import ErrorMsg from '../components/ErrorMsg.jsx'

const StopMap = lazy(() => import('../components/StopMap.jsx'))

export default function Home() {
  const [stops, setStops] = useState([])
  const [config, setConfig] = useState(null)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, list] = await Promise.all([getConfig(), getStops()])
        if (cancelled) return
        setConfig(cfg)
        setStops(list)
        try {
          const acc = await getAccount()
          if (!cancelled) setAccount(acc)
        } catch {
          /* no wallet yet is fine */
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

  const visited = account?.visits?.length || 0
  const total = stops.length || 3
  const huellas = account?.huella || '0'

  return (
    <div className="page home">
      <header className="home-hero">
        <div className="home-hero-copy">
          <h1>Una ruta para caminar la memoria</h1>
          <p className="lede">
            Recorré lugares de memoria de Malvinas en Mendoza, leé el relato de cada parada y
            registrá tu paso; ese recorrido vuelve en apoyo concreto a los veteranos.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#paradas">
              Ver las paradas
            </a>
          </div>
        </div>
        <figure className="brand-hero-card">
          <img
            src="/icons/app-icon.svg"
            alt="Símbolo de Empremta"
            width="1024"
            height="1024"
            className="brand-hero-logo"
          />
          <figcaption className="brand-hero-caption">
            El isotipo es una huella construida con el contorno real de las islas Malvinas.
          </figcaption>
        </figure>
      </header>

      <section className="progress-card" aria-label="Tu progreso">
        <p>
          Visitaste <strong>{visited}</strong> de <strong>{total}</strong> lugares
        </p>
        <p>
          Huellas: <strong>{formatAmount(huellas, 0)}</strong>
        </p>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (visited / total) * 100)}%` }} />
        </div>
        <p className="hint">
          Las Huellas son el registro de tu paso. Con {config?.costoCanje ?? 30} Huellas se
          habilita un descuento en comercios adheridos.
        </p>
        <Link className="btn btn-secondary" to="/recorrido">
          Ver mi recorrido
        </Link>
      </section>

      <section className="home-stops" id="paradas" aria-labelledby="paradas-title">
        <h2 id="paradas-title">Paradas</h2>
        <ul className="stop-list">
          {stops.map((s) => (
            <li key={s.id}>
              <Link to={`/v/${s.id}`}>
                <span className="stop-copy">
                  <span className="stop-name">{s.nombre}</span>
                  <span className="stop-place">{s.lugar}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Suspense fallback={<Loading label="Cargando mapa…" />}>
          <StopMap stops={stops} />
        </Suspense>
      </section>

      {config && (
        <p className="fine-print">
          Red: testnet · {config.usdcLabel} · {config.centroLabel}
        </p>
      )}
    </div>
  )
}
