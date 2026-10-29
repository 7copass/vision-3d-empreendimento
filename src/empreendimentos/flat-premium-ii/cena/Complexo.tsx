/**
 * O Flat Premium II inteiro, num grupo R3F. Sem luzes e sem interação: a
 * frente de luz e atmosfera cuida de `src/scene/env`, a de interação de
 * `src/scene/interaction`.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * O QUE ACENDE O PRÉDIO
 * ──────────────────────────────────────────────────────────────────────────
 * Duas coisas, e de propósito não é uma só:
 *
 * 1. O PRESET do store (`useTour(s => s.preset)`) diz se é noite. É ele que
 *    liga a malha das janelas acesas — uma `InstancedMesh` aditiva que não
 *    tem nada a fazer no quadro das 12h, e que some da cena em vez de
 *    desenhar centenas de painéis pretos.
 * 2. A ALTITUDE REAL DO SOL diz QUANTO é noite, pela mesma curva que a
 *    atmosfera usa para o céu (`parametrosDoCeu(altitude).noite`). É ela que
 *    governa o quanto cada flat acende, o quanto o vidro escurece e o quanto
 *    as fitas de LED do coroamento, da marquise e das varandas sobem. Sem
 *    isso, arrastar a régua de hora acenderia o prédio inteiro de um degrau
 *    só, com o céu ainda laranja — que é exatamente o quadro que o render de
 *    entardecer desmente: lá a arquitetura já está iluminada e o céu ainda tem
 *    cor.
 *
 * As duas funções de matemática vêm dos módulos PUROS da frente de luz, e não
 * do índice dela: o índice arrasta `Atmosfera`, `Efeitos` e
 * `@react-three/postprocessing` junto, e aqui só se precisa da posição do sol
 * e da curva de noite.
 *
 * `dispose={null}` no grupo raiz é deliberado: materiais e texturas são
 * singletons compartilhados, e a limpeza automática do R3F os destruiria se
 * qualquer frente desmontasse e remontasse a cena.
 */
import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { parametrosDoCeu } from '../../../scene/env/paleta'
import { posicaoDoSol } from '../../../scene/env/sol'
import { useTour } from '../../../core/store'
import { ajustarPorHora, ajustarQualidade, aplicarReflexo } from './materiais'
import { ceuReflexo } from './texturas'
import { Edificio } from './Edificio'
import { Entorno } from './Entorno'
import { Terreno } from './Terreno'

export function Complexo(): ReactElement {
  const qualidade = useTour((s) => s.qualidade)
  const preset = useTour((s) => s.preset)
  const alta = qualidade === 'alta'
  const acesas = preset === 'noite'

  /**
   * Reflexo próprio enquanto a frente de luz não publicar um
   * `scene.environment`. A verificação fica no frame porque a troca pode
   * acontecer depois da montagem; é uma comparação de booleano por quadro, e
   * ela se autocorrige nos dois sentidos.
   */
  const reflexoProprio = useRef<boolean | null>(null)
  const ultimoInstante = useRef({ hora: Number.NaN, mes: Number.NaN })
  const noite = useRef(0)

  useEffect(() => {
    ajustarQualidade(alta)
  }, [alta])

  useFrame(({ scene }) => {
    const { hora, mes } = useTour.getState()

    // o sol só é recalculado quando a régua de hora ou o mês mudam
    if (hora !== ultimoInstante.current.hora || mes !== ultimoInstante.current.mes) {
      ultimoInstante.current = { hora, mes }
      const n = parametrosDoCeu(posicaoDoSol(hora, mes).altitude).noite
      noite.current = n
      ajustarPorHora(n)
      if (reflexoProprio.current) aplicarReflexo(ceuReflexo(n))
    }

    const precisa = !scene.environment
    if (precisa === reflexoProprio.current) return
    reflexoProprio.current = precisa
    aplicarReflexo(precisa ? ceuReflexo(noite.current) : null)
  })

  return (
    <group name="complexo" dispose={null}>
      <Terreno alta={alta} />
      <Entorno alta={alta} />
      <Edificio alta={alta} acesas={acesas} />
    </group>
  )
}
