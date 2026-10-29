/**
 * Estado compartilhado do tour. Nenhuma frente altera este arquivo:
 * se precisar de um campo novo, peça ao integrador.
 */
import { create } from 'zustand'
import type { Filtros, Modo, PresetHora, TowerId, Unidade } from './types'
import { UNIDADES } from '../data/inventory'

const HORA_DO_PRESET: Record<PresetHora, number> = {
  manha: 7.5,
  meiodia: 12,
  portaldosol: 17.6,
  noite: 20.5,
}

/**
 * Faixa do dia a que uma hora pertence. O preset continua sempre preenchido
 * — quem acende as janelas testa `preset === 'noite'` e precisa que arrastar
 * a régua até as 21h acenda o prédio. O que a régua solta é o `presetExato`,
 * e é ele que a barra superior usa para acender o chip.
 */
export function presetDaHora(hora: number): PresetHora {
  if (hora < 5.6 || hora >= 18.4) return 'noite'
  if (hora < 10) return 'manha'
  if (hora < 15.5) return 'meiodia'
  return 'portaldosol'
}

const FILTROS_VAZIOS: Filtros = {
  tipologias: [],
  status: [],
  orientacoes: [],
  andarMin: 1,
  precoMax: null,
}

interface TourState {
  // tempo
  hora: number
  mes: number
  preset: PresetHora
  /** A hora atual é exatamente a do preset? A barra só acende o chip se sim. */
  presetExato: boolean
  setHora: (h: number) => void
  setMes: (m: number) => void
  setPreset: (p: PresetHora) => void

  // navegação
  modo: Modo
  setModo: (m: Modo) => void

  // seleção
  torreAtiva: TowerId | null
  andarAtivo: number | null
  unidadeSelecionada: string | null
  unidadeHover: string | null
  setTorreAtiva: (t: TowerId | null) => void
  setAndarAtivo: (a: number | null) => void
  selecionarUnidade: (id: string | null) => void
  hoverUnidade: (id: string | null) => void

  // filtros
  filtros: Filtros
  setFiltros: (f: Partial<Filtros>) => void
  limparFiltros: () => void

  // foco secundário, compartilhado entre a ficha, os visualizadores e o 3D
  ambienteAtivo: string | null
  amenidadeAtiva: string | null
  setAmbienteAtivo: (id: string | null) => void
  setAmenidadeAtiva: (id: string | null) => void

  // ui
  drawerAberto: boolean
  stackAberto: boolean
  qualidade: 'alta' | 'media'
  setQualidade: (q: 'alta' | 'media') => void
  setStackAberto: (v: boolean) => void
}

export const useTour = create<TourState>((set) => ({
  hora: 12,
  mes: 6,
  preset: 'meiodia',
  presetExato: true,
  setHora: (hora) => set({ hora, preset: presetDaHora(hora), presetExato: false }),
  setMes: (mes) => set({ mes }),
  setPreset: (preset) => set({ preset, hora: HORA_DO_PRESET[preset], presetExato: true }),

  modo: 'orbita',
  setModo: (modo) => set({ modo }),

  torreAtiva: null,
  andarAtivo: null,
  unidadeSelecionada: null,
  unidadeHover: null,
  setTorreAtiva: (torreAtiva) => set({ torreAtiva }),
  setAndarAtivo: (andarAtivo) => set({ andarAtivo }),
  selecionarUnidade: (id) =>
    set((s) => {
      if (!id)
        return {
          unidadeSelecionada: null,
          drawerAberto: false,
          modo: s.modo === 'vista' ? 'orbita' : s.modo,
        }
      const u = UNIDADES.find((x) => x.id === id)
      return {
        unidadeSelecionada: id,
        drawerAberto: true,
        // Trocar de unidade DENTRO da vista mantém a vista: "e do 15º?" é
        // pergunta de reunião, e responder exige pular de varanda em varanda
        // sem sair e voltar. Os outros modos de tela cheia voltam para a ficha.
        modo: s.modo === 'vista' ? 'vista' : 'unidade',
        torreAtiva: u?.torre ?? s.torreAtiva,
        andarAtivo: u?.andar ?? s.andarAtivo,
        ambienteAtivo: id === s.unidadeSelecionada ? s.ambienteAtivo : null,
        amenidadeAtiva: id === s.unidadeSelecionada ? s.amenidadeAtiva : null,
      }
    }),
  hoverUnidade: (unidadeHover) => set({ unidadeHover }),

  filtros: FILTROS_VAZIOS,
  setFiltros: (f) => set((s) => ({ filtros: { ...s.filtros, ...f } })),
  limparFiltros: () => set({ filtros: FILTROS_VAZIOS }),

  ambienteAtivo: null,
  amenidadeAtiva: null,
  setAmbienteAtivo: (ambienteAtivo) => set({ ambienteAtivo }),
  setAmenidadeAtiva: (amenidadeAtiva) => set({ amenidadeAtiva }),

  drawerAberto: false,
  stackAberto: true,
  qualidade: 'alta',
  setQualidade: (qualidade) => set({ qualidade }),
  setStackAberto: (stackAberto) => set({ stackAberto }),
}))

/** Passa nos filtros ativos. Filtro vazio não restringe. */
export function passaNosFiltros(u: Unidade, f: Filtros): boolean {
  if (f.tipologias.length && !f.tipologias.includes(u.tipologiaId)) return false
  if (f.status.length && !f.status.includes(u.status)) return false
  if (f.orientacoes.length && !f.orientacoes.includes(u.orientacao)) return false
  if (u.andar < f.andarMin) return false
  if (f.precoMax !== null && u.preco > f.precoMax) return false
  return true
}

export const unidadeAtual = (): Unidade | null => {
  const id = useTour.getState().unidadeSelecionada
  return id ? (UNIDADES.find((u) => u.id === id) ?? null) : null
}
