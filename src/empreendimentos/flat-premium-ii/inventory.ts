/**
 * Estoque transcrito do quadro comercial recebido em 29/10/2026.
 *
 * Seis unidades disponíveis com preço e parcelas informados. Os pavimentos 4
 * e 5 chegaram sem situação comercial — ficam como indisponíveis até
 * confirmação, e a interface não inventa preço para eles.
 */
import type { Unidade } from '../../core/types'
import { AMENIDADES } from './project'
import { PAVIMENTOS, POSICOES, ORIENTACAO_POSICAO, centroDaUnidade } from './world'

/** Valores transcritos. Não são simulação nem recálculo. */
const QUADRO: Record<string, { preco: number; parcelas: number[] }> = {
  '304': { preco: 218000, parcelas: [18166.67, 15722.98, 13294.09, 10262.02] },
  '308': { preco: 218000, parcelas: [18166.67, 15722.98, 13294.09, 10262.02] },
  '604': { preco: 227000, parcelas: [18916.67, 16372.1, 13842.92, 10685.68] },
  '606': { preco: 227000, parcelas: [18916.67, 16372.1, 13842.92, 10685.68] },
  '706': { preco: 229000, parcelas: [19083.33, 16516.35, 13964.89, 10779.83] },
  '708': { preco: 229000, parcelas: [19083.33, 16516.35, 13964.89, 10779.83] },
}

const MESES = [12, 15, 18, 24]
/** Pavimentos sem situação comercial no material recebido. */
const SEM_DADOS = [4, 5]

const VISTAS: Record<string, string> = {
  norte: 'Face do rio',
  sul: 'Face da rua',
  leste: 'Nascente',
  oeste: 'Poente',
}

function distanciasDe(centro: [number, number, number]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const a of AMENIDADES) {
    const dx = centro[0] - a.posicao[0]
    const dy = centro[1] - a.posicao[1]
    const dz = centro[2] - a.posicao[2]
    out[a.id] = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz))
  }
  return out
}

function montar(): Unidade[] {
  const lista: Unidade[] = []
  for (const andar of PAVIMENTOS) {
    for (const posicao of POSICOES) {
      const numero = `${andar}${String(posicao).padStart(2, '0')}`
      const oferta = QUADRO[numero]
      const semDados = SEM_DADOS.includes(andar)
      const orientacao = ORIENTACAO_POSICAO[posicao]
      const centro = centroDaUnidade('A', andar, posicao)
      lista.push({
        id: `A-${numero}`,
        torre: 'A',
        andar,
        posicao,
        numero,
        tipologiaId: 'flat',
        status: oferta ? 'disponivel' : semDados ? 'reservada' : 'vendida',
        preco: oferta?.preco ?? 0,
        orientacao,
        vista: VISTAS[orientacao] ?? 'Entorno',
        distancias: distanciasDe(centro),
        parcelas: oferta
          ? oferta.parcelas.map((valor, i) => ({
              meses: MESES[i],
              valor,
              juros: i === 0 ? 'Condição não informada' : '1% a.m.',
              jurosMes: i === 0 ? undefined : 0.01,
            }))
          : undefined,
      })
    }
  }
  return lista
}

export const UNIDADES: Unidade[] = montar()

export const unidadeById = (id: string): Unidade | undefined => UNIDADES.find((u) => u.id === id)

export const unidadesDaTorre = (): Unidade[] => UNIDADES

export const unidadesDoPavimento = (_t: string, andar: number): Unidade[] =>
  UNIDADES.filter((u) => u.andar === andar)

export const resumoEstoque = () => {
  const total = UNIDADES.length
  const disponivel = UNIDADES.filter((u) => u.status === 'disponivel').length
  const reservada = UNIDADES.filter((u) => u.status === 'reservada').length
  return { total, disponivel, reservada, vendida: total - disponivel - reservada }
}
