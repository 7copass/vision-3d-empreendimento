/**
 * Medidor de tempo de GPU por quadro. Só monta com `?prof=1`.
 *
 * Por que não medir com `requestAnimationFrame`: o rAF é preso ao vsync, então
 * qualquer configuração mais rápida que 16,7 ms mede 16,7 ms, e numa aba em
 * segundo plano o navegador derruba quadros — o que sai é múltiplo do vsync,
 * não tempo de GPU. Nenhum dos dois serve para comparar passes.
 *
 * Aqui o quadro é cercado por duas assinaturas de `useFrame`: o
 * `EffectComposer` do @react-three/postprocessing usa prioridade 1, então
 * prioridade 0 roda ANTES dele e prioridade 2 DEPOIS. `gl.finish()` bloqueia
 * até a GPU terminar, logo:
 *
 *   p0: finish() (drena o quadro anterior) → t0 = now()
 *   p2: finish() (espera ESTE quadro)      → dt = now() − t0
 *
 * `dt` é o tempo real de GPU da cena mais a cadeia inteira, independente de
 * vsync e de throttling de aba. O custo: os dois `finish()` serializam CPU e
 * GPU, então o absoluto fica um pouco pessimista (sem sobreposição de
 * quadros). As DIFERENÇAS entre configurações, que é o que interessa para
 * saber quanto cada efeito custa, ficam corretas.
 *
 * As amostras são agrupadas pelo tamanho do drawing buffer do quadro: o
 * `PerformanceMonitor` do App troca o dpr quando a taxa cai, e sem agrupar a
 * mediana misturaria quadros de 0,7 Mpix com quadros de 1,6 Mpix — foi o que
 * sujou a primeira rodada de medições.
 *
 * Leitura: `window.__perf()` no console; `window.__perfReset()` zera.
 */
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const LIMITE_AMOSTRAS = 600

export function Medidor() {
  const gl = useThree((s) => s.gl)
  const estado = useMemo(
    () => ({ t0: 0, amostras: [] as Array<[number, number, number]> }),
    [],
  )

  useFrame(() => {
    gl.getContext().finish()
    estado.t0 = performance.now()
  }, 0)

  useFrame(() => {
    const ctx = gl.getContext()
    ctx.finish()
    estado.amostras.push([
      performance.now() - estado.t0,
      ctx.drawingBufferWidth,
      ctx.drawingBufferHeight,
    ])
    if (estado.amostras.length > LIMITE_AMOSTRAS) estado.amostras.shift()
  }, 2)

  useEffect(() => {
    const janela = window as unknown as Record<string, unknown>
    janela.__perf = () => {
      const grupos = new Map<string, number[]>()
      for (const [dt, w, h] of estado.amostras) {
        const k = `${w}x${h}`
        const lista = grupos.get(k)
        if (lista) lista.push(dt)
        else grupos.set(k, [dt])
      }
      const saida: Record<string, unknown> = {}
      for (const [k, bruto] of grupos) {
        if (bruto.length < 15) continue
        const o = bruto.sort((a, b) => a - b)
        const q = (p: number) => +o[Math.min(o.length - 1, Math.floor(o.length * p))].toFixed(2)
        const [w, h] = k.split('x').map(Number)
        const px = w * h
        saida[k] = {
          n: o.length,
          mpix: +(px / 1e6).toFixed(3),
          p50: q(0.5),
          p10: q(0.1),
          p90: q(0.9),
          max: +o[o.length - 1].toFixed(2),
          msPorMpix: +((q(0.5) * 1e6) / px).toFixed(2),
        }
      }
      return { q: window.location.search, grupos: saida }
    }
    janela.__perfReset = () => {
      estado.amostras.length = 0
    }
    return () => {
      delete janela.__perf
      delete janela.__perfReset
    }
  }, [gl, estado])

  return null
}
