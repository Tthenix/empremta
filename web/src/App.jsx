import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Stop from './pages/Stop.jsx'
import Journey from './pages/Journey.jsx'
import Pay from './pages/Pay.jsx'
import Merchant from './pages/Merchant.jsx'
import Transparency from './pages/Transparency.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/v/:stopId" element={<Stop />} />
          <Route path="/recorrido" element={<Journey />} />
          <Route path="/pagar" element={<Pay />} />
          <Route path="/comercio/:id" element={<Merchant />} />
          <Route path="/transparencia" element={<Transparency />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
