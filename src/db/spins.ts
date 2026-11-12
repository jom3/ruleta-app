import { asc, desc, eq } from 'drizzle-orm'
import { db } from './client'
import { elements } from './schema/elements'
import { spins } from './schema/spins'
import { variants } from './schema/variants'
import {
  computeProbabilities,
  drawWeighted,
  MIN_ELEMENTS_TO_SPIN,
  pickVariant,
  type SpinResult,
} from '../lib/spin'

export type SpinRecord = {
  id: string
  createdAt: Date
}

export async function getRecentElementIds(categoryId: string): Promise<string[]> {
  const rows = await db
    .select({ elementId: spins.elementId })
    .from(spins)
    .where(eq(spins.categoryId, categoryId))
    .orderBy(desc(spins.createdAt))
    .limit(2)

  return rows.map((row) => row.elementId)
}

export async function recordSpin(input: {
  categoryId: string
  elementId: string
  variantId: string | null
}): Promise<SpinRecord> {
  const [spin] = await db
    .insert(spins)
    .values(input)
    .returning({ id: spins.id, createdAt: spins.createdAt })

  return spin
}

export async function resolveSpin(
  categoryId: string,
  rng: () => number = Math.random,
): Promise<SpinResult | 'not-enough-elements'> {
  const rows = await db
    .select({
      elementId: elements.id,
      elementName: elements.name,
      variantId: variants.id,
      variantName: variants.name,
    })
    .from(elements)
    .leftJoin(variants, eq(variants.elementId, elements.id))
    .where(eq(elements.categoryId, categoryId))
    .orderBy(asc(elements.nameKey), asc(variants.nameKey))

  const elementsById = new Map<string, { id: string; name: string }>()
  const variantsByElement = new Map<string, { id: string; name: string }[]>()

  for (const row of rows) {
    elementsById.set(row.elementId, { id: row.elementId, name: row.elementName })

    const list = variantsByElement.get(row.elementId) ?? []
    if (row.variantId && row.variantName) list.push({ id: row.variantId, name: row.variantName })
    variantsByElement.set(row.elementId, list)
  }

  const elementIds = [...elementsById.keys()]
  if (elementIds.length < MIN_ELEMENTS_TO_SPIN) return 'not-enough-elements'

  const recentElementIds = await getRecentElementIds(categoryId)
  const entries = computeProbabilities(elementIds, recentElementIds)
  const elementId = drawWeighted(entries, rng)

  const variantOptions = variantsByElement.get(elementId) ?? []
  const variantId = pickVariant(variantOptions.map((variant) => variant.id), rng)
  const variant = variantOptions.find((option) => option.id === variantId) ?? null

  const spin = await recordSpin({ categoryId, elementId, variantId })

  return { spinId: spin.id, element: elementsById.get(elementId)!, variant }
}
