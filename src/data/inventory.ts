/** Fachada do estoque do empreendimento ativo. */
import type { TowerId, Unidade } from '../core/types'
import { ATIVO } from '../core/ativo'

const i = ATIVO.inventory

export const UNIDADES: Unidade[] = i.UNIDADES
export const unidadeById = (id: string): Unidade | undefined => i.unidadeById(id)
export const unidadesDaTorre = (t: TowerId): Unidade[] => i.unidadesDaTorre(t)
export const unidadesDoPavimento = (t: TowerId, andar: number): Unidade[] =>
  i.unidadesDoPavimento(t, andar)
export const resumoEstoque = () => i.resumoEstoque()
