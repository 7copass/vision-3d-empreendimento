/** Fachada dos dados comerciais do empreendimento ativo. */
import type { Amenidade, Empreendimento, PontoUrbano, Tipologia } from '../core/types'
import { ATIVO } from '../core/ativo'

const p = ATIVO.project

export const EMPREENDIMENTO: Empreendimento = p.EMPREENDIMENTO
export const AMENIDADES: Amenidade[] = p.AMENIDADES
export const PONTOS_URBANOS: PontoUrbano[] = p.PONTOS_URBANOS
export const TIPOLOGIAS: Tipologia[] = p.TIPOLOGIAS
export const tipologiaById = (id: string): Tipologia => p.tipologiaById(id)
