/**
 * Seletor de empreendimento.
 *
 * Quem usa é o corretor que atende clientes de empreendimentos diferentes no
 * mesmo dia e às vezes troca no meio da call — então a troca tem de estar a um
 * clique de distância e sempre visível, sem nunca disputar a atenção com o nome
 * do empreendimento nem ocupar o espelho de vendas.
 *
 * Daí o desenho: uma pastilha de vidro rasa, do mesmo material do chrome, feita
 * para viver logo abaixo de <MarcaDoEmpreendimento /> na coluna esquerda. Ela
 * fica subordinada ao nome em vez de competir com ele (rótulo minúsculo em
 * caixa alta, nome em corpo de legenda), e a lista abre para baixo, por cima do
 * painel de filtros — que é o painel que já encolhe nessa coluna.
 *
 * Não se posiciona sozinha: é um bloco de fluxo que preenche a largura do
 * contêiner. Montável em qualquer coluna do chrome, não só na esquerda.
 *
 * Trocar recarrega a página (`abrirEmpreendimento`), porque o mundo inteiro
 * muda; o aviso em corpo miúdo existe para que isso não pareça um travamento.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { CATALOGO, ID_ATIVO, abrirEmpreendimento } from '../core/ativo'
import { IconeCaretBaixo, IconeEmpreendimentos } from './shared/icones'
import { SUAVE } from './shared/Moldura'

export interface SeletorDeEmpreendimentoProps {
  className?: string
}

export function SeletorDeEmpreendimento({ className }: SeletorDeEmpreendimentoProps) {
  const [aberto, setAberto] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const fecharEDevolverFoco = useCallback(() => {
    setAberto(false)
    gatilhoRef.current?.focus()
  }, [])

  // Clique fora fecha. `pointerdown` e não `click`: o corretor que clica no 3D
  // para girar o prédio já começou a arrastar quando o `click` chegaria.
  useEffect(() => {
    if (!aberto) return
    const aoApontar = (e: PointerEvent) => {
      if (!raizRef.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto])

  // O foco entra na lista no item aberto, para que teclado e mouse cheguem ao
  // mesmo lugar.
  useEffect(() => {
    if (!aberto) return
    listaRef.current?.querySelector<HTMLButtonElement>('[data-atual="true"]')?.focus()
  }, [aberto])

  /**
   * Esc aqui só fecha a lista, e para de subir: o Esc global do chrome (que
   * limpa a seleção e volta para a órbita) e o dos visualizadores continuam
   * valendo quando a lista está fechada.
   */
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (!aberto) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      fecharEDevolverFoco()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const itens = Array.from(
      listaRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    )
    if (!itens.length) return
    e.preventDefault()
    e.stopPropagation()
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement)
    const passo = e.key === 'ArrowDown' ? 1 : -1
    itens[(Math.max(0, atual) + passo + itens.length) % itens.length].focus()
  }

  // Um empreendimento só: nada a escolher, e a pastilha seria ruído.
  if (CATALOGO.length < 2) return null

  const ativo = CATALOGO.find((e) => e.id === ID_ATIVO) ?? CATALOGO[0]

  return (
    <div
      ref={raizRef}
      onKeyDown={aoTeclar}
      className={clsx('pointer-events-auto relative z-20', className)}
    >
      <button
        ref={gatilhoRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        title="Trocar de empreendimento"
        onClick={() => setAberto((v) => !v)}
        className={clsx(
          'vidro flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left',
          'shadow-2xl shadow-black/40 transition-colors duration-200',
          'hover:border-areia-200/30 hover:bg-white/4',
        )}
      >
        <IconeEmpreendimentos width={17} height={17} className="shrink-0 text-areia-200/45" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] leading-none tracking-[0.22em] text-areia-200/45 uppercase">
            Empreendimento
          </span>
          <span className="mt-1 block truncate text-[13px] leading-none text-areia-50">
            {ativo.nome}
          </span>
        </span>
        <IconeCaretBaixo
          width={16}
          height={16}
          className={clsx(
            'shrink-0 text-areia-200/45 transition-transform duration-200',
            aberto && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            ref={listaRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SUAVE}
            className={clsx(
              'vidro absolute top-[calc(100%+6px)] left-0 w-full min-w-[216px] rounded-2xl p-1.5',
              'shadow-2xl shadow-black/60',
            )}
          >
            <div role="menu" aria-label="Empreendimentos">
              {CATALOGO.map((e) => {
                const atual = e.id === ID_ATIVO
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="menuitem"
                    data-atual={atual}
                    title={atual ? `${e.nome} — já aberto` : `Abrir ${e.nome}`}
                    onClick={() => (atual ? fecharEDevolverFoco() : abrirEmpreendimento(e.id))}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left',
                      'transition-colors duration-150',
                      atual ? 'bg-areia-100/10' : 'hover:bg-white/6',
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        'size-1.5 shrink-0 rounded-full',
                        atual ? 'bg-rio-300' : 'bg-areia-200/25',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-display block truncate text-[17px] leading-tight text-areia-50">
                        {e.nome}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] tracking-[0.14em] text-areia-200/50 uppercase">
                        {e.cidade}
                      </span>
                    </span>
                    {atual && (
                      <span className="shrink-0 text-[9px] tracking-[0.18em] text-rio-300 uppercase">
                        Aberto
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="mt-1 border-t border-areia-200/10 px-2.5 pt-2 pb-1 text-[10px] leading-snug text-areia-200/40">
              Trocar recarrega o tour.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
