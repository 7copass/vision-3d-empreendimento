/** Rótulos, cores de status e classes compartilhadas. Sem componentes aqui. */
import type { Orientacao, UnitStatus } from '../core/types'

export const ROTULO_STATUS: Record<UnitStatus, string> = {
  disponivel: 'Disponível',
  reservada: 'Reservada',
  vendida: 'Vendida',
}

/** Classe de fundo da pastilha/selo por status. */
export const FUNDO_STATUS: Record<UnitStatus, string> = {
  disponivel: 'bg-disponivel',
  reservada: 'bg-reservada',
  vendida: 'bg-vendida',
}

export const STATUS_ORDEM: UnitStatus[] = ['disponivel', 'reservada', 'vendida']

export const ROTULO_ORIENTACAO: Record<Orientacao, string> = {
  norte: 'Norte',
  leste: 'Leste',
  sul: 'Sul',
  oeste: 'Oeste',
}

export const ORIENTACAO_ORDEM: Orientacao[] = ['norte', 'leste', 'sul', 'oeste']

/**
 * Slider de vidro. `appearance-none` apaga o thumb nativo, então ele é
 * redesenhado aqui — classes literais para o scanner do Tailwind achar.
 */
export const CLASSE_SLIDER = [
  'h-1 w-full cursor-pointer appearance-none rounded-full bg-areia-200/20',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5',
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-areia-100',
  '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/40',
  '[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-areia-100',
].join(' ')
