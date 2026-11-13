export type WheelElement = { id: string; name: string }

// La rueda comparte geometría entre el render del servidor y el redibujado
// del cliente para que ambos produzcan el mismo SVG.
export const WHEEL_COLORS = [
  { fill: 'var(--wheel-1)', ink: 'var(--wheel-1-ink)' },
  { fill: 'var(--wheel-2)', ink: 'var(--wheel-2-ink)' },
  { fill: 'var(--wheel-3)', ink: 'var(--wheel-3-ink)' },
  { fill: 'var(--wheel-4)', ink: 'var(--wheel-4-ink)' },
  { fill: 'var(--wheel-5)', ink: 'var(--wheel-5-ink)' },
  { fill: 'var(--wheel-6)', ink: 'var(--wheel-6-ink)' },
] as const

export function pointAt(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180
  return { x: 100 + radius * Math.sin(radians), y: 100 - radius * Math.cos(radians) }
}

export function segmentPath(index: number, step: number): string {
  // Con un solo elemento el sector es la rueda completa: dos arcos de 180°.
  if (step >= 360) {
    return 'M 100 0 A 100 100 0 1 1 100 200 A 100 100 0 1 1 100 0 Z'
  }

  // El centro del sector mira hacia arriba en index 0, que es donde apunta el puntero.
  const start = pointAt(index * step - step / 2, 100)
  const end = pointAt(index * step + step / 2, 100)
  const largeArc = step > 180 ? 1 : 0

  return `M 100 100 L ${start.x} ${start.y} A 100 100 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

export function labelAt(index: number, step: number): { x: number; y: number } {
  return pointAt(index * step, 63)
}

// En la mitad izquierda se gira la etiqueta 180° para que no quede cabeza abajo.
export function labelRotation(angle: number): number {
  return angle > 90 && angle < 270 ? angle + 180 : angle
}

export function labelSize(count: number): number {
  if (count > 18) return 5.5
  if (count > 12) return 6.5
  if (count > 8) return 7.5
  if (count > 4) return 9
  return 10.5
}

export function shortLabel(name: string): string {
  return name.length > 12 ? `${name.slice(0, 11)}…` : name
}

export function wheelColor(index: number): (typeof WHEEL_COLORS)[number] {
  return WHEEL_COLORS[index % WHEEL_COLORS.length]!
}
