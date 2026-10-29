/** Frente de luz e atmosfera. Nada fora de `src/scene/env/` é tocado aqui. */
export { Atmosfera } from './Atmosfera'
export { Efeitos } from './Efeitos'
export { canvasProps } from './canvas'

export {
  posicaoDoSol,
  posicaoDaLua,
  posicaoNoMundo,
  instanteUTC,
  noiteDeLua,
  DISTANCIA_SOL,
  DISTANCIA_LUA,
  ANO_REFERENCIA,
  DIA_REPRESENTATIVO,
} from './sol'
export type { PosicaoCeleste, PosicaoDaLua } from './sol'

export { coresDoCeu, parametrosDoCeu, COR_DO_CHAO } from './paleta'
export type { CoresDoCeu, ParametrosDoCeu } from './paleta'
