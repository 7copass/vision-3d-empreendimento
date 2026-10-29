/**
 * Banco de medição da cadeia de pós-processamento.
 *
 * Sem query string na URL, `BANCO` é `null` e vale exatamente a configuração
 * de produção — este arquivo não muda nada. Com query string, permite isolar
 * o custo de cada passe sem recompilar:
 *
 *   ?fx=none                  → composer sem nenhum efeito
 *   ?fx=ao                    → só a oclusão de ambiente
 *   ?fx=bloom,cor,vinheta     → a cadeia barata, sem AO
 *   ?fx=all                   → tudo
 *   &msaa=0|2|4               → multisampling do alvo do composer
 *   &fb=8|16                  → UnsignedByte ou HalfFloat no frame buffer
*   &sombra=1024|2048|4096    → resolução do shadow map (lido por Atmosfera)
 *   &prof=1                   → monta <Medidor />: tempo real de GPU por
 *                               quadro via gl.finish(), e força o shadow map a
 *                               redesenhar TODO quadro (senão o custo dele
 *                               aparece só como pico a cada 60 quadros)
 *
 * É o que produziu os números de ms/quadro no relatório de performance. Fica
 * no repositório de propósito: a próxima regressão de fill rate vai querer.
 */

export type PasseDeEfeito = 'ao' | 'bloom' | 'cor' | 'vinheta' | 'smaa'

export interface Banco {
  passes: Set<PasseDeEfeito>
  msaa: number | null
  halfFloat: boolean | null
  sombra: number | null
  prof: boolean
}

const TODOS: PasseDeEfeito[] = ['ao', 'bloom', 'cor', 'vinheta', 'smaa']

function ler(): Banco | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  if (!q.has('fx') && !q.has('msaa') && !q.has('fb') && !q.has('sombra') && !q.has('prof')) {
    return null
  }

  const fx = q.get('fx')
  let passes: Set<PasseDeEfeito>
  if (fx === null || fx === 'all') passes = new Set(TODOS)
  else if (fx === 'none') passes = new Set()
  else passes = new Set(fx.split(',').filter((p): p is PasseDeEfeito => (TODOS as string[]).includes(p)))

  const msaa = q.has('msaa') ? Number(q.get('msaa')) : null
  const fb = q.get('fb')
  const sombra = q.has('sombra') ? Number(q.get('sombra')) : null

  return {
    passes,
    msaa: msaa !== null && Number.isFinite(msaa) ? msaa : null,
    halfFloat: fb === null ? null : fb === '16',
    sombra: sombra !== null && Number.isFinite(sombra) ? sombra : null,
    prof: q.get('prof') === '1',
  }
}

export const BANCO: Banco | null = ler()
