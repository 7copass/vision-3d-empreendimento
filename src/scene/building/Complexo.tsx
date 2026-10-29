/**
 * O conjunto inteiro, em um grupo R3F. Sem luzes e sem interação: a frente de
 * luz e atmosfera cuida de src/scene/env, a de interação de src/scene/interaction.
 *
 * O dia e a noite NÃO vêm do preset discreto do store. Vêm da altitude real do
 * sol, pela mesma curva que a atmosfera usa para o céu
 * (`parametrosDoCeu(altitude).noite`). Com o preset, arrastar a régua de hora
 * acendia o prédio inteiro de uma vez às 18h24 — com o sol ainda acima do
 * horizonte e o céu laranja aberto. Agora o vidro escurece e os apartamentos
 * acendem junto com o entardecer, cada um no seu momento.
 *
 * `dispose={null}` no grupo raiz é deliberado: materiais e texturas são
 * singletons compartilhados, e a limpeza automática do R3F os destruiria se
 * qualquer frente desmontasse e remontasse a cena.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
// Os dois módulos puros da frente de luz, e não o índice dela: o índice
// arrasta Atmosfera, Efeitos e @react-three/postprocessing junto, e aqui só
// se precisa de duas funções de matemática — a altitude do sol e a curva de
// noite que o céu usa.
import { parametrosDoCeu } from '../env/paleta'
import { posicaoDoSol } from '../env/sol'
import { useTour } from '../../core/store'
import { ajustarPorHora, ajustarQualidade, aplicarReflexo } from './materiais'
import { ceuReflexo } from './texturas'
import { Entorno } from './Entorno'
import { LajeLazer } from './LajeLazer'
import { Podium } from './Podium'
import { Terreno } from './Terreno'
import { Torres } from './Torres'
import { Vegetacao } from './Vegetacao'

/** Abaixo disto nenhuma unidade acendeu ainda; a malha sai de cena. */
const LIMIAR_VISIVEL = 0.004

export function Complexo(): ReactElement {
  const qualidade = useTour((s) => s.qualidade)
  const alta = qualidade === 'alta'

  /** Alguma janela acesa? Só troca de estado nas duas bordas do crepúsculo. */
  const [acesas, setAcesas] = useState(false)

  /**
   * Reflexo próprio enquanto a frente de luz não publicar um `scene.environment`.
   * A verificação fica no frame porque a troca pode acontecer depois da
   * montagem; é uma comparação de booleano por quadro, e ela se autocorrige
   * nos dois sentidos.
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
      const querAcesas = n > LIMIAR_VISIVEL
      setAcesas((v) => (v === querAcesas ? v : querAcesas))
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
      <Podium alta={alta} />
      <LajeLazer alta={alta} />
      <Torres alta={alta} acesas={acesas} />
      <Vegetacao alta={alta} />
    </group>
  )
}
