/**
 * Registro dos desenhos SVG. A chave é o campo `desenho` de cada Planta em
 * TIPOLOGIAS; as dimensões já incluem as margens de cota, para o "ajustar à tela".
 */
import type { ComponentType } from 'react'
import type { PlantaDef } from './PlantaBase'
import { PlantaTipo1, defTipo1 } from './Tipo1'
import { PlantaTipo1Setores, defTipo1Setores } from './Tipo1Setores'
import { PlantaTipo2, defTipo2 } from './Tipo2'
import { PlantaCoberturaInferior, defCoberturaInferior } from './CoberturaInferior'
import { PlantaCoberturaSuperior, defCoberturaSuperior } from './CoberturaSuperior'

export interface DesenhoSpec {
  id: string
  /** Largura total da folha, em cm. */
  largura: number
  /** Altura total da folha, em cm. */
  altura: number
  Componente: ComponentType
}

const folha = (def: PlantaDef, Componente: ComponentType): DesenhoSpec => ({
  id: def.id,
  largura: def.largura + def.margem.esq + def.margem.dir,
  altura: def.altura + def.margem.topo + def.margem.base,
  Componente,
})

export const DESENHOS: Record<string, DesenhoSpec> = {
  'tipo-1': folha(defTipo1, PlantaTipo1),
  'tipo-1-setores': folha(defTipo1Setores, PlantaTipo1Setores),
  'tipo-2': folha(defTipo2, PlantaTipo2),
  'cobertura-inferior': folha(defCoberturaInferior, PlantaCoberturaInferior),
  'cobertura-superior': folha(defCoberturaSuperior, PlantaCoberturaSuperior),
}

/** Desenho por id, com queda para a planta do Tipo 1 quando o id é desconhecido. */
export const desenhoById = (id: string): DesenhoSpec => DESENHOS[id] ?? DESENHOS['tipo-1']
