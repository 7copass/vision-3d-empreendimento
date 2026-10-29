/**
 * Etiquetas flutuantes das unidades. Nunca as 156: a do cursor, a da seleção
 * e um punhado de âncoras fixas que dão escala ao prédio.
 *
 * O conjunto de instâncias de `Html` é FIXO pela sessão inteira — quatro
 * âncoras, mais uma reservada para o hover e uma para a seleção. Cada `Html`
 * do drei cria um root de React próprio e o desmonta de forma síncrona na
 * limpeza do efeito; montar e desmontar conforme o mouse passa fazia o React 19
 * reclamar de "synchronously unmount a root while React was already rendering".
 * Então aqui nada monta nem desmonta: as instâncias são reposicionadas e a
 * visibilidade é alternada por opacidade no conteúdo. De brinde, o custo de
 * criar e destruir root a cada passada de mouse também sai.
 */
import { useMemo, useRef, useState, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Object3D } from 'three'
import type { UnitStatus } from '../../core/types'
import { useTour } from '../../core/store'
import {
  INDICE_DA_CAIXA,
  type CaixaDaUnidade,
  ancorasPadrao,
  caixaDaUnidade,
  corDoStatus,
} from './caixas'

/** Grupos desta frente: invisíveis, não devem ocultar etiqueta nenhuma. */
const MEUS_GRUPOS = new Set(['rotulos-de-unidade', 'camada-de-interacao'])

const bandeira = (o: Object3D, nome: string): boolean =>
  (o as unknown as Record<string, unknown>)[nome] === true

/**
 * Lista de oclusores para o `Html`.
 *
 * Por que não deixar o drei testar a cena inteira (`occlude={true}`): o
 * `Points` da atmosfera devolve interseção a distância 0 para qualquer raio
 * — é como o three raycasta partícula — e o teste do drei compara com a
 * distância do primeiro acerto. Resultado medido na cena integrada: as
 * quatro âncoras ficavam `display:none` o tempo todo, nenhuma etiqueta
 * chegava à tela.
 *
 * Então eu não refaço a conta do drei: só digo contra o que raycastar.
 * Filtro estrutural, sem depender do nome de ninguém — entra o galho de
 * primeiro nível que tem malha visível e não tem partícula nem sprite.
 * Se nada passar, a lista fica vazia e o drei considera tudo visível:
 * numa ferramenta de venda, etiqueta atravessando parede é falha menor que
 * etiqueta nenhuma.
 *
 * A lista só é recalculada quando a cena ganha ou perde um galho de primeiro
 * nível — um punhado de vezes na subida das cinco frentes, nunca por frame.
 * Trocar a identidade do array é seguro: o efeito do drei que cria o root de
 * React depende de `[target, transform]`, não de `occlude`.
 */
function useOclusores(ligado: boolean): RefObject<Object3D>[] {
  const scene = useThree((s) => s.scene)
  const [lista, setLista] = useState<RefObject<Object3D>[]>([])
  const assinatura = useRef(-1)

  useFrame(() => {
    if (!ligado || scene.children.length === assinatura.current) return
    assinatura.current = scene.children.length
    let mudou = false
    const novos: RefObject<Object3D>[] = []
    for (const filho of scene.children) {
      if (MEUS_GRUPOS.has(filho.name)) continue
      if (bandeira(filho, 'isLight') || bandeira(filho, 'isCamera')) continue
      let malhas = 0
      let particulas = 0
      filho.traverse((o) => {
        if (bandeira(o, 'isPoints') || bandeira(o, 'isSprite')) particulas++
        else if (bandeira(o, 'isMesh') && o.visible) malhas++
      })
      if (malhas > 0 && particulas === 0) novos.push({ current: filho })
    }
    mudou = novos.length !== lista.length || novos.some((r, i) => r.current !== lista[i].current)
    if (mudou) setLista(novos)
  })

  return lista
}

const ROTULO_STATUS: Record<UnitStatus, string> = {
  disponivel: 'Disponível',
  reservada: 'Reservada',
  vendida: 'Vendida',
}

type Papel = 'hover' | 'selecao' | 'ancora'

interface EtiquetaProps {
  /** Onde a instância está estacionada agora. Troca de lugar, nunca remonta. */
  caixa: CaixaDaUnidade | null
  papel: Papel
  visivel: boolean
  distanceFactor: number
  occlude: boolean | 'blending' | RefObject<Object3D>[]
  mostrarStatus: 'vendida' | 'sempre' | 'nunca'
  clicavel: boolean
}

