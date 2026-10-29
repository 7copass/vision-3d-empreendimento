import { useMemo } from 'react'
import { useTour } from '../../core/store'
import { unidadeById } from '../../data/inventory'
import { TIPOLOGIAS, tipologiaById } from '../../data/project'
import type { Tipologia, Unidade } from '../../core/types'

/**
 * Tipologia em foco. Sem unidade selecionada (ou com `tipologiaId` explícito
 * inexistente), cai na primeira tipologia em vez de quebrar.
 */
export function useTipologiaAtiva(tipologiaId?: string): {
  tipologia: Tipologia
  unidade: Unidade | null
} {
  const unidadeSelecionada = useTour((s) => s.unidadeSelecionada)

  return useMemo(() => {
    const unidade = unidadeSelecionada ? (unidadeById(unidadeSelecionada) ?? null) : null
    if (tipologiaId) {
      const achada = TIPOLOGIAS.find((t) => t.id === tipologiaId)
      if (achada) return { tipologia: achada, unidade }
    }
    const tipologia = unidade ? tipologiaById(unidade.tipologiaId) : TIPOLOGIAS[0]
    return { tipologia, unidade }
  }, [tipologiaId, unidadeSelecionada])
}
