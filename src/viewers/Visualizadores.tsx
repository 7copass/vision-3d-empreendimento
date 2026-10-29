/**
 * Porta de entrada dos visualizadores 2D. Monta-se por cima da cena 3D e
 * mostra o visualizador correspondente ao `modo` do store. Nos modos
 * 'orbita', 'unidade' e 'vista' não renderiza nada.
 */
import { AnimatePresence } from 'framer-motion'
import { useTour } from '../core/store'
import { Galeria } from './Galeria'
import { VisualizadorPlantas } from './VisualizadorPlantas'
import { Filme } from './Filme'
import { MapaDistancias } from './MapaDistancias'

export function Visualizadores() {
  const modo = useTour((s) => s.modo)

  return (
    <AnimatePresence mode="wait">
      {modo === 'galeria' && <Galeria key="galeria" />}
      {modo === 'plantas' && <VisualizadorPlantas key="plantas" />}
      {modo === 'filme' && <Filme key="filme" />}
      {modo === 'mapa' && <MapaDistancias key="mapa" />}
    </AnimatePresence>
  )
}