function Etiqueta({
  caixa,
  papel,
  visivel,
  distanceFactor,
  occlude,
  mostrarStatus,
  clicavel,
}: EtiquetaProps) {
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)
  const u = caixa?.unidade

  const mostra =
    !!u && (mostrarStatus === 'sempre' || (mostrarStatus === 'vendida' && u.status === 'vendida'))
  const texto = u ? `Torre ${u.torre} · ${u.numero}${mostra ? ` · ${ROTULO_STATUS[u.status]}` : ''}` : ''

  const forte = papel !== 'ancora'
  const cor = u ? `#${corDoStatus(u.status).getHexString()}` : 'transparent'
  const interativo = visivel && clicavel && papel === 'ancora' && !!u

  return (
    <Html
      position={caixa ? caixa.ancora : [0, -1000, 0]}
      center
      occlude={occlude}
      distanceFactor={papel === 'ancora' ? distanceFactor * 0.7 : distanceFactor}
      pointerEvents={interativo ? 'auto' : 'none'}
      zIndexRange={[40, 0]}
    >
      <div
        style={{
          opacity: visivel && u ? (forte ? 1 : 0.86) : 0,
          // Aparece com fade; apaga seco, porque no mesmo commit a instância
          // reservada volta para o estacionamento e um fade-out deixaria um
          // fantasma viajando até lá.
          transition: visivel ? 'opacity 140ms ease' : 'none',
          pointerEvents: interativo ? 'auto' : 'none',
        }}
      >
        <div
          onClick={interativo && u ? () => selecionarUnidade(u.id) : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 11px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            fontSize: 13,
            lineHeight: 1,
            letterSpacing: '0.01em',
            color: 'var(--color-areia-100, #f1ebe0)',
            background: forte
              ? 'color-mix(in srgb, var(--color-grafite-950, #0a0c0d) 90%, transparent)'
              : 'color-mix(in srgb, var(--color-grafite-950, #0a0c0d) 72%, transparent)',
            border: `1px solid color-mix(in srgb, ${
              papel === 'selecao' ? 'var(--color-areia-200, #e2d7c5)' : cor
            } ${forte ? '46%' : '22%'}, transparent)`,
            boxShadow: forte ? '0 8px 22px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            userSelect: 'none',
            cursor: interativo ? 'pointer' : 'default',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: cor,
              flex: '0 0 auto',
              boxShadow: `0 0 8px ${cor}`,
            }}
          />
          {texto}
        </div>
      </div>
    </Html>
  )
}

export interface RotulosDeUnidadeProps {
  /** Unidades com etiqueta permanente. Padrão: `ancorasPadrao()`. */
  ancoras?: string[]
  /** Tamanho físico da etiqueta no mundo (drei). Padrão 80. */
  distanceFactor?: number
  /**
   * Oclusão do drei. Padrão `'auto'`: raycast contra os galhos da cena que
   * têm malha visível e não têm partícula. `true` volta ao comportamento
   * do drei de testar a cena inteira — que nesta cena oculta tudo.
   */
  occlude?: boolean | 'blending' | 'auto'
  /** Quando escrever o status no texto. Padrão `'vendida'`. */
  mostrarStatus?: 'vendida' | 'sempre' | 'nunca'
  /** Deixa as âncoras clicáveis para selecionar a unidade. Padrão false. */
  ancorasClicaveis?: boolean
  /** Força ligado/desligado. Por padrão apaga no modo 'vista'. Apaga, não desmonta. */
  ativo?: boolean
}

export function RotulosDeUnidade({
  ancoras,
  distanceFactor = 80,
  occlude = 'auto',
  mostrarStatus = 'vendida',
  ancorasClicaveis = false,
  ativo,
}: RotulosDeUnidadeProps = {}) {
  const modo = useTour((s) => s.modo)
  const hover = useTour((s) => s.unidadeHover)
  const selecionada = useTour((s) => s.unidadeSelecionada)

  const fixas = useMemo(() => (ancoras ?? ancorasPadrao()).filter((id) => INDICE_DA_CAIXA.has(id)), [ancoras])

  const ligado = ativo ?? modo !== 'vista'
  const oclusores = useOclusores(ligado && occlude === 'auto')
  const oclusao = occlude === 'auto' ? oclusores : occlude

  /** Lugar onde as duas instâncias reservadas descansam quando não há o que mostrar. */
  const estacionamento = useMemo(() => caixaDaUnidade(fixas[0] ?? null), [fixas])

  const idSelecao = selecionada && INDICE_DA_CAIXA.has(selecionada) ? selecionada : null
  const idHover =
    hover && INDICE_DA_CAIXA.has(hover) && hover !== idSelecao ? hover : null

  const comum = { distanceFactor, occlude: oclusao, mostrarStatus }

  return (
    <group name="rotulos-de-unidade">
      {fixas.map((id, i) => (
        <Etiqueta
          key={`ancora-${i}`}
          caixa={caixaDaUnidade(id)}
          papel="ancora"
          visivel={ligado && id !== idSelecao && id !== idHover}
          clicavel={ancorasClicaveis}
          {...comum}
        />
      ))}
      <Etiqueta
        key="selecao"
        caixa={caixaDaUnidade(idSelecao) ?? estacionamento}
        papel="selecao"
        visivel={ligado && !!idSelecao}
        clicavel={false}
        {...comum}
      />
      <Etiqueta
        key="hover"
        caixa={caixaDaUnidade(idHover) ?? estacionamento}
        papel="hover"
        visivel={ligado && !!idHover}
        clicavel={false}
        {...comum}
      />
    </group>
  )
}
