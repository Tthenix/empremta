import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { qrToPath } from '../lib/qr.js'

// shortcut: BarcodeDetector existe en Chrome/Android pero no en Safari/iPhone; ahí se guía a la cámara del celular. Sumar un lector JS si muchos usuarios llegan desde iPhone.
const canScan =
  typeof window !== 'undefined' && 'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia)

function CameraHelp() {
  return (
    <ol className="how-steps">
      <li>
        <span className="how-n" aria-hidden="true">1</span>
        <span>
          <strong>Abrí la cámara del celular</strong>
          <span>La misma que usás para sacar fotos.</span>
        </span>
      </li>
      <li>
        <span className="how-n" aria-hidden="true">2</span>
        <span>
          <strong>Apuntá al código QR</strong>
          <span>El del cartel del lugar o el de la caja del comercio.</span>
        </span>
      </li>
      <li>
        <span className="how-n" aria-hidden="true">3</span>
        <span>
          <strong>Tocá el enlace que aparece</strong>
          <span>Se abre Empremta en el lugar correcto.</span>
        </span>
      </li>
    </ol>
  )
}

export default function Scan() {
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const [status, setStatus] = useState('Pidiendo permiso para usar la cámara…')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canScan) return undefined
    let stream = null
    let timer = null
    let stopped = false
    ;(async () => {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats?.()
        if (formats && !formats.includes('qr_code')) throw new Error('unsupported')
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stopped) return
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        setStatus('Apuntá al código QR. Se lee solo.')
        const tick = async () => {
          if (stopped) return
          try {
            for (const code of await detector.detect(video)) {
              const path = qrToPath(code.rawValue)
              if (path) {
                stopped = true
                navigate(path)
                return
              }
              setStatus('Ese código no es de Empremta. Probá con el del cartel o el de la caja.')
            }
          } catch {
            /* cuadro sin imagen todavía: se reintenta */
          }
          timer = setTimeout(tick, 250)
        }
        tick()
      } catch (e) {
        if (stopped) return
        setError(
          e?.name === 'NotAllowedError'
            ? 'No tenemos permiso para usar la cámara. Podés darlo desde la configuración del navegador, o usar la cámara del celular:'
            : 'No pudimos abrir la cámara desde acá. Usá la cámara del celular:',
        )
      }
    })()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [navigate])

  return (
    <div className="page scan">
      <h1>Escanear código QR</h1>
      {canScan && !error ? (
        <>
          <div className="scan-frame">
            <video ref={videoRef} muted playsInline aria-label="Vista de la cámara" />
            <span className="scan-target" aria-hidden="true" />
          </div>
          <p className="scan-status" role="status" aria-live="polite">
            {status}
          </p>
        </>
      ) : (
        <>
          <p className="lede">
            {error || 'Este navegador no puede leer códigos desde la app. Usá la cámara del celular:'}
          </p>
          <CameraHelp />
        </>
      )}
      <Link className="btn btn-secondary btn-block" to="/">
        Volver
      </Link>
    </div>
  )
}
