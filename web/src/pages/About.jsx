import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConfig } from '../lib/api.js'

export default function About() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
  }, [])

  return (
    <div className="page about">
      <h1>Acerca del proyecto</h1>
      <p>
        La Ruta de la Memoria conecta lugares de memoria de Malvinas en Mendoza. En cada parada
        se puede leer el relato del lugar y registrar la visita. Ese recorrido se puede canjear
        por un descuento en comercios adheridos, y cada pago destina una parte al centro de
        veteranos de forma pública y verificable en Stellar.
      </p>
      <p>
        El contenido histórico lo aportan los veteranos y las agrupaciones. Mientras tanto, lo
        que aún no está listo se muestra como &quot;Contenido en preparación&quot;: no se inventa
        testimonio ni se atribuye a nadie.
      </p>
      <p>
        Esta versión corre en la <strong>testnet</strong> de Stellar. Los saldos son de prueba.
        {config?.centroLabel ? (
          <>
            {' '}
            El destinatario de los aportes figura como <em>{config.centroLabel}</em>.
          </>
        ) : null}
      </p>
      <p>
        Proyecto presentado en la hackathon FLAT 2026 (BAF × Stellar), ejes Memoria y Territorio.
      </p>
      <p>
        Caja de demostración del comercio:{' '}
        <Link to="/comercio/m1">abrir caja (m1)</Link>
      </p>
    </div>
  )
}
