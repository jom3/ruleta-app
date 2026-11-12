export const MIN_ELEMENTS_TO_SPIN = 2
export const LAST_SPIN_FACTOR = 0.1
export const PREVIOUS_SPIN_FACTOR = 0.5

export type Weighted = {
  id: string
  weight: number
  probability: number
}

export type SpinResult = {
  elementId: string
  variantId: string | null
}

// recentElementIds viene del más reciente al más viejo y tiene 0, 1 o 2 ids.
// Si el mismo elemento aparece dos veces manda el factor del último giro.
export function computeProbabilities(
  elementIds: string[],
  recentElementIds: string[],
): Weighted[] {
  if (elementIds.length === 0) return []

  const [lastElementId, previousElementId] = recentElementIds

  const weights = elementIds.map((id) => ({
    id,
    weight:
      id === lastElementId
        ? LAST_SPIN_FACTOR
        : id === previousElementId
          ? PREVIOUS_SPIN_FACTOR
          : 1,
  }))

  const total = weights.reduce((sum, entry) => sum + entry.weight, 0)

  return weights.map((entry) => ({ ...entry, probability: entry.weight / total }))
}

export function drawWeighted(entries: Weighted[], rng: () => number = Math.random): string {
  if (entries.length === 0) throw new Error('No hay elementos para sortear')

  const target = rng()
  let cumulative = 0

  for (const entry of entries) {
    cumulative += entry.probability
    if (target < cumulative) return entry.id
  }

  // rng puede devolver 1 o la suma quedar en 0,999… por redondeo.
  return entries[entries.length - 1]!.id
}

export function pickVariant(variantIds: string[], rng: () => number = Math.random): string | null {
  if (variantIds.length === 0) return null

  const index = Math.min(Math.floor(rng() * variantIds.length), variantIds.length - 1)
  return variantIds[index]!
}
