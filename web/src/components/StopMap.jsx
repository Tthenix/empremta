import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { getExperience } from '../lib/experiences.js'

function stopIcon(label, color, visited) {
  return L.divIcon({
    className: '',
    html: `<span class="map-pin${visited ? ' is-visited' : ''}" style="--pin:${color}">${label}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

const youIcon = L.divIcon({
  className: '',
  html: '<span class="map-you">Vos</span>',
  iconSize: [44, 26],
  iconAnchor: [22, 13],
})

function FitBounds({ points }) {
  const map = useMap()
  const key = JSON.stringify(points)
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])
  return null
}

/** `stops` llega en el orden a recorrer. Con `origin`, se dibuja el recorrido sugerido desde ahí. */
export default function StopMap({ stops, origin = null, visitedIds = new Set() }) {
  const located = stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
  if (!located.length) return null
  const pending = located.filter((s) => !visitedIds.has(s.id))
  const path = origin ? [origin, ...pending].map((p) => [p.lat, p.lng]) : []
  const points = [...located.map((s) => [s.lat, s.lng]), ...(origin ? [[origin.lat, origin.lng]] : [])]

  return (
    <div className="map-wrap" role="region" aria-label={origin ? 'Mapa con el recorrido sugerido' : 'Mapa de los lugares'}>
      <MapContainer center={points[0]} zoom={11} scrollWheelZoom={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {path.length > 1 && (
          <Polyline positions={path} pathOptions={{ color: '#1f4e79', weight: 4, dashArray: '2 10', lineCap: 'round' }} />
        )}
        {origin && <Marker position={[origin.lat, origin.lng]} icon={youIcon} zIndexOffset={-1000} />}
        {located.map((s, i) => {
          const visited = visitedIds.has(s.id)
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stopIcon(visited ? '✓' : i + 1, getExperience(s.id).theme.bg, visited)}>
              <Popup>
                <strong>{s.nombre}</strong>
                <br />
                {s.lugar}
                <br />
                <Link to={`/v/${s.id}`}>Ver la historia</Link>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
