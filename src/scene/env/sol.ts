/**
 * Efemérides reais do Sol e da Lua no terreno do Village One.
 *
 * Sistema do mundo (contrato de `src/core/world.ts`): metros, Y para cima,
 * Norte = −Z, Sul = +Z, Leste = +X, Oeste = −X.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * CONVERSÃO DE AZIMUTE
 * ──────────────────────────────────────────────────────────────────────────
 * O suncalc existe em duas gerações, com convenções diferentes:
 *
 *   (a) suncalc clássico (≤ 1.9, e os tipos de `@types/suncalc`):
 *       `altitude` e `azimuth` em RADIANOS e o azimute medido A PARTIR DO SUL,
 *       no sentido horário (Sul = 0, Oeste = +π/2, Norte = ±π, Leste = −π/2).
 *
 *   (b) suncalc 2.x (o instalado neste projeto):
 *       `altitude` e `azimuth` em GRAUS e o azimute medido a partir do NORTE,
 *       no sentido horário (Norte = 0, Leste = 90, Sul = 180, Oeste = 270).
 *
 * Em vez de apostar numa delas, o módulo se CALIBRA no carregamento
 * (ver `CONVENCAO`) e normaliza tudo para "graus a partir do Norte, horário":
 *
 *   azNorte = (azSul + 180) mod 360          ← quando a origem é o Sul
 *   azNorte = azSul_rad · 180/π + 180        ← idem, saindo de radianos
 *
 * Com o azimute em graus a partir do Norte (az) e a altitude (alt), a direção
 * no sistema do mundo sai da definição dos eixos:
 *
 *   az =   0° → Norte → (x, z) = ( 0, −1)      →  x = sin(az)
 *   az =  90° → Leste → (x, z) = (+1,  0)      →  z = −cos(az)
 *
 *   x = D · cos(alt) · sin(az)
 *   y = D · sin(alt)
 *   z = −D · cos(alt) · cos(az)
 *
 * Conferido em Santarém: nascer ~06h26–06h44 e poente ~18h36–18h51 ao longo
 * do ano, sol a ENE no nascer de junho e a ESE no de dezembro.
 */
import * as SunCalc from 'suncalc'
import { SITE } from '../../core/world'

const GRAU = Math.PI / 180

/** Distância da luz direcional ao centro do terreno, em metros. */
export const DISTANCIA_SOL = 400
/** A lua entra no mesmo domo, na mesma distância. */
export const DISTANCIA_LUA = 400

/** O store só carrega `mes`; o ano e o dia do mês são fixos e documentados. */
export const ANO_REFERENCIA = 2026
/** Dia representativo do mês para o Sol: o meio do mês. */
export const DIA_REPRESENTATIVO = 15

export interface PosicaoCeleste {
  /** Posição no sistema do mundo, em metros. */
  posicao: [number, number, number]
  /** Altitude aparente acima do horizonte, em graus. */
  altitude: number
  /** Azimute em graus a partir do Norte, sentido horário (0 = N, 90 = L). */
  azimute: number
  acimaDoHorizonte: boolean
}

export interface PosicaoDaLua extends PosicaoCeleste {
  /** Fração iluminada do disco, 0 (nova) → 1 (cheia). */
  fracaoIluminada: number
}

/**
 * Instante UTC correspondente a uma hora local de Santarém.
 * `hora` é fracionária 0–24; o fuso de `SITE` é −3, logo UTC = local + 3.
 */
export function instanteUTC(hora: number, mes: number, dia: number = DIA_REPRESENTATIVO): Date {
  const mesValido = Math.min(12, Math.max(1, Math.round(mes)))
  const horaValida = ((hora % 24) + 24) % 24
  const minutosUTC = Math.round((horaValida - SITE.fusoHoras) * 60)
  return new Date(Date.UTC(ANO_REFERENCIA, mesValido - 1, dia, 0, minutosUTC, 0, 0))
}

/**
 * Calibração da convenção do suncalc instalado, feita uma única vez.
 * Varre um dia inteiro no equinócio de março:
 *   · se alguma |altitude| passa de π/2, a biblioteca devolve GRAUS;
 *   · se nenhum azimute é negativo, a origem é o NORTE (faixa 0–360).
 */
