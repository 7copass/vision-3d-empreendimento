/** Ícones de traço fino, 24×24, herdando currentColor. */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 20,
  height: 20,
  ...p,
})

export const IconeFechar = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconeSetaEsq = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5L7.5 12l7 7" />
  </svg>
)

export const IconeSetaDir = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 5l7 7-7 7" />
  </svg>
)

export const IconeMais = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 6v12M6 12h12" />
  </svg>
)

export const IconeMenos = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 12h12" />
  </svg>
)

export const IconeAjustar = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V5.5A1.5 1.5 0 015.5 4H9M15 4h3.5A1.5 1.5 0 0120 5.5V9M20 15v3.5a1.5 1.5 0 01-1.5 1.5H15M9 20H5.5A1.5 1.5 0 014 18.5V15" />
  </svg>
)

export const IconePlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 5.5l10 6.5-10 6.5z" fill="currentColor" stroke="none" />
  </svg>
)

export const IconePausa = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5v14M15 5v14" strokeWidth={1.8} />
  </svg>
)

/** Dois volumes de alturas diferentes: o seletor de empreendimento. */
export const IconeEmpreendimentos = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V9.5l5.5-2.5V20M9.5 20V12h5.5v8M15 20V4.5l5 2V20M4 20h16" />
    <path d="M6.6 12.4h.6M6.6 15.6h.6M17.2 9.6h.6M17.2 13h.6" />
  </svg>
)

export const IconeCaretBaixo = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 10l5 5 5-5" />
  </svg>
)

export const IconeMudo = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9v6h3l4.5 3.5V5.5L7 9H4z" />
    <path d="M16 9.5l4 5M20 9.5l-4 5" />
  </svg>
)
