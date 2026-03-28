function Svg({ size = 22, children }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/* ── Soleil ─────────────────────────────────────────── */
export function WiSun({ size }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"     x2="12" y2="4.5" />
      <line x1="12" y1="19.5"  x2="12" y2="22" />
      <line x1="2"  y1="12"    x2="4.5" y2="12" />
      <line x1="19.5" y1="12"  x2="22" y2="12" />
      <line x1="4.93"  y1="4.93"  x2="6.76"  y2="6.76" />
      <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" />
      <line x1="4.93"  y1="19.07" x2="6.76"  y2="17.24" />
      <line x1="17.24" y1="6.76"  x2="19.07" y2="4.93" />
    </Svg>
  )
}

/* ── Peu nuageux (soleil + nuage) ───────────────────── */
export function WiPartlyCloudy({ size }) {
  return (
    <Svg size={size}>
      {/* soleil qui dépasse en haut à droite */}
      <circle cx="17.5" cy="5.5" r="2.5" />
      <line x1="17.5" y1="1.5" x2="17.5" y2="2.5" />
      <line x1="17.5" y1="8.5" x2="17.5" y2="9.5" />
      <line x1="13.5" y1="5.5" x2="14.5" y2="5.5" />
      <line x1="20.5" y1="5.5" x2="21.5" y2="5.5" />
      <line x1="14.97" y1="2.97" x2="15.68" y2="3.68" />
      <line x1="19.32" y1="7.32" x2="20.03" y2="8.03" />
      <line x1="14.97" y1="8.03" x2="15.68" y2="7.32" />
      <line x1="19.32" y1="3.68" x2="20.03" y2="2.97" />
      {/* nuage devant */}
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Svg>
  )
}

/* ── Nuageux ────────────────────────────────────────── */
export function WiCloudy({ size }) {
  return (
    <Svg size={size}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Svg>
  )
}

/* ── Pluie ──────────────────────────────────────────── */
export function WiRainy({ size }) {
  return (
    <Svg size={size}>
      {/* nuage décalé vers le haut */}
      <path d="M18 8h-1.26A8 8 0 1 0 9 18h9a5 5 0 0 0 0-10z" />
      {/* gouttes de pluie */}
      <line x1="8"  y1="19" x2="7"  y2="22" />
      <line x1="12" y1="19" x2="11" y2="22" />
      <line x1="16" y1="19" x2="15" y2="22" />
    </Svg>
  )
}

/* ── Orageux ────────────────────────────────────────── */
export function WiStormy({ size }) {
  return (
    <Svg size={size}>
      {/* nuage haut */}
      <path d="M18 8h-1.26A8 8 0 1 0 9 18h9a5 5 0 0 0 0-10z" />
      {/* éclair */}
      <polyline points="13,18 10.5,21 13,21 10.5,24" />
    </Svg>
  )
}

/* ── Neige ──────────────────────────────────────────── */
export function WiSnowy({ size }) {
  return (
    <Svg size={size}>
      {/* nuage haut */}
      <path d="M18 8h-1.26A8 8 0 1 0 9 18h9a5 5 0 0 0 0-10z" />
      {/* cristaux de neige (croix) */}
      <line x1="8"  y1="19.5" x2="8"  y2="22.5" />
      <line x1="6.5" y1="21" x2="9.5" y2="21" />
      <line x1="12" y1="19.5" x2="12" y2="22.5" />
      <line x1="10.5" y1="21" x2="13.5" y2="21" />
      <line x1="16" y1="19.5" x2="16" y2="22.5" />
      <line x1="14.5" y1="21" x2="17.5" y2="21" />
    </Svg>
  )
}

/* ── Brouillard ─────────────────────────────────────── */
export function WiFoggy({ size }) {
  return (
    <Svg size={size}>
      <line x1="3"  y1="7"  x2="21" y2="7" />
      <line x1="3"  y1="12" x2="21" y2="12" />
      <line x1="3"  y1="17" x2="21" y2="17" />
    </Svg>
  )
}

/* ── Vent ───────────────────────────────────────────── */
export function WiWindy({ size }) {
  return (
    <Svg size={size}>
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
      <path d="M10.59 19.41A2 2 0 1 0 12 16H2" />
      <path d="M15.73 8.27A2.5 2.5 0 1 1 17.5 12H2" />
    </Svg>
  )
}

/* ── Table des options météo ────────────────────────── */
export const WEATHER_OPTIONS = [
  { key: 'sunny',         label: 'Ensoleillé',  Icon: WiSun },
  { key: 'partly_cloudy', label: 'Peu nuageux', Icon: WiPartlyCloudy },
  { key: 'cloudy',        label: 'Nuageux',     Icon: WiCloudy },
  { key: 'rainy',         label: 'Pluie',       Icon: WiRainy },
  { key: 'stormy',        label: 'Orage',       Icon: WiStormy },
  { key: 'snowy',         label: 'Neige',       Icon: WiSnowy },
  { key: 'foggy',         label: 'Brouillard',  Icon: WiFoggy },
  { key: 'windy',         label: 'Vent',        Icon: WiWindy },
]