const CONVENCAO = ((): { emGraus: boolean; baseNorte: boolean } => {
  let maiorAltitude = 0
  let menorAzimute = Number.POSITIVE_INFINITY
  for (let hora = 0; hora < 24; hora += 1) {
    const p = SunCalc.getPosition(instanteUTC(hora, 3), SITE.lat, SITE.lng)
    maiorAltitude = Math.max(maiorAltitude, Math.abs(p.altitude))
    menorAzimute = Math.min(menorAzimute, p.azimuth)
  }
  return {
    emGraus: maiorAltitude > Math.PI / 2 + 0.05,
    baseNorte: menorAzimute >= 0,
  }
})()

/** Normaliza a saída do suncalc para graus, azimute a partir do Norte. */
function normalizar(bruto: { altitude: number; azimuth: number }): {
  altitude: number
  azimute: number
} {
  const altitude = CONVENCAO.emGraus ? bruto.altitude : bruto.altitude / GRAU
  let azimute = CONVENCAO.emGraus ? bruto.azimuth : bruto.azimuth / GRAU
  if (!CONVENCAO.baseNorte) azimute += 180
  azimute = ((azimute % 360) + 360) % 360
  return { altitude, azimute }
}

/** Altitude/azimute (graus, origem Norte) → posição no sistema do mundo. */
export function posicaoNoMundo(
  altitude: number,
  azimute: number,
  distancia: number,
): [number, number, number] {
  const alt = altitude * GRAU
  const az = azimute * GRAU
  const raio = Math.cos(alt) * distancia
  return [raio * Math.sin(az), Math.sin(alt) * distancia, -raio * Math.cos(az)]
}

/** Posição real do Sol sobre o terreno, para a hora local e o mês dados. */
export function posicaoDoSol(hora: number, mes: number): PosicaoCeleste {
  const { altitude, azimute } = normalizar(
    SunCalc.getPosition(instanteUTC(hora, mes), SITE.lat, SITE.lng),
  )
  return {
    posicao: posicaoNoMundo(altitude, azimute, DISTANCIA_SOL),
    altitude,
    azimute,
    acimaDoHorizonte: altitude > 0,
  }
}

/**
 * A lua se atrasa ~50 min por noite, então o dia 15 de cada mês quase sempre
 * cai numa lua pobre ou abaixo do horizonte. Para o preset de noite render
 * sempre, escolhe-se de cada mês a NOITE REAL em que a lua está cheia e bem
 * posta no céu às 21h — altitude perto de 45°, que é o que dá luz rasante nas
 * fachadas. É efeméride verdadeira, só não é o dia 15.
 */
const noiteDeLuaPorMes = new Map<number, number>()

export function noiteDeLua(mes: number): number {
  const mesValido = Math.min(12, Math.max(1, Math.round(mes)))
  const guardado = noiteDeLuaPorMes.get(mesValido)
  if (guardado !== undefined) return guardado

  let melhorDia = DIA_REPRESENTATIVO
  let melhorNota = Number.NEGATIVE_INFINITY
  for (let dia = 1; dia <= 28; dia += 1) {
    const quando = instanteUTC(21, mesValido, dia)
    const { altitude } = normalizar(SunCalc.getMoonPosition(quando, SITE.lat, SITE.lng))
    if (altitude < 15) continue
    const fracao = SunCalc.getMoonIllumination(quando).fraction
    const nota = fracao - Math.abs(altitude - 45) / 90
    if (nota > melhorNota) {
      melhorNota = nota
      melhorDia = dia
    }
  }
  noiteDeLuaPorMes.set(mesValido, melhorDia)
  return melhorDia
}

/** Posição real da Lua na noite de lua cheia do mês (ver `noiteDeLua`). */
export function posicaoDaLua(hora: number, mes: number): PosicaoDaLua {
  const quando = instanteUTC(hora, mes, noiteDeLua(mes))
  const { altitude, azimute } = normalizar(SunCalc.getMoonPosition(quando, SITE.lat, SITE.lng))
  return {
    posicao: posicaoNoMundo(altitude, azimute, DISTANCIA_LUA),
    altitude,
    azimute,
    acimaDoHorizonte: altitude > 0,
    fracaoIluminada: SunCalc.getMoonIllumination(quando).fraction,
  }
}
