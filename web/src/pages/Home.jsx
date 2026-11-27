import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccount, getConfig, getStops, humanError } from '../lib/api.js'
import { getPublicKey } from '../lib/wallet.js'
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
          const acc = await getAccount(getPublicKey())
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
      <h1>Ruta de la Memoria · Malvinas · Mendoza</h1>
      <p className="lede">
        Un recorrido por lugares de memoria. En cada parada, el relato de quienes estuvieron ahí
        y el registro de tu paso, que vuelve en apoyo concreto a los veteranos.
      </p>

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

      <section>
        <h2>Paradas</h2>
        <ul className="stop-list">
          {stops.map((s) => (
            <li key={s.id}>
              <Link to={`/v/${s.id}`}>
                <span className="stop-name">{s.nombre}</span>
                <span className="stop-place">{s.lugar}</span>
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
