import { useCallback, useEffect, useRef } from 'react'
import { useTour } from '../../core/store'

/**
 * Fechamento canônico de qualquer visualizador: volta para a ficha da unidade
 * selecionada, ou para a órbita quando não há seleção.
 */
export function useFechar(onFechar?: () => void): () => void {
  const setModo = useTour((s) => s.setModo)
  const unidadeSelecionada = useTour((s) => s.unidadeSelecionada)

  return useCallback(() => {
    if (onFechar) {
      onFechar()
      return
    }
    setModo(unidadeSelecionada ? 'unidade' : 'orbita')
  }, [onFechar, setModo, unidadeSelecionada])
}

export type MapaDeTeclas = Record<string, (e: KeyboardEvent) => void>

/**
 * Atalhos de teclado em window, com o mapa sempre lido da última renderização
 * (evita reassinar o listener a cada mudança de estado).
 */
export function useTeclas(mapa: MapaDeTeclas, ativo = true): void {
  const ref = useRef(mapa)
  ref.current = mapa

  useEffect(() => {
    if (!ativo) return
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return
      const fn = ref.current[e.key]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ativo])
}
