/**
 * Frente de interação 3D do Village One.
 *
 * Ordem de montagem dentro do `<Canvas>`:
 *   <Camera />                 — precisa existir antes de quem usa `makeDefault`
 *   ...arquitetura e ambiente...
 *   <CamadaDeInteracao />      — caixas invisíveis sobre a geometria
 *   <RotulosDeUnidade />       — etiquetas, por último (oclusão lê a cena)
 */
export { CamadaDeInteracao } from './CamadaDeInteracao'
export type { CamadaDeInteracaoProps } from './CamadaDeInteracao'

export { RotulosDeUnidade } from './RotulosDeUnidade'
export type { RotulosDeUnidadeProps } from './RotulosDeUnidade'

export { Camera } from './Camera'
export type { CameraProps } from './Camera'

export { enquadrarConjunto, enquadrarUnidade } from './enquadramento'
export type { Pose, Otica } from './enquadramento'

export { ancorasPadrao, caixaDaUnidade, corDoStatus, planoDeRealce, filtrosAtivos } from './caixas'
export type { CaixaDaUnidade, Realce } from './caixas'
