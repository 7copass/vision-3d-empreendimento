/**
 * Chrome completo: overlay de vidro sobre a cena 3D.
 *
 * O container é `absolute inset-0 z-30 pointer-events-none`; cada painel
 * reativa `pointer-events-auto` no próprio root. Os vãos entre os painéis
 * continuam entregando o mouse para o 3D, então arrastar/orbitar segue
 * funcionando em qualquer área vazia.
 */
import { useEffect } from 'react'
import clsx from 'clsx'
import { useTour } from '../core/store'
import { BarraSuperior } from './BarraSuperior'
import { MarcaDoEmpreendimento } from './MarcaDoEmpreendimento'
import { PainelFiltros } from './PainelFiltros'
import { SeletorDeEmpreendimento } from '../viewers'
import { PainelPavimentos } from './PainelPavimentos'
import { ControleSolar } from './ControleSolar'
import { FichaUnidade } from './FichaUnidade'
import { ResumoDaVista } from './ResumoDaVista'
import { Legenda } from './Legenda'

/**
 * Esc fecha o drawer, apaga a amenidade destacada e devolve a tela para a
 * órbita. A amenidade sobrevive ao fechar a ficha — o corretor acende a
 * piscina e tira o drawer da frente para falar dela — então ela entra na
 * guarda: sem isso, Esc seria inerte justamente nesse caso (drawer fechado,
 * modo já em 'orbita') e o destaque ficaria aceso para sempre.
 */
function useEscape() {
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)
  const setModo = useTour((s) => s.setModo)
  const setAmenidadeAtiva = useTour((s) => s.setAmenidadeAtiva)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const { drawerAberto, modo, amenidadeAtiva } = useTour.getState()
      if (!drawerAberto && modo === 'orbita' && amenidadeAtiva === null) return
      e.preventDefault()
      selecionarUnidade(null)
      setAmenidadeAtiva(null)
      setModo('orbita')
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [selecionarUnidade, setAmenidadeAtiva, setModo])
}

export function Chrome({ className }: { className?: string }) {
  useEscape()

  return (
    <div className={clsx('pointer-events-none absolute inset-0 z-30', className)}>
      {/* Fileira central de chips. As laterais só são reservadas quando a
          tela é larga o bastante para marca e painel conviverem com ela. */}
      <div className="absolute inset-x-0 top-0 flex justify-center px-3 pt-3 min-[1340px]:px-[272px]">
        <BarraSuperior />
      </div>

      {/* Coluna esquerda: marca, filtros e o controle de sol, do topo ao
          rodapé. É uma caixa flex de altura limitada (`top`→`bottom-3`), e só
          o `PainelFiltros` encolhe — `marca` e `sol` são `shrink-0`. Assim os
          três nunca se sobrepõem em nenhuma altura de tela: em 768px tudo
          cabe inteiro, e em telas mais baixas o corpo dos filtros rola.
          Abaixo de 1340px a coluna desce para não disputar com a barra. */}
      <div className="absolute top-16 bottom-3 left-3 flex w-[250px] max-w-[calc(100vw-1.5rem)] flex-col gap-2.5 min-[1340px]:top-3">
        <MarcaDoEmpreendimento className="shrink-0" />
        {/* Subordinado ao nome, não concorrente: o corretor troca de
            empreendimento no meio da call e precisa dele sempre à vista. */}
        <SeletorDeEmpreendimento className="shrink-0" />
        <PainelFiltros className="hidden md:flex" />
        {/* Em paisagem de celular (altura ínfima) o sol sai de cena em vez
            de empurrar a marca para fora da tela. */}
        <ControleSolar className="mt-auto shrink-0 [@media(max-height:520px)]:hidden" />
      </div>

      {/* Coluna direita: a etiqueta da vista, o espelho de vendas e a legenda,
          pela mesma regra da esquerda — caixa flex limitada, só o painel
          encolhe. No modo 'vista' a etiqueta entra acima do espelho em vez de
          flutuar sobre ele: clicar numa pastilha ali pula de varanda em
          varanda, então o espelho precisa ficar inteiro e clicável. */}
      <div className="absolute top-16 right-3 bottom-3 flex w-[228px] flex-col items-end gap-2.5 min-[1340px]:top-3">
        <ResumoDaVista className="hidden sm:block" />
        <PainelPavimentos className="hidden sm:flex" />
        <Legenda className="mt-auto hidden shrink-0 sm:flex" />
      </div>

      {/* Drawer da unidade, acima de tudo. */}
      <FichaUnidade />
    </div>
  )
}
