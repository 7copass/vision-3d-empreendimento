import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'

import { Geometria } from './core/Geometria'
import { Atmosfera, Efeitos, canvasProps } from './scene/env'
import { CamadaDeInteracao, Camera, RotulosDeUnidade } from './scene/interaction'
import { Chrome } from './ui'
import { Visualizadores } from './viewers'

/**
 * Teto de resolução. A cena é limitada por fill rate, não por geometria:
 * medido nesta máquina, 786 mil pixels dão 60 fps e 3,1 milhões dão 21.
 * Num notebook com tela retina, `dpr: 2` sozinho derruba a reunião.
 */
const DPR_CHEIO = 1.5
const DPR_REDUZIDO = 1

/**
 * A ordem dentro do Canvas não é estética:
 * - <Camera /> primeiro, porque registra `makeDefault` para quem depender de controles.
 * - <RotulosDeUnidade /> por último entre os objetos, porque a oclusão do Html
 *   do drei testa contra a cena já montada.
 * - <Efeitos /> encerra, porque o EffectComposer consome o que foi desenhado.
 *
 * O Chrome é `absolute inset-0 z-30` e os visualizadores são `fixed inset-0 z-40`,
 * então a tela cheia sempre cobre os painéis — daí este container ser `relative`.
 */
export default function App() {
  const [dpr, setDpr] = useState(DPR_CHEIO)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        {...canvasProps}
        dpr={dpr}
        onCreated={(estado) => {
          // Só em desenvolvimento: dá acesso à câmera e à cena pelo console,
          // para diagnosticar enquadramento sem adivinhar.
          if (import.meta.env.DEV) {
            ;(window as unknown as Record<string, unknown>).__cena = estado
          }
        }}
      >
        {/* Cede nitidez antes de ceder fluidez: numa call, engasgo é pior que pixel. */}
        <PerformanceMonitor
          onDecline={() => setDpr(DPR_REDUZIDO)}
          onIncline={() => setDpr(DPR_CHEIO)}
        />
        <Suspense fallback={null}>
          <Camera />
          <Atmosfera />
          <Geometria />
          <CamadaDeInteracao />
          <RotulosDeUnidade />
          <Efeitos />
        </Suspense>
      </Canvas>

      <Chrome />
      <Visualizadores />
    </div>
  )
}
