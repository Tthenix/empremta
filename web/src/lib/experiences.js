/**
 * Identidad y pieza interactiva de cada parada.
 * Todo dato sale de STORYTELLING.md (fuentes públicas citadas); no agregar nada que no figure ahí.
 */
export const experiences = {
  pc: {
    theme: { bg: '#3b3833', bg2: '#5c5750', accent: '#d9cfbe' },
    tagline: 'Un muro con dos caras',
    special: {
      after: 'La obra',
      kind: 'wall',
      title: 'El muro, de cerca',
      intro: 'El muro mide 50 metros de largo. Tocá cada parte para verla.',
      // Fotos de la inauguración (15/5/2023). Se nombran por lo que muestran, no por hacia dónde dan: las fuentes no lo confirman.
      faces: [
        {
          id: 'cronologia',
          label: 'Cronología',
          text: 'Una de sus caras cuenta la cronología de Malvinas, desde sus inicios hasta la situación actual por la soberanía. La silueta de las islas está calada en el metal.',
          foto: '/fotos/muro-cronologia.jpg',
          fotoAlt: 'El muro de noche: paneles de metal con textos de la cronología y la silueta de las islas recortada e iluminada.',
          fotoCredito: 'Foto: Prensa Municipalidad de Mendoza',
          fotoFuente: 'https://prensa.ciudaddemendoza.gob.ar/2023/05/15/ulpiano-suarez-inauguro-el-nuevo-memorial-malvinas-argentinas-en-el-parque-central/',
        },
        {
          id: 'caidos',
          label: 'Los caídos',
          text: 'La otra cara está dedicada a los caídos: recorre su historia y rinde homenaje a los 15 mendocinos que murieron en la guerra, con sus nombres grabados en placas. Sobre el metal se lee «Los verdaderos héroes no se olvidan».',
          foto: '/fotos/muro-caidos.jpg',
          fotoAlt: 'Paneles de metal color óxido con la frase «Los verdaderos héroes no se olvidan» recortada en letras grandes.',
          fotoCredito: 'Foto: Prensa Gobierno de Mendoza',
          fotoFuente: 'https://www.mendoza.gov.ar/prensa/el-gobernador-participo-de-la-inauguracion-del-memorial-malvinas-argentinas/',
        },
        {
          id: 'llama',
          label: 'La llama',
          text: 'El memorial incluye además una llama votiva en homenaje a los caídos.',
          foto: '/fotos/muro-llama.jpg',
          fotoAlt: 'La llama votiva encendida en primer plano, con veteranos y autoridades formados detrás, al atardecer.',
          fotoCredito: 'Foto: Prensa Municipalidad de Mendoza',
          fotoFuente: 'https://prensa.ciudaddemendoza.gob.ar/2023/05/15/ulpiano-suarez-inauguro-el-nuevo-memorial-malvinas-argentinas-en-el-parque-central/',
        },
      ],
    },
  },
  plu: {
    theme: { bg: '#163a5c', bg2: '#2f6a99', accent: '#9cc9ee' },
    tagline: 'Casi un siglo frente al cielo',
    // Varias piezas: cada una va después de la parte de la historia cuyo título indica `after`.
    specials: [
      {
        after: 'Un lugar con casi un siglo de historia',
        kind: 'timeline',
        title: 'Casi un siglo, año por año',
        intro: 'Tocá un año para leer qué pasó.',
        events: [
          { year: '1933', text: 'Nace como Base Aérea Militar Los Tamarindos.' },
          { year: '1936', text: 'Pasa a llamarse Base Aérea El Plumerillo.' },
          { year: '1949', text: 'El 15 de marzo se constituye formalmente como IV Brigada Aérea.' },
          {
            year: '1982',
            text: 'El 25 de mayo muere en combate el mayor Jorge Osvaldo García, en el Estrecho de San Carlos, al mando de una escuadrilla de A-4C.',
          },
          { year: '2003', text: 'El 19 de noviembre abre al público el museo que lleva su nombre.' },
          {
            year: '2022',
            text: 'A 40 años de la guerra, la noche del 1 de abril se enciende una llama que ilumina el monumento.',
          },
        ],
      },
      {
        after: 'La plaza',
        kind: 'planes',
        title: 'Los tres aviones',
        intro: 'Están expuestos al aire libre en la plaza. Tocá cada uno.',
        planes: [
          {
            id: 'a4c',
            short: 'A-4C',
            label: 'A-4C Skyhawk',
            facts: [
              'Con los A-4 Skyhawk y los Mirage, la IV Brigada fue durante años una de las principales unidades de combate aéreo del país.',
              'El 25 de mayo de 1982 el mayor Jorge Osvaldo García murió en combate en el Estrecho de San Carlos, al mando de una escuadrilla de A-4C. El museo de la brigada lleva su nombre.',
              'Fernando Klix Berrotaran, cuyo testimonio está al final de esta parada, voló A-4C en esta brigada.',
            ],
            foto: '/fotos/plu-a4c.jpg',
            fotoAlt: 'El A-4C Skyhawk de la plaza, con camuflaje gris y blanco, sobre un pedestal entre árboles.',
            fotoCredito: 'Foto: Cristian Lozano / Sitio Andino',
            fotoFuente: 'https://www.sitioandino.com.ar/fotogaleria/fotogaleria-los-espacios-que-conmemoran-nuestros-heroes-malvinas-mendoza-n5696428',
          },
          {
            id: 'mirage',
            short: 'Mirage III',
            label: 'Mirage III',
            facts: [
              'Es el otro caza con el que la IV Brigada fue durante años una de las principales unidades de combate aéreo del país, junto con los A-4 Skyhawk.',
            ],
            // Recorte de la foto de la plaza: el de alas en delta al fondo (el epígrafe de la nota nombra los tres aviones).
            foto: '/fotos/plu-mirage.jpg',
            fotoAlt: 'El Mirage III de la plaza: un caza de alas en delta, con camuflaje, sobre un pedestal blanco.',
            fotoCredito: 'Foto: Cristian Lozano / Sitio Andino (recorte)',
            fotoFuente: 'https://www.sitioandino.com.ar/fotogaleria/fotogaleria-los-espacios-que-conmemoran-nuestros-heroes-malvinas-mendoza-n5696428',
          },
          {
            id: 'morane',
            short: 'Morane',
            label: 'Morane Saulnier MS 760',
            facts: [
              'La IV Brigada es la única escuela de pilotos de caza de la Argentina.',
              'Antes de ser desplegado a Malvinas, Fernando Klix Berrotaran fue instructor en Morane Saulnier en la Escuela de Caza, donde él mismo había sido alumno.',
            ],
            // shortcut: no hay foto publicada del MS 760 de la plaza; se muestra otro del mismo modelo y se aclara. Reemplazar por una foto propia.
            foto: '/fotos/ms760-ilustrativa.jpg',
            fotoAlt: 'Un Morane Saulnier MS 760 Paris de la Fuerza Aérea, plateado con punta naranja, sobre un pedestal en una rotonda de Mendoza.',
            fotoCredito: 'Foto: Jorge Souto, CC BY-SA 3.0',
            fotoFuente: 'https://commons.wikimedia.org/wiki/File:FAA_MS760_Paris_Mendoza.jpg',
            fotoNota: 'Foto ilustrativa: es otro MS 760 expuesto en Mendoza, no el de la plaza.',
          },
        ],
      },
    ],
  },
  coq: {
    theme: { bg: '#43301d', bg2: '#6e5233', accent: '#e3b986' },
    tagline: '649 nombres en un cruce de caminos',
    specials: [
      {
        after: 'La remodelación de 2021',
        kind: 'timeline',
        title: 'Lo decidieron los vecinos',
        intro: 'La remodelación salió del PAR, Participación Activa y Responsable. Tocá cada paso.',
        events: [
          {
            label: 'Los vecinos proponen',
            text: 'Vecinos de Maipú presentaron la propuesta de remodelar el espacio Héroes de Malvinas.',
          },
          {
            label: 'La comunidad vota',
            text: 'En el PAR la comunidad vota los proyectos, y los que ganan se hacen con el presupuesto del departamento. Este ganó.',
          },
          {
            label: 'La obra',
            text: 'Se colocaron los escudos de Mendoza y de Maipú, y ocho placas de bronce con los nombres de los 649 caídos argentinos.',
            foto: '/fotos/coq-aerea.jpg',
            fotoAlt: 'La rotonda vista desde arriba: un camino rojo cruza el césped hasta la silueta de las islas.',
            fotoCredito: 'Foto: Cristian Lozano / Sitio Andino',
            fotoFuente: 'https://www.sitioandino.com.ar/fotogaleria/fotogaleria-los-espacios-que-conmemoran-nuestros-heroes-malvinas-mendoza-n5696428',
          },
          {
            label: '2 de abril de 2021',
            text: 'A 39 años de la guerra, el intendente Matías Stevanato presentó la obra. Hubo una ofrenda floral sobre las placas y se descubrió una placa recordatoria.',
            foto: '/fotos/coq-acto-2021.jpg',
            fotoAlt: 'El acto del 2 de abril de 2021 en la rotonda, con banderas, autoridades y vecinos.',
            fotoCredito: 'Imagen: Mendoza Post',
            fotoFuente: 'https://www.mendozapost.com/sociedad/maipu-malvinas-homenaje-veteranos/',
          },
        ],
      },
      {
        after: 'La remodelación de 2021',
        kind: 'names',
        title: 'Cada punto, una persona',
        count: 649,
        intro: 'Ocho placas de bronce guardan los nombres de todos los argentinos que murieron en la guerra.',
        outro: 'Maipú se reúne acá a recordar a sus veteranos y a sus caídos.',
      },
      {
        after: 'Los homenajes',
        kind: 'timeline',
        title: 'Una noche de vigilia',
        intro: 'Así fue el homenaje de 2024, a 42 años de la guerra. Tocá cada momento.',
        events: [
          {
            label: 'La tarde del 1 de abril',
            text: 'Las actividades empiezan en la rotonda, con cientos de vecinos y veteranos de la agrupación de Maipú.',
          },
          {
            label: 'La medianoche',
            text: 'A la medianoche se hace la vigilia del 2 de abril, Día del Veterano y de los Caídos.',
            foto: '/fotos/coq-vigilia.jpg',
            fotoAlt: 'Vecinos y veteranos reunidos de noche en el homenaje del 1 de abril de 2024.',
            fotoCredito: 'Foto: Sitio Andino',
            fotoFuente: 'https://www.sitioandino.com.ar/departamentales/maipu-rindio-homenajes-los-heroes-malvinas-n5674194',
          },
          {
            label: 'La mañana del 2 de abril',
            text: 'El homenaje sigue en el Parque de la Familia Héroes de Malvinas, en San Roque.',
          },
        ],
      },
      {
        after: 'Maipú y su memoria de Malvinas',
        kind: 'visit',
        title: 'Visitá el Museo Malvinas',
        intro: 'Lo fundó en julio de 2021 la Asociación Veteranos Unidos por Malvinas, con apoyo del Municipio de Maipú. Lo atienden excombatientes, que hacen las visitas guiadas.',
        foto: '/fotos/museo-malvinas.jpg',
        fotoAlt: 'Tres hombres sonríen frente al mural del Museo Malvinas, pintado con el nombre del museo y la silueta de las islas.',
        fotoCredito: 'Foto: Los Andes',
        fotoFuente: 'https://www.losandes.com.ar/maipu-celebro-el-6-aniversario-del-museo-malvinas-n5998725',
        objects: [
          'Cascos',
          'Municiones',
          'Maquetas del submarino ARA Santa Fe y del destructor Rosales',
          'Artículos personales',
          'Fotografías',
          'Rosarios',
          'Placas conmemorativas',
          'Un cenotafio y cruces por los 649 caídos',
        ],
        address: 'Patricias Argentinas y Presidente Sarmiento, Maipú',
        hours: [
          'Lunes a viernes, de 8 a 14.',
          'Por la tarde, con turno previo por teléfono o redes sociales.',
          'Sábados y domingos, cerrado.',
        ],
        note: 'Datos publicados por Los Andes en julio de 2026. Confirmalos antes de ir.',
      },
    ],
  },
}

