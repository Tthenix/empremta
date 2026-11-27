import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/recorrido', label: 'Mi recorrido' },
  { to: '/transparencia', label: 'Transparencia' },
  { to: '/acerca', label: 'Acerca' },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Empremta, Ruta de la Memoria: ir al inicio">
          <img src="/brand/empremta-horizontal-color.svg" alt="" width="178" height="60" className="brand-logo" />
          <span className="brand-subtitle">Ruta de la Memoria · Malvinas · Mendoza</span>
        </NavLink>
        <nav className="site-nav" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="contenido" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Malvinas · Mendoza · memoria y territorio</p>
      </footer>
    </div>
  )
}
