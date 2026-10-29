/**
 * Frente "Visualizadores 2D" — galeria, plantas SVG, filme e mapa de distâncias.
 * O integrador monta <Visualizadores /> por cima do canvas 3D; cada peça
 * também funciona isolada, recebendo `onFechar` e (quando faz sentido)
 * `tipologiaId`.
 */

export { Visualizadores } from './Visualizadores'

export { Galeria } from './Galeria'
export type { GaleriaProps } from './Galeria'

export { VisualizadorPlantas } from './VisualizadorPlantas'
export type { VisualizadorPlantasProps } from './VisualizadorPlantas'

export { Filme } from './Filme'
export type { FilmeProps } from './Filme'

export { MapaDistancias } from './MapaDistancias'
export type { MapaDistanciasProps } from './MapaDistancias'

/**
 * Seletor de empreendimento. Peça de chrome, não de tela cheia: nasce aqui
 * porque esta frente é dona de `src/viewers/`, mas o integrador monta na coluna
 * esquerda do <Chrome />, logo abaixo de <MarcaDoEmpreendimento />.
 */
export { SeletorDeEmpreendimento } from './SeletorDeEmpreendimento'
export type { SeletorDeEmpreendimentoProps } from './SeletorDeEmpreendimento'

/** Registro dos desenhos SVG, para quem quiser embutir uma planta fora do visualizador. */
export { DESENHOS, desenhoById } from './plantas/registro'
export type { DesenhoSpec } from './plantas/registro'

/** Plantas que chegaram como imagem (`desenho: 'imagem:<nome>'`), e não como SVG. */
export { PREFIXO_IMAGEM, ehPlantaEmImagem, srcDaPlantaEmImagem } from './plantas/imagem'

export { PlantaTipo1 } from './plantas/Tipo1'
export { PlantaTipo1Setores } from './plantas/Tipo1Setores'
export { PlantaTipo2 } from './plantas/Tipo2'
export { PlantaCoberturaInferior } from './plantas/CoberturaInferior'
export { PlantaCoberturaSuperior } from './plantas/CoberturaSuperior'
