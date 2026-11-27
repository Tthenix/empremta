import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function StopMap({ stops }) {
  if (!stops?.length) return null
  const center = [
    stops.reduce((s, x) => s + x.lat, 0) / stops.length,
    stops.reduce((s, x) => s + x.lng, 0) / stops.length,
  ]

  return (
    <div className="map-wrap" aria-label="Mapa de paradas">
      <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
            <Popup>
              <strong>{s.nombre}</strong>
              <br />
              {s.lugar}
              <br />
              <Link to={`/v/${s.id}`}>Ver parada</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
