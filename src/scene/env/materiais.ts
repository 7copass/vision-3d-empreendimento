/**
 * Shaders do domo de céu, do campo de estrelas e do disco da lua.
 *
 * Os três são `ShaderMaterial` (não `RawShaderMaterial`), de propósito: o
 * three injeta `tonemapping_pars_fragment` e `colorspace_pars_fragment` no
 * prefixo de qualquer ShaderMaterial, então incluir `<tonemapping_fragment>`
 * e `<colorspace_fragment>` no fim do fragment faz o céu passar pelo MESMO
 * ACES e pela mesma conversão de espaço de cor dos materiais da arquitetura.
 * Sem isso o céu apareceria cru, mais claro e saturado que o prédio.
 *
 * As cores vêm de `THREE.Color`, que já converte sRGB → linear ao receber um
 * hex; portanto os uniforms chegam no espaço de trabalho linear, como o
 * shader espera.
 */
import * as THREE from 'three'

const VERTEX_DOMO = /* glsl */ `
  varying vec3 vDirecao;
  void main() {
    // esfera unitária: a posição local já é a direção de visada
    vDirecao = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_DOMO = /* glsl */ `
  varying vec3 vDirecao;

  uniform vec3  uTopo;
  uniform vec3  uHorizonte;
  uniform vec3  uSol;
  uniform vec3  uNeblina;
  uniform vec3  uDirSol;        // direção do sol, normalizada
  uniform vec3  uDirSolPlano;   // mesma direção projetada no plano, normalizada
  uniform float uBrilhoSol;

  void main() {
    vec3  d = normalize(vDirecao);
    float h = d.y;

    // gradiente vertical: horizonte → zênite, com expoente baixo para a faixa
    // clara do horizonte ficar fina como em céu de verdade
    vec3 acima = mix(uHorizonte, uTopo, pow(clamp(h, 0.0, 1.0), 0.42));
    // abaixo da linha do horizonte o céu morre na cor da neblina
    vec3 abaixo = mix(uNeblina, uHorizonte, smoothstep(-0.22, 0.0, h));
    vec3 cor = mix(abaixo, acima, step(0.0, h));

    // glória do horizonte: o lado do sol esquenta, o oposto não. É o que faz
    // a manhã e o fim de tarde ficarem dramáticos com o sol quase no plano.
    float azimutal = max(dot(normalize(vec3(d.x, 0.0, d.z)), uDirSolPlano), 0.0);
    float gloria = pow(azimutal, 3.0) * pow(1.0 - clamp(abs(h), 0.0, 1.0), 3.0);
    cor = mix(cor, uSol, clamp(gloria * 0.38 * uBrilhoSol, 0.0, 1.0));

    // halo largo + halo fechado em volta do sol
    float cs = max(dot(d, uDirSol), 0.0);
    cor += uSol * (pow(cs, 6.0) * 0.16 + pow(cs, 160.0) * 1.1) * uBrilhoSol;

    // disco do sol, ~0,6° — borda macia para o bloom pegar nas altas
    float disco = smoothstep(0.99996, 0.99999, cs);
    cor = mix(cor, uSol * 6.0, disco * clamp(uBrilhoSol, 0.0, 1.0));

    gl_FragColor = vec4(cor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

    // Dither de 1 LSB, aplicado JÁ em espaço de saída (depois do ACES e da
    // conversão de espaço de cor, que é onde a quantização acontece). O alvo
    // do composer é UnsignedByte de 8 bits, e um degradê de céu liso de azul
    // profundo a azul claro bandeia visivelmente em 8 bits. Isto custa uma
    // instrução e dissolve a banda.
    float ruido = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor.rgb += (ruido - 0.5) / 255.0;
  }
`

export function criarMaterialDoCeu(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTopo: { value: new THREE.Color('#1552b8') },
      uHorizonte: { value: new THREE.Color('#a9c9ea') },
      uSol: { value: new THREE.Color('#fff6e8') },
      uNeblina: { value: new THREE.Color('#b9d2ea') },
      uDirSol: { value: new THREE.Vector3(0, 1, 0) },
      uDirSolPlano: { value: new THREE.Vector3(0, 0, -1) },
      uBrilhoSol: { value: 1 },
    },
    vertexShader: VERTEX_DOMO,
    fragmentShader: FRAGMENT_DOMO,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: true,
  })
}

const VERTEX_ESTRELAS = /* glsl */ `
  attribute float tamanho;
  attribute float fase;
  varying vec3  vCor;
  varying float vFase;
  uniform float uEscala;
  void main() {
    vCor = color;
    vFase = fase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = tamanho * uEscala;
  }
`

const FRAGMENT_ESTRELAS = /* glsl */ `
  varying vec3  vCor;
  varying float vFase;
  uniform float uIntensidade;
  uniform float uTempo;
  void main() {
    // cada estrela cintila na sua própria fase — nada de pulsar em uníssono
    float cintila = 0.72 + 0.28 * sin(uTempo * 1.6 + vFase);
    float r = length(gl_PointCoord - vec2(0.5));
    float forma = smoothstep(0.5, 0.06, r);
    vec3 cor = vCor * (uIntensidade * cintila * forma);
    gl_FragColor = vec4(cor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function criarMaterialDeEstrelas(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uIntensidade: { value: 0 },
      uTempo: { value: 0 },
      uEscala: { value: 1 },
    },
    vertexShader: VERTEX_ESTRELAS,
    fragmentShader: FRAGMENT_ESTRELAS,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // material transparente é desenhado DEPOIS da geometria opaca: o teste de
    // profundidade tem que ficar ligado, senão as estrelas aparecem por cima
    // das torres. O domo não escreve profundidade, então onde só há céu elas
    // passam.
    depthTest: true,
    fog: false,
  })
}

