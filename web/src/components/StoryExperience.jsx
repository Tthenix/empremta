import { useEffect, useRef, useState } from 'react'
import SpecialPiece from './SpecialPiece.jsx'
import { isPlaceholder } from '../lib/format.js'
import { getSpecials, specialSpeech } from '../lib/experiences.js'

function buildChapters(stop, exp) {
  const chapters = []
  if (stop.historiaCorta) {
    chapters.push({ id: 'intro', kicker: 'En pocas palabras', title: exp.tagline || stop.nombre, paragraphs: [stop.historiaCorta] })
  }
  let current = null
  for (const block of (stop.historiaLarga || '').split('\n\n')) {
    const text = block.trim()
    if (!text) continue
    if (text.startsWith('### ') || !current) {
      current = { id: `c${chapters.length}`, title: text.startsWith('### ') ? text.slice(4) : 'La historia', paragraphs: [] }
      chapters.push(current)
      if (text.startsWith('### ')) continue
    }
    current.paragraphs.push(text)
  }
  getSpecials(exp).forEach((special, i) => {
    const anchor = chapters.findIndex((c) => c.title === special.after)
    let at = anchor >= 0 ? anchor + 1 : Math.min(2, chapters.length)
    // Varias piezas tras la misma parte quedan en el orden en que se declararon.
    while (chapters[at]?.special) at++
    chapters.splice(at, 0, { id: `special-${i}`, kicker: 'Mirá de cerca', title: special.title, intro: special.intro, special })
  })
  if (stop.historia && !isPlaceholder(stop.historia)) {
    chapters.push({
      id: 'voz',
      kicker: 'Voz de un veterano',
      title: stop.testimonioDe ? `Testimonio de ${stop.testimonioDe}` : 'En primera persona',
      paragraphs: stop.historia.split('\n\n'),
      voice: true,
    })
  }
  return chapters
}

function chapterSpeech(ch) {
  if (ch.special) return `${ch.title}. ${specialSpeech(ch.special)}`
  return [ch.title, ...ch.paragraphs].join('. ')
}

function scrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function pickSpanishVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || []
  return voices.find((v) => v.lang === 'es-AR') || voices.find((v) => v.lang?.toLowerCase().startsWith('es')) || null
}

function Chapter({ ch, stop, headingRef }) {
  return (
    <article className={`chapter ${ch.voice ? 'chapter-voice' : ''}`} aria-labelledby={`ch-${ch.id}`}>
      {ch.kicker && <p className="chapter-kicker">{ch.kicker}</p>}
      <h2 id={`ch-${ch.id}`} ref={headingRef} tabIndex={-1}>
        {ch.title}
      </h2>
      {ch.intro && <p className="chapter-intro">{ch.intro}</p>}
      {ch.special && <SpecialPiece special={ch.special} />}
      {ch.paragraphs?.map((p, i) => (
        <p key={i} className={p.startsWith('«') ? 'veteran-quote' : 'story-text'}>
          {p}
        </p>
      ))}
      {ch.voice && stop.audio && (
        <audio controls src={stop.audio} className="stop-audio">
          Tu navegador no reproduce audio.
        </audio>
      )}
      {ch.voice && stop.fuente && (
        <p className="story-attribution">
          {stop.fuente}
          {stop.fuenteUrl && (
            <>
              {' '}
              <a href={stop.fuenteUrl} target="_blank" rel="noreferrer">
                Ver el libro (EdiUC)
              </a>
            </>
          )}
        </p>
      )}
    </article>
  )
}

function StoryEnd({ finishDescription, children }) {
  return (
    <div className="story-end">
      <p className="story-end-title">Terminaste la historia de este lugar.</p>
      <p>{finishDescription}</p>
      {children}
    </div>
  )
}

