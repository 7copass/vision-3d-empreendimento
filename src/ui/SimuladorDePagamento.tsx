/**
 * Condições de pagamento na ficha da unidade — duas naturezas, nunca misturadas.
 *
 * 1. A unidade TEM `unidade.parcelas`: são condições transcritas do quadro
 *    comercial do vendedor. Aparecem como vieram, com o juros informado em cada
 *    plano. Nada é recalculado, corrigido ou completado aqui.
 * 2. A unidade NÃO tem `parcelas`: não existe condição informada, então o
 *    corretor opera uma simulação (entrada, prazo e taxa), sempre rotulada como
 *    simulação em tela.
 *
 * Em nenhum dos dois casos a interface inventa índice de correção, taxa de obra
 * ou condição de financiamento bancário: isso não existe nos dados.
 */
import { useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import type { Unidade } from '../core/types'
import { EMPREENDIMENTO } from '../data/project'
import { moeda } from './formato'
import { Chip, Linha, Rotulo } from './primitivos'
import { CLASSE_SLIDER } from './tokens'

const ABRIR = { duration: 0.2, ease: 'easeOut' } as const
const RAPIDO = { duration: 0.15, ease: 'easeOut' } as const

/** R$ 18.166,67 — parcela vem com centavos; `moeda` arredonda para inteiro. */
const MOEDA_CENTAVOS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const moedaExata = (v: number): string => MOEDA_CENTAVOS.format(v)

const PERCENTUAL = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
})
/** 32,1% — recebe 32.1, não 0,321. */
const percentual = (v: number): string => PERCENTUAL.format(v / 100)

const TAXA = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Simulação: limites do que o corretor pode mover. Não são regra comercial. */
const ENTRADA_MAX_PCT = 90
const PRAZO_MIN = 6
const PRAZO_MAX = 60
const TAXA_MAX = 5
const PADRAO = { entradaPct: 20, meses: 24, taxa: 1 }

const limitar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

/**
 * Lê número digitado em pt-BR: "70.000" → 70000, "1,5" → 1,5. Aceita ponto
 * decimal quando não há grupo de milhar ("0.5" → 0,5), porque o corretor digita
 * rápido durante a call.
 */
function numeroPtBr(texto: string): number | null {
  const limpo = texto.replace(/[^\d.,]/g, '')
  if (!limpo) return null
  const normal = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo.replace(/\.(?=\d{3}(?:\D|$))/g, '')
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

/** Parcela constante (Price) sobre o saldo, no prazo e na taxa informados. */
function parcelaPrice(saldo: number, meses: number, taxaMes: number): number {
  if (meses <= 0 || saldo <= 0) return 0
  if (taxaMes <= 0) return saldo / meses
  const i = taxaMes / 100
  return (saldo * i) / (1 - Math.pow(1 + i, -meses))
}

/** Campo numérico com rascunho: aplica no Enter ou ao sair, descarta no Esc. */
function CampoNumero({
  rotuloAria,
  valorTexto,
  aoAplicar,
  sufixo,
  className,
}: {
  rotuloAria: string
  valorTexto: string
  aoAplicar: (texto: string) => void
  sufixo?: string
  className?: string
}) {
  const [rascunho, setRascunho] = useState<string | null>(null)
  const pendente = useRef<string | null>(null)

  const definir = (v: string | null) => {
    pendente.current = v
    setRascunho(v)
  }

  return (
    <span className="flex items-baseline gap-1">
      <input
        type="text"
        inputMode="decimal"
        aria-label={rotuloAria}
        value={rascunho ?? valorTexto}
        onFocus={(e) => {
          definir(valorTexto)
          e.currentTarget.select()
        }}
        onChange={(e) => definir(e.target.value)}
        onBlur={() => {
          const texto = pendente.current
          definir(null)
          if (texto !== null) aoAplicar(texto)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            definir(null)
            e.currentTarget.blur()
          }
        }}
        className={clsx(
          'rounded-[5px] border border-areia-200/18 bg-white/5 px-1.5 py-0.5',
          'text-right text-[12px] tabular-nums text-areia-50 outline-none',
          'transition-colors duration-150 focus:border-areia-200/45 focus:bg-white/8',
          className,
        )}
      />
      {sufixo ? <span className="text-[11px] text-areia-200/45">{sufixo}</span> : null}
    </span>
  )
}

