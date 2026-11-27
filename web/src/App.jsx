import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Loading from './components/Loading.jsx'

const Stop = lazy(() => import('./pages/Stop.jsx'))
const Journey = lazy(() => import('./pages/Journey.jsx'))
const Pay = lazy(() => import('./pages/Pay.jsx'))
const Redeem = lazy(() => import('./pages/Redeem.jsx'))
const Merchant = lazy(() => import('./pages/Merchant.jsx'))
const Transparency = lazy(() => import('./pages/Transparency.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Scan = lazy(() => import('./pages/Scan.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading label="Cargando…" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/v/:stopId" element={<Stop />} />
            <Route path="/recorrido" element={<Journey />} />
            <Route path="/pagar" element={<Pay />} />
            <Route path="/canjear" element={<Redeem />} />
            <Route path="/comercio/:id" element={<Merchant />} />
            <Route path="/transparencia" element={<Transparency />} />
            <Route path="/acerca" element={<About />} />
            <Route path="/escanear" element={<Scan />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
