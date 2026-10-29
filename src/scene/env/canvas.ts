/**
 * Props do `<Canvas>`. O integrador espalha: `<Canvas {...canvasProps}>`.
 *
 * · `shadows: 'soft'` → `THREE.PCFSoftShadowMap`. O enquadramento e a
 *   resolução da sombra ficam em `<Atmosfera />`.
 * · tone mapping ACES no renderer (não no pós-processamento), exposição
 *   inicial de meio-dia — `<Atmosfera />` assume `gl.toneMappingExposure` a
 *   cada quadro e passeia entre ~0,92 (meio-dia) e ~1,26 (noite).
 * · `dpr: [1, 2]` → nitidez em tela Retina sem pagar 3× de fill rate; numa
 *   máquina de corretor em call compartilhada é o que segura os 30 fps.
 * · `far: 2400` cobre o domo de céu (raio 1200) com folga; `near: 0.35`
 *   permite a câmera encostar na varanda sem cortar a guarda.
 */
import type { RenderProps } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'

export const canvasProps: Omit<RenderProps<HTMLCanvasElement>, 'size'> = {
  shadows: 'soft',
  dpr: [1, 2],
  gl: {
    antialias: true,
    alpha: false,
    stencil: false,
    depth: true,
    powerPreference: 'high-performance',
    toneMapping: ACESFilmicToneMapping,
    toneMappingExposure: 0.92,
    outputColorSpace: SRGBColorSpace,
  },
  camera: {
    fov: 38,
    near: 0.35,
    far: 2400,
    position: [168, 96, 196],
  },
  performance: { min: 0.5 },
}
