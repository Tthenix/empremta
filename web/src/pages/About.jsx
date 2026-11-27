import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConfig } from '../lib/api.js'

export default function About() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
  }, [])

  return (
    <div className="page about">
      <h1>Acerca de Empremta</h1>
      <p className="lede">
        Una ruta de memoria de Malvinas en Mendoza, con registro de visitas y apoyo verificable
        a veteranos.
      </p>

      <section className="about-panel" aria-labelledby="proyecto-title">
        <h2 id="proyecto-title">El proyecto</h2>
        <p>
          La Ruta de la Memoria conecta lugares de memoria de Malvinas en Mendoza. En cada parada
          se puede leer el relato del lugar y registrar la visita. Ese recorrido se puede canjear
          por un descuento en comercios adheridos, y cada pago destina una parte al centro de
          veteranos de forma pública y verificable en Stellar.
        </p>
        <p>
          No se inventan testimonios, citas ni biografías. La reseña de cada monumento se basa en
          fuentes públicas oficiales y periodísticas, y los relatos citados provienen de
          entrevistas publicadas con atribución completa, a la espera de confirmación directa y
          nuevos testimonios cedidos por veteranos.
        </p>
      </section>

      <section className="about-panel" aria-labelledby="fuentes-title">
        <h2 id="fuentes-title">Fuentes y citas</h2>

        <h3>Testimonios de veteranos (extractos citados)</h3>
        <p>
          <strong>Ecos de Malvinas: 41 años, 41 entrevistas</strong> — Mariana Cóvolo y Jorge C.
          Dragonetti (coord.), Valentina Araya, Hernán Cotela, Rocío Ortolano, Clara Ralo Venditti y
          Valentina Vera; prólogo de Adriana Micale. Ediciones Universidad de Congreso (EdiUC),
          Mendoza, 2023. ISBN 978-987-82840-1-9.{' '}
          <a
            href="https://ediuc.ucongreso.edu.ar/wp-content/uploads/sites/6/2024/05/Malvinas_digital.pags_.2024.ok_.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Consultar edición digital (PDF, EdiUC)
          </a>
        </p>
        <ul className="about-sources-list">
          <li>
            <strong>Memorial Malvinas Argentinas (Parque Central):</strong> entrevista a Miguel
            Rivero (24/5/2022), p. 75.
          </li>
          <li>
            <strong>Plaza Héroes de Malvinas (IV Brigada Aérea, El Plumerillo):</strong> entrevista
            al comodoro (R) Fernando Klix Berrotaran (6/10/2020), pp. 157–158.
          </li>
          <li>
            <strong>Monumento a los Caídos en Malvinas (Coquimbito, Maipú):</strong> entrevista a
            Ramón Andrés Suárez (31/1/2023), pp. 150–151.
          </li>
        </ul>

        <h3>Historia de los monumentos (fuentes públicas)</h3>
        <ul className="about-sources-list">
          <li>
            <strong>Parque Central:</strong>{' '}
            <a
              href="https://prensa.ciudaddemendoza.gob.ar/2023/05/15/ulpiano-suarez-inauguro-el-nuevo-memorial-malvinas-argentinas-en-el-parque-central/"
              target="_blank"
              rel="noreferrer"
            >
              Municipalidad de la Ciudad de Mendoza (15/5/2023)
            </a>
            ,{' '}
            <a
              href="https://www.mendoza.gov.ar/prensa/el-gobernador-participo-de-la-inauguracion-del-memorial-malvinas-argentinas/"
              target="_blank"
              rel="noreferrer"
            >
              Gobierno de Mendoza (15/5/2023)
            </a>
            ,{' '}
            <a
              href="https://www.diariouno.com.ar/sociedad/inauguraron-el-nuevo-memorial-malvinas-argentinas-ubicado-el-parque-central-n1100702"
              target="_blank"
              rel="noreferrer"
            >
              Diario UNO
            </a>
            ,{' '}
            <a
              href="https://www.losandes.com.ar/sociedad/se-entregaron-los-premios-del-concurso-memorial-malvinas-mendoza"
              target="_blank"
              rel="noreferrer"
            >
              Los Andes (concurso)
            </a>{' '}
            y{' '}
            <a
              href="https://www.losandes.com.ar/sociedad/se-iniciaron-las-obras-del-memorial-malvinas-mendoza-en-ciudad"
              target="_blank"
              rel="noreferrer"
            >
              Los Andes (inicio de obras)
            </a>
            .
          </li>
          <li>
            <strong>IV Brigada Aérea, El Plumerillo:</strong>{' '}
            <a
              href="https://www.argentina.gob.ar/fuerzaaerea/patrimonio-cultural/museos/mendoza"
              target="_blank"
              rel="noreferrer"
            >
              Fuerza Aérea Argentina (Museo Histórico)
            </a>
            ,{' '}
            <a
              href="https://www.sitioandino.com.ar/fotogaleria/fotogaleria-los-espacios-que-conmemoran-nuestros-heroes-malvinas-mendoza-n5696428"
              target="_blank"
              rel="noreferrer"
            >
              Sitio Andino
            </a>
            ,{' '}
            <a
              href="https://www.losandes.com.ar/sociedad/la-iv-brigada-aerea-celebro-su-77-aniversario-las-fotos-las-impactantes-proezas-aereas-n5984273"
              target="_blank"
              rel="noreferrer"
            >
              Los Andes (77° aniversario)
            </a>{' '}
            y{' '}
            <a
              href="https://www.mendozapost.com/sociedad/las-heras-homenaje-veteranos-guerra-malvinas-fotos/"
              target="_blank"
              rel="noreferrer"
            >
              Mendoza Post (acto 2022)
            </a>
            .
          </li>
          <li>
            <strong>Coquimbito, Maipú:</strong>{' '}
            <a
              href="https://cuyonoticias.com/contenido/1050/maipu-rindio-homenaje-a-39-anos-de-la-guerra-de-malvinas"
              target="_blank"
              rel="noreferrer"
            >
              Cuyo Noticias (3/4/2021)
            </a>
            ,{' '}
            <a
              href="https://www.mendozapost.com/sociedad/maipu-malvinas-homenaje-veteranos/"
              target="_blank"
              rel="noreferrer"
            >
              Mendoza Post (2/4/2021)
            </a>
            ,{' '}
            <a
              href="https://www.sitioandino.com.ar/departamentales/maipu-rindio-homenajes-los-heroes-malvinas-n5674194"
              target="_blank"
              rel="noreferrer"
            >
              Sitio Andino (3/4/2024)
            </a>{' '}
            y{' '}
            <a
              href="https://www.losandes.com.ar/maipu-celebro-el-6-aniversario-del-museo-malvinas-n5998725"
              target="_blank"
              rel="noreferrer"
            >
              Los Andes (Museo Malvinas)
            </a>
            .
          </li>
        </ul>
        <h3>Fotos</h3>
        <ul className="about-sources-list">
          <li>
            <strong>Memorial Malvinas Argentinas:</strong> Prensa Municipalidad de Mendoza, publicada en{' '}
            <a
              href="https://www.sitioandino.com.ar/departamentales/ciudad-mendoza-asi-fue-la-tradicional-vigilia-los-veteranos-y-caidos-n5674137"
              target="_blank"
              rel="noreferrer"
            >
              Sitio Andino (2/4/2024)
            </a>
            .
          </li>
          <li>
            <strong>Plaza Héroes de Malvinas y Monumento de Coquimbito:</strong> Cristian Lozano,{' '}
            <a
              href="https://www.sitioandino.com.ar/fotogaleria/fotogaleria-los-espacios-que-conmemoran-nuestros-heroes-malvinas-mendoza-n5696428"
              target="_blank"
              rel="noreferrer"
            >
              Sitio Andino (2/4/2025)
            </a>
            .
          </li>
        </ul>

        <p className="fine-print">
          Las fotos y las citas se incluyen con fines culturales y educativos indicando fuente y autoría; ante
          cualquier corrección o pedido de retiro de autores, editorial o veteranos, se actualizan
          de inmediato.
        </p>
      </section>

      <section className="about-panel" aria-labelledby="demo-title">
        <h2 id="demo-title">Demostración técnica</h2>
        <p>
          Esta versión corre en la <strong>testnet</strong> de Stellar. Los saldos son de prueba.
          {config?.centroLabel ? (
            <>
              {' '}
              El destinatario de los aportes figura como <em>{config.centroLabel}</em>.
            </>
          ) : null}
        </p>
        <p>
          Proyecto presentado en la hackathon FLAT 2026 (BAF × Stellar), ejes Memoria y Territorio.
        </p>
        <p className="about-demo">
          <Link className="btn btn-secondary" to="/comercio/m1">
            Abrir caja de demostración
          </Link>
        </p>
      </section>
    </div>
  )
}
