import { useState } from 'react'
import StopPhoto from './StopPhoto.jsx'

function Wall({ special }) {
  const [face, setFace] = useState(special.faces[0].id)
  const current = special.faces.find((f) => f.id === face)
  return (
    <div className="piece-wall">
      <div className="segmented" role="group" aria-label="Elegí qué parte del memorial ver">
        {special.faces.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={face === f.id}
            onClick={() => setFace(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <StopPhoto key={current.id} stop={{ ...current, nombre: current.label }} className="piece-photo" />
      <p className="story-text" aria-live="polite">{current.text}</p>
    </div>
  )
}

function Timeline({ special }) {
  const keyOf = (e) => e.year || e.label
  const [open, setOpen] = useState(keyOf(special.events[0]))
  return (
    <div className="piece-timeline">
      <ol className="timeline">
        {special.events.map((e) => {
          const isOpen = open === keyOf(e)
          return (
            <li key={keyOf(e)} className={isOpen ? 'is-open' : ''}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(keyOf(e))}>
                <span className={e.year ? 'timeline-year' : 'timeline-year timeline-label'}>{keyOf(e)}</span>
              </button>
              {isOpen && (
                <>
                  <p className="timeline-text">{e.text}</p>
                  <StopPhoto stop={{ ...e, nombre: keyOf(e) }} className="piece-photo timeline-photo" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Planes({ special }) {
  const [id, setId] = useState(special.planes[0].id)
  const plane = special.planes.find((p) => p.id === id)
  return (
    <div className="piece-planes">
      <div className="segmented" role="group" aria-label="Elegí un avión">
        {special.planes.map((p) => (
          <button key={p.id} type="button" aria-pressed={id === p.id} onClick={() => setId(p.id)}>
            {p.short}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        <StopPhoto key={plane.id} stop={{ ...plane, nombre: plane.label }} className="piece-photo" />
        {plane.fotoNota && <p className="photo-note">{plane.fotoNota}</p>}
        <h3 className="plane-name">{plane.label}</h3>
        <ul className="plane-facts">
          {plane.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Names({ special }) {
  return (
    <div className="piece-names">
      <p className="names-count">
        <strong>{special.count}</strong>
        <span>caídos argentinos</span>
      </p>
      <div className="names-field" aria-hidden="true">
        {Array.from({ length: special.count }, (_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>
      <p className="story-text">{special.outro}</p>
    </div>
  )
}

function Visit({ special }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${special.address}, Mendoza`)}`
  return (
    <div className="piece-visit">
      <StopPhoto stop={{ ...special, nombre: special.title }} className="piece-photo" />
      <h3 className="plane-name">Qué vas a ver</h3>
      <ul className="plane-facts">
        {special.objects.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <div className="visit-info">
        <h3 className="plane-name">Dónde y cuándo</h3>
        <p className="visit-address">{special.address}</p>
        <ul className="visit-hours">
          {special.hours.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <a className="btn btn-primary btn-block" href={maps} target="_blank" rel="noreferrer">
          Cómo llegar al museo
        </a>
        <p className="photo-note">{special.note}</p>
      </div>
    </div>
  )
}

export default function SpecialPiece({ special }) {
  if (special.kind === 'wall') return <Wall special={special} />
  if (special.kind === 'timeline') return <Timeline special={special} />
  if (special.kind === 'planes') return <Planes special={special} />
  if (special.kind === 'visit') return <Visit special={special} />
  return <Names special={special} />
}
