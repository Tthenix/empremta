/**
 * Identidad y pieza interactiva de cada parada.
 * Todo dato sale de STORYTELLING.md (fuentes públicas citadas); no agregar nada que no figure ahí.
 */
export const experiences = {
  pc: {
    theme: { bg: '#3b3833', bg2: '#5c5750', accent: '#d9cfbe' },
    tagline: 'Un muro con dos caras',
    special: {
      kind: 'wall',
      title: 'Las dos caras del muro',
      intro: 'El muro mide 50 metros de largo. Tocá cada cara para ver qué cuenta.',
      faces: [
        {
          id: 'calle',
          label: 'Hacia la calle',
          material: 'Metal calado',
          text: 'La cara que da a la calle es metálica y calada. Cuenta la cronología de Malvinas, desde sus inicios hasta la situación actual por la soberanía.',
        },
        {
          id: 'parque',
          label: 'Hacia el parque',
          material: 'Piedra',
          text: 'La cara que da al parque es de piedra, más austera. Está dedicada a los caídos y rinde homenaje a los 15 mendocinos que murieron en la guerra, con sus nombres grabados en placas.',
        },
      ],
    },
  },
  plu: {
    theme: { bg: '#163a5c', bg2: '#2f6a99', accent: '#9cc9ee' },
    tagline: 'Casi un siglo frente al cielo',
    special: {
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
      planes: ['A-4C Skyhawk', 'Mirage III', 'Morane Saulnier MS 760'],
    },
  },
  coq: {
    theme: { bg: '#43301d', bg2: '#6e5233', accent: '#e3b986' },
    tagline: '649 nombres en un cruce de caminos',
    special: {
      kind: 'names',
      title: '649 nombres',
      count: 649,
      intro: 'Cada punto es una persona. Ocho placas de bronce guardan los nombres de los 649 argentinos que murieron en la guerra.',
      outro: 'La remodelación la propusieron vecinos y la votó la comunidad de Maipú en 2021.',
    },
  },
}

const fallback = {
  theme: { bg: '#1f4e79', bg2: '#356e8e', accent: '#9cc9ee' },
  tagline: '',
  special: null,
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
    return [
      ...special.events.map((e) => `${e.year}. ${e.text}`),
      `En la plaza hay tres aviones: ${special.planes.join(', ')}.`,
    ].join(' ')
  }
  return [special.intro, special.outro].join(' ')
}
