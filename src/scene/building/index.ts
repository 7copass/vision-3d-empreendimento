/**
 * Frente de arquitetura 3D — Village One.
 *
 * Entrega principal:
 *   <Complexo />  grupo R3F com terreno, embasamento, laje de lazer, as duas
 *                 torres, o coroamento, o paisagismo e o entorno urbano.
 *                 Sem props. Lê `preset` e `qualidade` de useTour por conta própria.
 *
 * As peças também saem avulsas, para quem quiser montar um enquadramento
 * parcial (uma vinheta só do pódio, por exemplo). Todas recebem `alta: boolean`.
 */
export { Complexo } from './Complexo'

export { Terreno, VIAS, ACESSOS } from './Terreno'
export { Podium } from './Podium'
export { LajeLazer } from './LajeLazer'
export { Torres } from './Torres'
export { Entorno } from './Entorno'
export { Vegetacao, CANTEIROS_DECK, CANTEIROS_TERRENO } from './Vegetacao'
export type { Canteiro } from './Vegetacao'

/**
 * `ajustarPorHora` recebe o fator de noite CONTÍNUO (0 = dia, 1 = noite
 * fechada) — o mesmo `parametrosDoCeu(altitude).noite` que a atmosfera usa.
 * <Complexo /> já o alimenta sozinho a partir da altitude do sol.
 */
export { materiais, ajustarPorHora, ajustarQualidade, aplicarReflexo, fatorDeNoite } from './materiais'
export type { Materiais } from './materiais'

/**
 * O vidro, a água e os metais usam um reflexo de gradiente gerado aqui porque
 * hoje ninguém publica `scene.environment`. Quando a frente de luz publicar,
 * <Complexo /> percebe sozinho e cede a vez; `aplicarReflexo(null)` força isso.
 */
export { ceuReflexo } from './texturas'

/** Caso outra frente queira montar geometria no mesmo vocabulário. */
export { Instancias, Peca } from './Instancias'
export { cenario, semRaycast, hash, mesclar, bloco, caixa, piso, painel } from './util'
export type { Transf, Vec3, Retangulo, Caixa3 } from './util'
