/**
 * Plantas entregues como imagem, e não como desenho vetorial.
 *
 * Nem todo empreendimento tem planta vetorizada: o Flat Premium II chegou com
 * três imagens do material comercial. Os dados referenciam cada uma pelo campo
 * `desenho` da Planta, no formato `imagem:<nome>` — o mesmo campo que, sem
 * prefixo, é a chave do registro de SVG em `./registro`.
 *
 * O arquivo vive em `public/img/<empreendimento>/<nome>.webp`, então a pasta é
 * o próprio id do empreendimento ativo e nenhum id novo precisa ser inventado
 * quando um terceiro empreendimento entrar.
 */
import { useEffect, useMemo, useState } from 'react'
import { ID_ATIVO } from '../../core/ativo'

/** Marca, no campo `desenho`, uma planta que é imagem e não SVG. */
export const PREFIXO_IMAGEM = 'imagem:'

export const ehPlantaEmImagem = (desenho: string): boolean => desenho.startsWith(PREFIXO_IMAGEM)

/**
 * Caminho público da imagem, ou `null` quando o `desenho` é um id de SVG.
 * O nome é sanitizado: só o último trecho conta, para que um dado malformado
 * não vire caminho relativo.
 */
export function srcDaPlantaEmImagem(desenho: string): string | null {
  if (!ehPlantaEmImagem(desenho)) return null
  const nome = desenho.slice(PREFIXO_IMAGEM.length).trim().split('/').pop()
  if (!nome) return null
  return `/img/${ID_ATIVO}/${nome}.webp`
}

export type EstadoDaFolha = 'vazia' | 'carregando' | 'pronta' | 'erro'

/**
 * Dimensões da folha, no mesmo contrato que `DesenhoSpec` entrega para o SVG
 * (lá em centímetros, aqui em pixels da imagem). O que o visualizador faz com
 * elas — ajustar à tela, centralizar, limitar o zoom — é idêntico nos dois casos.
 */
export interface FolhaDeImagem {
  largura: number
  altura: number
  estado: EstadoDaFolha
}

const VAZIA: FolhaDeImagem = { largura: 0, altura: 0, estado: 'vazia' }
const CARREGANDO: FolhaDeImagem = { largura: 0, altura: 0, estado: 'carregando' }
const ERRO: FolhaDeImagem = { largura: 0, altura: 0, estado: 'erro' }

/**
 * Mede a imagem antes de desenhá-la. O "ajustar à tela" precisa da proporção
 * real da folha — as três plantas do Flat Premium II não têm a mesma, uma é
 * paisagem e duas são retrato — e a proporção só existe depois do load.
 */
export function useFolhaDeImagem(src: string | null): FolhaDeImagem {
  const [medida, setMedida] = useState<{ src: string; largura: number; altura: number } | null>(
    null,
  )
  const [falhou, setFalhou] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return
    let vivo = true
    const img = new Image()
    img.src = src

    // `decode()` e não `load`: estas plantas são webp sem perdas de vários
    // megapixels, e entre o load e o primeiro quadro pintado cabe meio segundo
    // de tela em branco. Esperar a decodificação mantém o aviso de carregamento
    // no ar até a folha poder realmente aparecer.
    const aplicar = () => {
      if (vivo) setMedida({ src, largura: img.naturalWidth, altura: img.naturalHeight })
    }
    const falhar = () => {
      // decode() recusa em casos que o load resolveu bem; a imagem completa
      // manda mais que a promessa.
      if (!vivo) return
      if (img.complete && img.naturalWidth > 0) aplicar()
      else setFalhou(src)
    }

    if (typeof img.decode === 'function') img.decode().then(aplicar, falhar)
    else {
      img.onload = aplicar
      img.onerror = falhar
    }

    return () => {
      vivo = false
    }
  }, [src])

  // A medida é sempre conferida contra o `src` pedido: ao paginar, a folha
  // anterior não pode ditar o enquadramento da próxima.
  return useMemo(() => {
    if (!src) return VAZIA
    if (medida && medida.src === src)
      return { largura: medida.largura, altura: medida.altura, estado: 'pronta' as const }
    if (falhou === src) return ERRO
    return CARREGANDO
  }, [src, medida, falhou])
}

/** Aquece o cache do navegador para que paginar não espere download nem decode. */
export function preencherCache(srcs: string[]): void {
  for (const src of srcs) {
    const img = new Image()
    img.src = src
    img.decode?.().catch(() => {})
  }
}
