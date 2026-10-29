/**
 * Pós-processamento. Comedido de propósito: o alvo é peça de arquitetura, e
 * render de arquitetura não tem borrão, não tem aberração cromática e não tem
 * bloom em tudo.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * POR QUE NÃO TEM MSAA NEM HALF-FLOAT AQUI
 * ──────────────────────────────────────────────────────────────────────────
 * Medido (M1, ANGLE/Metal, 1,57 Mpix, tempo de GPU por quadro via gl.finish;
 * ver `medidor.tsx` e a tabela no relatório):
 *
 *   cadeia toda, multisampling 4 + HalfFloat →  26,4 ms
 *   cadeia toda, multisampling 0 + HalfFloat →   9,1 ms
 *   cadeia toda, multisampling 0 + 8 bits    →   2,2 ms
 *
 * Isoladamente, MSAA 4 custa +0,2 ms e HalfFloat +0,1 ms — nada. O N8AO
 * isolado custa +0,4 ms. O que explode é a COMBINAÇÃO: o N8AO lê o buffer de
 * profundidade, e quando o alvo do composer é multiamostrado e/ou
 * meio-flutuante, cada quadro de AO paga um resolve/cópia do depth que no
 * ANGLE/Metal custa ~24 ms. Não é a soma dos passes, é uma interação.
 *
 * Com `multisampling: 0` e `UnsignedByteType`, o AO fica praticamente de
 * graça. O antisserrilhado passa a ser o SMAA (+0,5 ms), agora nas DUAS
 * qualidades, já que não há mais MSAA para cobrir 'alta'. O degradê do céu em
 * 8 bits é protegido por um dither de 1 LSB no shader do domo.
 *
 * Se alguém for mexer nestes dois valores, meça antes: `?prof=1` liga o
 * medidor e `?fx=`/`?msaa=`/`?fb=` isolam os passes.
 *
 * A cadeia:
 *   N8AO       → oclusão de ambiente (só `qualidade === 'alta'`)
 *   Bloom      → só nas altas, limiar alto, mipmap blur
 *   HueSaturation + BrightnessContrast → correção de cor (passe fundido, 0 ms)
 *   Vignette   → vinheta discreta (mesmo passe fundido)
 *   SMAA       → antisserrilhado
 *
 * O tone mapping ACES fica no RENDERER (ver `canvasProps`), não aqui: assim a
 * imagem continua correta se o integrador montar a cena sem `<Efeitos />`, e
 * não há risco de aplicar ACES duas vezes. Em troca, o limiar de luminância
 * do bloom é calibrado para valores já mapeados, por isso é alto (0,86).
 */
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { HalfFloatType, UnsignedByteType } from 'three'
import { useTour } from '../../core/store'
import { BANCO } from './bench'
import { Medidor } from './medidor'

export function Efeitos() {
  const qualidade = useTour((s) => s.qualidade)
  const alta = qualidade === 'alta'

  // produção; `BANCO` só é diferente de null com query string de medição
  const ligado = (passe: 'ao' | 'bloom' | 'cor' | 'vinheta' | 'smaa', padrao: boolean) =>
    BANCO ? BANCO.passes.has(passe) : padrao
  // 0 e 8 bits nas duas qualidades: ver a nota no topo do arquivo
  const msaa = BANCO?.msaa ?? 0
  const fb = (BANCO?.halfFloat ?? false) ? HalfFloatType : UnsignedByteType

  const cadeia = (
    <EffectComposer
      key={`${qualidade}-${msaa}-${fb}`}
      multisampling={msaa}
      frameBufferType={fb}
      enableNormalPass={false}
    >
      {ligado('ao', alta) ? (
        <N8AO
          // raio em metros: pega o encontro do pódio com as torres e os
          // recuos de fachada, sem sujar a silhueta contra o céu
          // raio em metros: pega o encontro do pódio com as torres e os
          // recuos de fachada, sem sujar a silhueta contra o céu. O raio é o
          // parâmetro caro do N8AO (mais dispersão = mais cache miss), então
          // a profundidade extra vem de `intensity`, que é só uma
          // multiplicação e não custa nada.
          aoRadius={2.6}
          distanceFalloff={1.1}
          intensity={1.8}
          // NÃO passar `quality`: o wrapper aplica setQualityMode() num
          // useLayoutEffect POSTERIOR ao que aplica as props soltas, então um
          // `quality` aqui sobrescreveria aoSamples/denoiseSamples abaixo. Era
          // o que acontecia antes — `denoiseSamples={6}` nunca valeu, virava 8.
          aoSamples={16}
          denoiseSamples={4}
          denoiseRadius={12}
          // AO é sinal de baixa frequência: meia resolução é indistinguível
          halfRes
          depthAwareUpsampling
          color="#0d1626"
        />
      ) : null}

      {ligado('bloom', true) ? (
        <Bloom
          mipmapBlur
          luminanceThreshold={0.86}
          luminanceSmoothing={0.22}
          intensity={0.32}
          radius={0.62}
        />
      ) : null}

      {ligado('cor', true) ? (
        <HueSaturation blendFunction={BlendFunction.NORMAL} hue={0} saturation={0.05} />
      ) : null}
      {ligado('cor', true) ? (
        <BrightnessContrast blendFunction={BlendFunction.NORMAL} brightness={0} contrast={0.07} />
      ) : null}
      {ligado('vinheta', true) ? (
        <Vignette blendFunction={BlendFunction.NORMAL} offset={0.3} darkness={0.46} eskil={false} />
      ) : null}

      {ligado('smaa', true) ? <SMAA /> : null}
    </EffectComposer>
  )

  // o Medidor fica IRMÃO do composer, não filho: o EffectComposer varre os
  // próprios filhos procurando Effect/Pass, e não convém pôr nada lá dentro
  // que não seja um deles
  if (!BANCO?.prof) return cadeia
  return (
    <>
      {cadeia}
      <Medidor />
    </>
  )
}