const fallback = {
  theme: { bg: '#1f4e79', bg2: '#356e8e', accent: '#9cc9ee' },
  tagline: '',
  special: null,
}

/** Piezas interactivas de un lugar, en orden. */
export function getSpecials(exp) {
  return exp.specials || (exp.special ? [exp.special] : [])
}

export function getExperience(stopId) {
  return experiences[stopId] || fallback
}

export function themeStyle(stopId) {
  const { theme } = getExperience(stopId)
  return { '--exp-bg': theme.bg, '--exp-bg2': theme.bg2, '--exp-accent': theme.accent }
}

/** Texto plano de la pieza interactiva, para leer en voz alta. */
export function specialSpeech(special) {
  if (!special) return ''
  if (special.kind === 'wall') {
    return [special.intro, ...special.faces.map((f) => `${f.label}: ${f.text}`)].join(' ')
  }
  if (special.kind === 'timeline') {
    return special.events.map((e) => `${e.year || e.label}. ${e.text}`).join(' ')
  }
  if (special.kind === 'visit') {
    return [
      special.intro,
      `Qué vas a ver: ${special.objects.join(', ')}.`,
      `Dónde: ${special.address}.`,
      ...special.hours,
      special.note,
    ].join(' ')
  }
  if (special.kind === 'planes') {
    return [special.intro, ...special.planes.map((p) => `${p.label}. ${p.facts.join(' ')}`)].join(' ')
  }
  return [`${special.count} caídos argentinos.`, special.intro, special.outro].join(' ')
}
