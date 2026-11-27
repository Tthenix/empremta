import { isPlaceholder } from '../lib/format.js'

export default function PlaceholderBox({ text, label = 'Contenido en preparación' }) {
  if (!text) return null
  if (!isPlaceholder(text)) {
    return <p className="story-text">{text}</p>
  }
  return (
    <div className="placeholder-box" role="note">
      <p className="placeholder-label">{label}</p>
      <p className="placeholder-body">{text}</p>
    </div>
  )
}
