import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { readFlag, writeFlag } from '../lib/format.js'

const icons = {
  pin: (
    <>
      <path d="M12 21s-6-5.3-6-10.2A6 6 0 1 1 18 10.8C18 15.7 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  huella: (
    <>
      <path d="M8 20c-1.5-2-2.2-4.5-2-7.2A6 6 0 0 1 18 12c0 1.5-.1 3-.5 4.4" />
      <path d="M11.5 20.5c-.9-1.8-1.3-3.9-1.3-6.2a1.9 1.9 0 0 1 3.8 0c0 2.2-.3 4.3-1 6" />
      <path d="M15.3 19.5c.3-1 .5-2.2.6-3.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l1.8 1.8 3.5-3.6" />
    </>
  ),
}

function NavIcon({ kind }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[kind]}
    </svg>
  )
}

const links = [
  { to: '/', label: 'La ruta', icon: 'pin', end: true },
  { to: '/recorrido', label: 'Mis huellas', icon: 'huella' },
  { to: '/transparencia', label: 'Aportes', icon: 'shield' },
]

const sizes = [
  { id: 'normal', label: 'Normal' },
  { id: 'grande', label: 'Grande' },
  { id: 'muy-grande', label: 'Muy grande' },
]

function useTextSize() {
  const [size, setSize] = useState(() => readFlag('empremta-texto') || 'normal')
  useEffect(() => {
    document.documentElement.dataset.texto = size
    writeFlag('empremta-texto', size)
  }, [size])
  const current = sizes.find((s) => s.id === size) || sizes[0]
  const next = sizes[(sizes.indexOf(current) + 1) % sizes.length]
  return { current, cycle: () => setSize(next.id) }
}

export default function Layout() {
  const text = useTextSize()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Empremta, Ruta de la Memoria: ir al inicio">
          <img src="/brand/empremta-header-color.svg" alt="" className="brand-logo" />
        </NavLink>
        <nav className="site-nav" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <button type="button" className="text-size-btn" onClick={text.cycle} aria-label={`Tamaño de letra: ${text.current.label}. Tocá para cambiar.`}>
            <span aria-hidden="true" className="text-size-glyph">
              A<small>A</small>
            </span>
            <span aria-hidden="true">Letra</span>
          </button>
          <NavLink to="/acerca" className="about-link">
            Acerca
          </NavLink>
        </div>
      </header>
      <main id="contenido" className="site-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Navegación">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}>
            <span className="bottom-nav-icon">
              <NavIcon kind={l.icon} />
            </span>
            <span className="bottom-nav-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
