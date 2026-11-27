import { useState } from 'react'

function Wall({ special }) {
  const [face, setFace] = useState(special.faces[0].id)
  const current = special.faces.find((f) => f.id === face)
  return (
    <div className="piece-wall">
      <div className="segmented" role="group" aria-label="Elegí una cara del muro">
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
      <div className={`wall-face wall-${current.id}`} aria-hidden="true">
        <span className="wall-measure">50 m</span>
      </div>
      <p className="piece-material">{current.material}</p>
      <p className="story-text" aria-live="polite">{current.text}</p>
    </div>
  )
}

function Timeline({ special }) {
  const [open, setOpen] = useState(special.events[0].year)
  return (
    <div className="piece-timeline">
      <ol className="timeline">
        {special.events.map((e) => (
          <li key={e.year} className={open === e.year ? 'is-open' : ''}>
            <button type="button" aria-expanded={open === e.year} onClick={() => setOpen(e.year)}>
              <span className="timeline-year">{e.year}</span>
            </button>
            {open === e.year && <p className="timeline-text">{e.text}</p>}
          </li>
        ))}
      </ol>
      <p className="piece-material">Los tres aviones de la plaza</p>
      <ul className="chips">
        {special.planes.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
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

export default function SpecialPiece({ special }) {
  if (special.kind === 'wall') return <Wall special={special} />
  if (special.kind === 'timeline') return <Timeline special={special} />
  return <Names special={special} />
}