export default function StoryExperience({ stop, exp, onFinish, finishLabel, finishDescription }) {
  const chapters = buildChapters(stop, exp)
  const [index, setIndex] = useState(0)
  const [allAtOnce, setAllAtOnce] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const headingRef = useRef(null)
  const topRef = useRef(null)
  const moved = useRef(false)
  const touchStart = useRef(null)
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  // La voz real cedida tiene prioridad: con grabación no se ofrece voz sintética.
  const canListen = speechSupported && !stop.audio

  useEffect(() => () => {
    if (speechSupported) window.speechSynthesis.cancel()
  }, [speechSupported])

  useEffect(() => {
    if (!moved.current) return
    topRef.current?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }, [index])

  function stopSpeech() {
    if (speechSupported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  function go(next) {
    stopSpeech()
    moved.current = true
    setHintVisible(false)
    setIndex(next)
  }

  function onTouchStart(event) {
    if (allAtOnce || event.target.closest?.('button, a, audio, input, textarea, select, summary')) return
    const touch = event.changedTouches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event) {
    const start = touchStart.current
    touchStart.current = null
    if (!start || allAtOnce) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return
    if (dx < 0 && index < chapters.length - 1) go(index + 1)
    if (dx > 0 && index > 0) go(index - 1)
  }

  function toggleSpeech() {
    if (speaking) return stopSpeech()
    const text = allAtOnce ? chapters.map(chapterSpeech).join('. ') : chapterSpeech(chapters[index])
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickSpanishVoice()
    u.lang = voice?.lang || 'es-AR'
    if (voice) u.voice = voice
    u.rate = 0.92
    u.onend = u.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setSpeaking(true)
  }

  if (!chapters.length) return null
  const ch = chapters[index]
  const last = index === chapters.length - 1
  const pendingVoice = isPlaceholder(stop.historia)
  const voiceIndex = chapters.findIndex((c) => c.voice)
  const voiceName = stop.testimonioDe || 'un veterano'
  const placeParts = chapters.length - (voiceIndex >= 0 ? 1 : 0)

  function goToTestimony() {
    if (!allAtOnce) return go(voiceIndex)
    stopSpeech()
    const heading = document.getElementById('ch-voz')
    heading?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
    heading?.focus({ preventScroll: true })
  }

  const endDescription = finishDescription || 'Podés volver a la ruta cuando quieras.'

  return (
    <section
      className="story-xp"
      ref={topRef}
      aria-label="Historia del lugar"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null
      }}
    >
      <p className="story-contents">
        La historia del lugar en {placeParts} {placeParts === 1 ? 'parte' : 'partes'}
        {voiceIndex >= 0 && (
          <>
            {' '}y el testimonio de <strong>{voiceName}</strong>, veterano de Malvinas
          </>
        )}
        .
      </p>
      {!allAtOnce && index === 0 && hintVisible && chapters.length > 1 && (
        <p className="story-hint">
          Deslizá o tocá <strong>Seguir</strong> para ver la próxima parte.
        </p>
      )}
      <div className="story-tools">
        {canListen && (
          <button type="button" className="tool-btn" aria-pressed={speaking} onClick={toggleSpeech}>
            <span aria-hidden="true">{speaking ? '■' : '▶'}</span>
            {speaking ? 'Detener' : allAtOnce ? 'Escuchar todo' : 'Escuchar esta parte'}
          </button>
        )}
        {voiceIndex >= 0 && (
          <button type="button" className="tool-btn" aria-pressed={!allAtOnce && index === voiceIndex} onClick={goToTestimony}>
            <span aria-hidden="true">❝</span>
            Testimonio de {voiceName}
          </button>
        )}
        <button
          type="button"
          className="tool-btn"
          aria-pressed={allAtOnce}
          onClick={() => {
            stopSpeech()
            setAllAtOnce((v) => !v)
          }}
        >
          {allAtOnce ? 'Leer por partes' : 'Leer todo seguido'}
        </button>
      </div>
      <div className="sr-status" role="status" aria-live="polite">
        {speaking ? 'Leyendo en voz alta…' : ''}
      </div>
      {!allAtOnce && (
        <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          Parte {index + 1} de {chapters.length}: {ch.title}
          {last ? '. Última parte.' : ''}
        </div>
      )}

      {allAtOnce ? (
        <>
          {chapters.map((c) => <Chapter key={c.id} ch={c} stop={stop} />)}
          <StoryEnd finishDescription={endDescription}>
            {onFinish && (
              <button type="button" className="btn btn-primary btn-block" onClick={onFinish}>
                {finishLabel}
              </button>
            )}
          </StoryEnd>
        </>
      ) : (
        <>
          {chapters.length > 1 && (
            <div className="chapter-stepper" role="group" aria-label="Progreso de la historia">
              <p className="chapter-count">
                Parte {index + 1} de {chapters.length}
              </p>
              <ol className="chapter-dots">
                {chapters.map((c, i) => (
                  <li
                    key={c.id}
                    className={`chapter-dot${i < index ? ' is-done' : ''}${i === index ? ' is-current' : ''}`}
                    aria-current={i === index ? 'step' : undefined}
                    aria-hidden={i === index ? undefined : true}
                  >
                    <span className="visually-hidden">
                      Parte {i + 1} de {chapters.length}: {c.title}
                      {i === index ? ', parte actual' : ''}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Chapter key={ch.id} ch={ch} stop={stop} headingRef={headingRef} />
          {last && <StoryEnd finishDescription={endDescription} />}
          <div className={`chapter-nav${index === 0 ? ' chapter-nav-first' : ''}`} role="group" aria-label="Navegación entre partes de la historia">
            {index > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                aria-label={`Volver a la parte ${index} de ${chapters.length}: ${chapters[index - 1].title}`}
                onClick={() => go(index - 1)}
              >
                ← Anterior
              </button>
            )}
            {!last ? (
              <button
                type="button"
                className="btn btn-primary"
                aria-label={`Seguir a la parte ${index + 2} de ${chapters.length}: ${chapters[index + 1].title}`}
                onClick={() => go(index + 1)}
              >
                Seguir →
              </button>
            ) : (
              onFinish && (
                <button type="button" className="btn btn-primary" onClick={onFinish}>
                  {finishLabel}
                </button>
              )
            )}
          </div>
        </>
      )}

      {(allAtOnce || last) && pendingVoice && (
        <p className="voice-pending">
          El relato de un veterano para este lugar está en preparación. Solo se publica con su
          permiso.
        </p>
      )}

      {(allAtOnce || last) && stop.fuentesLugar?.length > 0 && (
        <details className="sources">
          <summary>¿De dónde sale esta historia?</summary>
          <ul>
            {stop.fuentesLugar.map((item, i) => {
              const url = typeof item === 'string' ? item : item.url
              return (
                <li key={url || i}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {typeof item === 'string' ? item : item.label || item.url}
                  </a>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </section>
  )
}