/** Caso 1: planos transcritos. Só leitura — a soma é a multiplicação à vista. */
function Transcritas({ unidade }: { unidade: Unidade }) {
  // `jurosMes` só ordena e distingue o plano sem juros informado; o que a tela
  // mostra é sempre o texto `juros`, como veio no quadro.
  const planos = useMemo(
    () =>
      [...(unidade.parcelas ?? [])].sort(
        (a, b) =>
          a.meses - b.meses ||
          (a.jurosMes ?? Number.POSITIVE_INFINITY) - (b.jurosMes ?? Number.POSITIVE_INFINITY),
      ),
    [unidade.parcelas],
  )
  const [aberta, setAberta] = useState<number | null>(null)
  const plano = planos.find((p) => p.meses === aberta)
  const fonte = EMPREENDIMENTO.fonteDoQuadro

  return (
    <div>
      <p className="mt-1.5 text-[11px] leading-snug text-areia-200/50">
        {fonte
          ? `${fonte.descricao}, recebido em ${fonte.recebidoEm}.`
          : 'Transcrito do quadro comercial do vendedor, como veio.'}{' '}
        A interface não recalcula nem corrige nenhum destes valores.
      </p>

      <div className="mt-2">
        {planos.map((p) => (
          <Linha
            key={p.meses}
            rotulo={`${p.meses} meses`}
            valor={moedaExata(p.valor)}
            sufixo={
              <span className={p.jurosMes === undefined ? 'text-areia-200/30 italic' : undefined}>
                {p.juros}
              </span>
            }
            ativo={aberta === p.meses}
            titulo={
              p.jurosMes === undefined
                ? `O quadro não informa juros para o plano de ${p.meses} meses`
                : `Juros no quadro: ${p.juros}`
            }
            onClick={() => setAberta(aberta === p.meses ? null : p.meses)}
          />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {plano ? (
          <motion.p
            key={plano.meses}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={RAPIDO}
            className="overflow-hidden text-[11px] tabular-nums text-areia-200/55"
          >
            <span className="block pt-1.5">
              {plano.meses} × {moedaExata(plano.valor)} ={' '}
              <span className="text-areia-100/85">{moedaExata(plano.meses * plano.valor)}</span>
            </span>
          </motion.p>
        ) : null}
      </AnimatePresence>

      <p className="mt-2 text-[10.5px] leading-snug text-areia-200/35">
        O quadro recebido não informa entrada, índice de correção nem condição de financiamento
        bancário — por isso nada disso aparece aqui.
      </p>
    </div>
  )
}

/** Caso 2: nada informado. O corretor simula, e a tela diz que é simulação. */
function Simulacao({ unidade }: { unidade: Unidade }) {
  const [entradaPct, setEntradaPct] = useState(PADRAO.entradaPct)
  const [meses, setMeses] = useState(PADRAO.meses)
  const [taxa, setTaxa] = useState(PADRAO.taxa)
  const [emReais, setEmReais] = useState(false)

  const conta = useMemo(() => {
    const entrada = (unidade.preco * entradaPct) / 100
    const saldo = unidade.preco - entrada
    const parcela = parcelaPrice(saldo, meses, taxa)
    const total = entrada + parcela * meses
    return { entrada, saldo, parcela, total, acrescimo: total - unidade.preco }
  }, [unidade.preco, entradaPct, meses, taxa])

  const aplicarEntrada = (texto: string) => {
    const n = numeroPtBr(texto)
    if (n === null) return
    const comoPercentual = texto.includes('%') || (!emReais && n <= 100)
    if (comoPercentual) setEntradaPct(limitar(n, 0, ENTRADA_MAX_PCT))
    else setEntradaPct(limitar((n / unidade.preco) * 100, 0, ENTRADA_MAX_PCT))
  }

  const entradaTexto = emReais ? moeda(conta.entrada) : percentual(entradaPct)

  return (
    <div>
      <p className="mt-1.5 text-[11px] leading-snug text-areia-200/50">
        Esta unidade não tem condições no material recebido. O que segue é uma simulação feita aqui
        por você, com a taxa que você define — não é proposta nem condição aprovada.
      </p>

      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <Rotulo className="text-areia-200/35">Entrada</Rotulo>
          <span className="flex items-baseline gap-1">
            <Chip
              ativo={!emReais}
              onClick={() => setEmReais(false)}
              titulo="Digitar a entrada em porcentagem"
              className="px-2 py-0.5 text-[11px]"
            >
              %
            </Chip>
            <Chip
              ativo={emReais}
              onClick={() => setEmReais(true)}
              titulo="Digitar a entrada em reais"
              className="px-2 py-0.5 text-[11px]"
            >
              R$
            </Chip>
            <CampoNumero
              rotuloAria="Entrada, em porcentagem ou em reais"
              valorTexto={entradaTexto}
              aoAplicar={aplicarEntrada}
              className="w-[92px]"
            />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={ENTRADA_MAX_PCT}
          step={1}
          value={Math.round(entradaPct)}
          onChange={(e) => setEntradaPct(Number(e.target.value))}
          aria-label="Entrada, em porcentagem do valor de tabela"
          className={clsx('mt-1.5', CLASSE_SLIDER)}
        />
        <p className="mt-1 text-[11px] tabular-nums text-areia-200/45">
          {emReais ? percentual(entradaPct) : moeda(conta.entrada)} do valor de tabela
        </p>
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <Rotulo className="text-areia-200/35">Prazo</Rotulo>
          <CampoNumero
            rotuloAria="Prazo, em meses"
            valorTexto={String(meses)}
            aoAplicar={(t) => {
              const n = numeroPtBr(t)
              if (n !== null) setMeses(Math.round(limitar(n, PRAZO_MIN, PRAZO_MAX)))
            }}
            sufixo="meses"
            className="w-[52px]"
          />
        </div>
        <input
          type="range"
          min={PRAZO_MIN}
          max={PRAZO_MAX}
          step={1}
          value={meses}
          onChange={(e) => setMeses(Number(e.target.value))}
          aria-label="Prazo, em meses"
          className={clsx('mt-1.5', CLASSE_SLIDER)}
        />
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <Rotulo className="text-areia-200/35">Juros</Rotulo>
        <CampoNumero
          rotuloAria="Juros ao mês, em porcentagem"
          valorTexto={TAXA.format(taxa)}
          aoAplicar={(t) => {
            const n = numeroPtBr(t)
            if (n !== null) setTaxa(limitar(n, 0, TAXA_MAX))
          }}
          sufixo="% a.m."
          className="w-[52px]"
        />
      </div>

      <div className="mt-3 rounded-lg bg-white/4 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] tracking-[0.1em] text-areia-200/45 uppercase">
            Parcela simulada
          </p>
          <p className="text-[10px] tabular-nums text-areia-200/40">
            {meses}× · {TAXA.format(taxa)}% a.m.
          </p>
        </div>
        <p className="font-display mt-1 text-[26px] leading-none tabular-nums text-areia-50">
          {moedaExata(conta.parcela)}
        </p>
        <div className="mt-2">
          <Linha rotulo="Entrada" valor={moeda(conta.entrada)} sufixo={percentual(entradaPct)} />
          <Linha rotulo="Saldo em parcelas" valor={moeda(conta.saldo)} />
          <Linha
            rotulo="Total simulado"
            valor={moeda(conta.total)}
            sufixo={
              conta.acrescimo > 1
                ? `+${percentual((conta.acrescimo / unidade.preco) * 100)}`
                : undefined
            }
          />
        </div>
      </div>

      <p className="mt-2 text-[10.5px] leading-snug text-areia-200/35">
        Parcela constante sobre o saldo, no prazo e na taxa acima. Sem índice de correção, taxa de
        obra ou financiamento bancário: isso não vem nos dados deste empreendimento.
      </p>
    </div>
  )
}

/**
 * Bloco recolhível de condições de pagamento. Abre por padrão quando a unidade
 * tem condições reais transcritas; fica recolhido quando é só simulação.
 */
export function SimuladorDePagamento({
  unidade,
  className,
}: {
  unidade: Unidade
  className?: string
}) {
  const transcritas = (unidade.parcelas ?? []).length > 0
  const [aberto, setAberto] = useState(transcritas)
  const idCorpo = useId()

  // Vendida não ganha parcelamento inventado, e sem preço não há o que simular.
  if (unidade.status === 'vendida' || unidade.preco <= 0) return null

  return (
    <section
      aria-label="Condições de pagamento"
      className={clsx('border-t border-areia-200/12 pt-4', className)}
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={idCorpo}
        className={clsx(
          '-mx-1.5 flex w-full items-center gap-2 rounded-[5px] px-1.5 py-0.5',
          'text-left transition-colors duration-150 hover:bg-white/6',
        )}
      >
        <Rotulo className="min-w-0 flex-1">Condições de pagamento</Rotulo>
        <span
          title={
            transcritas
              ? 'Valores transcritos do quadro comercial recebido'
              : 'Nenhuma condição informada: os números são simulados aqui'
          }
          className={clsx(
            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] whitespace-nowrap',
            transcritas
              ? 'border-rio-300/35 bg-rio-700/40 text-rio-300'
              : 'border-areia-200/20 text-areia-200/60',
          )}
        >
          {transcritas ? 'Quadro do vendedor' : 'Simulação'}
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: aberto ? 0 : -90 }}
          transition={RAPIDO}
          className="shrink-0 text-[11px] leading-none text-areia-200/45"
        >
          ⌄
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {aberto ? (
          <motion.div
            key="corpo"
            id={idCorpo}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={ABRIR}
            className="overflow-hidden"
          >
            {transcritas ? <Transcritas unidade={unidade} /> : <Simulacao unidade={unidade} />}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
