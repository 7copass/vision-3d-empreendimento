/**
 * A geometria do empreendimento ativo.
 *
 * Fica separada de `ativo.ts` de propósito: os componentes de cena leem o
 * estado compartilhado, que por sua vez lê o estoque vindo de `ativo.ts`.
 * Importar componente lá dentro fecharia o ciclo.
 */
import { Complexo as VillageOne } from '../scene/building'
import { Complexo as FlatPremiumII } from '../empreendimentos/flat-premium-ii/cena/Complexo'
import { ID_ATIVO } from './ativo'

export function Geometria() {
  return ID_ATIVO === 'flat-premium-ii' ? <FlatPremiumII /> : <VillageOne />
}
