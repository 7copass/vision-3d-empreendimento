/**
 * Status, orientação, andar mínimo e teto de preço. Escreve em setFiltros.
 *
 * O card é uma coluna flex: cabeçalho fixo e corpo com rolagem própria. Em
 * telas baixas o `<Chrome />` encolhe este card (é o único encolhível da
 * coluna esquerda) e o corpo rola, em vez de o painel invadir o controle solar.
 */
import { useMemo } from 'react'
import clsx from 'clsx'
import { passaNosFiltros, useTour } from '../core/store'
import { UNIDADES } from '../data/inventory'
import { ANDARES } from '../core/world'
import type { Orientacao, UnitStatus } from '../core/types'
import { moedaCurta } from './formato'
import { Chip, Rotulo } from './primitivos'
import {
  CLASSE_SLIDER,
  ORIENTACAO_ORDEM,
  ROTULO_ORIENTACAO,
  ROTULO_STATUS,
  STATUS_ORDEM,
} from './tokens'

const FAIXA_PRECO = (() => {
  const precos = UNIDADES.map((u) => u.preco)
  const passo = 10_000
  return {
    min: Math.floor(Math.min(...precos) / passo) * passo,
    max: Math.ceil(Math.max(...precos) / passo) * passo,
    passo,
  }
})()

export function PainelFiltros({ className }: { className?: string }) {
  const filtros = useTour((s) => s.filtros)
  const setFiltros = useTour((s) => s.setFiltros)
  const limparFiltros = useTour((s) => s.limparFiltros)

  const quantas = useMemo(
    () => UNIDADES.filter((u) => passaNosFiltros(u, filtros)).length,
    [filtros],
  )

  const alterado =
    filtros.tipologias.length > 0 ||
    filtros.status.length > 0 ||
    filtros.orientacoes.length > 0 ||
    filtros.andarMin > 1 ||
    filtros.precoMax !== null

  const alternarStatus = (s: UnitStatus) =>
    setFiltros({
      status: filtros.status.includes(s)
        ? filtros.status.filter((x) => x !== s)
        : [...filtros.status, s],
    })

  const alternarOrientacao = (o: Orientacao) =>
    setFiltros({
      orientacoes: filtros.orientacoes.includes(o)
        ? filtros.orientacoes.filter((x) => x !== o)
        : [...filtros.orientacoes, o],
    })

  const precoMax = filtros.precoMax ?? FAIXA_PRECO.max

  return (
    <section
      aria-label="Filtros de unidades"
      className={clsx(
        'vidro pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-2xl',
        'px-4 py-2.5 shadow-2xl shadow-black/40',
        className,
      )}
    >
      <div className="shrink-0">
        <div className="flex items-baseline justify-between gap-2">
          <Rotulo>Filtrar estoque</Rotulo>
          <button
            type="button"
            onClick={limparFiltros}
            disabled={!alterado}
            className={clsx(
              'text-[11px] underline decoration-areia-200/30 underline-offset-2 transition-colors',
              alterado
                ? 'text-areia-200/75 hover:text-areia-50'
                : 'cursor-default text-areia-200/20',
            )}
          >
            limpar
          </button>
        </div>
        <p className="mt-1 text-[12px] text-areia-100/75">
          <strong className="font-medium tabular-nums text-areia-50">{quantas}</strong>
          <span className="text-areia-200/55">
            {quantas === 1 ? ' unidade no filtro' : ' unidades no filtro'}
          </span>
        </p>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto [scrollbar-width:thin]">
        <div>
          <Rotulo className="text-areia-200/35">Status</Rotulo>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {STATUS_ORDEM.map((s) => (
              <Chip
                key={s}
                ativo={filtros.status.includes(s)}
                onClick={() => alternarStatus(s)}
                className="px-2.5 text-[11.5px]"
              >
                {ROTULO_STATUS[s]}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Rotulo className="text-areia-200/35">Orientação</Rotulo>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {ORIENTACAO_ORDEM.map((o) => (
              <Chip
                key={o}
                ativo={filtros.orientacoes.includes(o)}
                onClick={() => alternarOrientacao(o)}
                className="px-2.5 text-[11.5px]"
              >
                {ROTULO_ORIENTACAO[o]}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Rotulo className="text-areia-200/35">Andar mínimo</Rotulo>
            <span className="text-[12px] tabular-nums text-areia-50">{filtros.andarMin}º</span>
          </div>
          <input
            type="range"
            min={1}
            max={ANDARES}
            step={1}
            value={filtros.andarMin}
            onChange={(e) => setFiltros({ andarMin: Number(e.target.value) })}
            aria-label="Andar mínimo"
            className={clsx('mt-1.5', CLASSE_SLIDER)}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Rotulo className="text-areia-200/35">Até</Rotulo>
            <span className="text-[12px] tabular-nums text-areia-50">
              {filtros.precoMax === null ? 'sem teto' : moedaCurta(filtros.precoMax)}
            </span>
          </div>
          <input
            type="range"
            min={FAIXA_PRECO.min}
            max={FAIXA_PRECO.max}
            step={FAIXA_PRECO.passo}
            value={precoMax}
            onChange={(e) => {
              const v = Number(e.target.value)
              setFiltros({ precoMax: v >= FAIXA_PRECO.max ? null : v })
            }}
            aria-label="Teto de preço"
            className={clsx('mt-1.5', CLASSE_SLIDER)}
          />
        </div>
      </div>
    </section>
  )
}