/**
 * Campo de estrelas numa esfera unitária. Fica dentro do domo (raio 0,97) e
 * só o hemisfério de cima recebe estrelas — abaixo do horizonte não se vê.
 * Temperatura de cor sorteada em volta do branco, bem dessaturada: estrela
 * colorida demais entrega maquete.
 */
export function criarGeometriaDeEstrelas(quantidade: number): THREE.BufferGeometry {
  const posicoes = new Float32Array(quantidade * 3)
  const cores = new Float32Array(quantidade * 3)
  const tamanhos = new Float32Array(quantidade)
  const fases = new Float32Array(quantidade)
  const cor = new THREE.Color()

  for (let i = 0; i < quantidade; i += 1) {
    // distribuição uniforme no hemisfério superior, com uma margem abaixo
    const u = Math.random() * 2 - 1
    const y = Math.abs(u) * 0.98 - 0.02
    const raio = Math.sqrt(Math.max(0, 1 - y * y))
    const ang = Math.random() * Math.PI * 2
    posicoes[i * 3] = Math.cos(ang) * raio * 0.97
    posicoes[i * 3 + 1] = y * 0.97
    posicoes[i * 3 + 2] = Math.sin(ang) * raio * 0.97

    cor.setHSL(0.55 + (Math.random() - 0.5) * 0.14, 0.18, 0.92)
    cores[i * 3] = cor.r
    cores[i * 3 + 1] = cor.g
    cores[i * 3 + 2] = cor.b

    // a maioria apagada, poucas de primeira grandeza
    const m = Math.random()
    tamanhos[i] = 0.9 + m * m * m * 3.6
    fases[i] = Math.random() * Math.PI * 2
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(posicoes, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  geo.setAttribute('tamanho', new THREE.BufferAttribute(tamanhos, 1))
  geo.setAttribute('fase', new THREE.BufferAttribute(fases, 1))
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1)
  return geo
}

const VERTEX_LUA = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_LUA = /* glsl */ `
  varying vec2 vUv;
  uniform vec3  uCor;
  uniform float uFracao;       // fração iluminada do disco, 0–1
  uniform float uIntensidade;
  void main() {
    vec2  p = (vUv - 0.5) * 2.0;
    float r = length(p);

    // o disco ocupa 43% do quad; o resto do quad é halo
    float disco = smoothstep(0.45, 0.40, r);

    // terminador: reta inclinada, suficiente para as fases gibosas que o
    // seletor de noite escolhe (fração > 0,9)
    float ang = 0.38;
    float x = (p.x * cos(ang) - p.y * sin(ang)) / 0.43;
    float t = 1.0 - 2.0 * clamp(uFracao, 0.0, 1.0);
    float iluminada = smoothstep(t - 0.14, t + 0.14, x);

    // mancha larga de mare para o disco não ficar de plástico
    float mare = 0.92 + 0.08 * sin(p.x * 9.0) * cos(p.y * 7.0);

    float halo = exp(-r * 4.2) * 0.42;
    vec3 cor = uCor * (disco * mare * (0.07 + 0.93 * iluminada) * 2.2 + halo);

    gl_FragColor = vec4(cor * uIntensidade, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function criarMaterialDaLua(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCor: { value: new THREE.Color('#e7eefc') },
      uFracao: { value: 1 },
      uIntensidade: { value: 0 },
    },
    vertexShader: VERTEX_LUA,
    fragmentShader: FRAGMENT_LUA,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // idem estrelas: recortada pela geometria, nunca por cima dela
    depthTest: true,
    fog: false,
  })
}
