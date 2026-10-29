/**
 * Qual empreendimento esta sessão está mostrando.
 *
 * A escolha é fixa por carregamento de página: `?e=flat-premium-ii`. Isso
 * permite que `core/world` e `data/*` sejam fachadas de valor, e não de
 * módulo — as cinco frentes continuam importando os mesmos nomes de sempre,
 * sem saber que existe mais de um empreendimento.
 *
 * Aqui entram APENAS módulos de dados. A geometria é componente, lê o estado
 * compartilhado, e o estado lê o estoque que sai daqui: importá-la neste
 * arquivo fecharia um ciclo e o módulo subiria pela metade.
 * Quem escolhe a geometria é `core/Geometria.tsx`.
 */
import * as voWorld from '../empreendimentos/village-one/world'
import * as voProject from '../empreendimentos/village-one/project'
import * as voInventory from '../empreendimentos/village-one/inventory'
import * as fpWorld from '../empreendimentos/flat-premium-ii/world'
import * as fpProject from '../empreendimentos/flat-premium-ii/project'
import * as fpInventory from '../empreendimentos/flat-premium-ii/inventory'

export type EmpreendimentoId = 'village-one' | 'flat-premium-ii'

const EMPREENDIMENTOS = {
  'village-one': { world: voWorld, project: voProject, inventory: voInventory },
  'flat-premium-ii': { world: fpWorld, project: fpProject, inventory: fpInventory },
} as const

export const CATALOGO: { id: EmpreendimentoId; nome: string; cidade: string }[] = [
  { id: 'village-one', nome: 'Village One', cidade: 'Santarém / PA' },
  { id: 'flat-premium-ii', nome: 'Flat Premium II', cidade: 'Santarém / PA' },
]

function escolher(): EmpreendimentoId {
  if (typeof window === 'undefined') return 'village-one'
  const pedido = new URLSearchParams(window.location.search).get('e')
  return pedido === 'flat-premium-ii' ? 'flat-premium-ii' : 'village-one'
}

export const ID_ATIVO: EmpreendimentoId = escolher()
export const ATIVO = EMPREENDIMENTOS[ID_ATIVO]

/** Troca de empreendimento recarregando a página: o mundo inteiro muda. */
export function abrirEmpreendimento(id: EmpreendimentoId): void {
  const url = new URL(window.location.href)
  if (id === 'village-one') url.searchParams.delete('e')
  else url.searchParams.set('e', id)
  window.location.assign(url.toString())
}
