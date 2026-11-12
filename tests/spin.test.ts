import { describe, expect, it } from 'vitest'
import {
  computeProbabilities,
  drawWeighted,
  LAST_SPIN_FACTOR,
  MIN_ELEMENTS_TO_SPIN,
  pickVariant,
  PREVIOUS_SPIN_FACTOR,
} from '../src/lib/spin'

const TEN_ELEMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

function probabilityOf(entries: ReturnType<typeof computeProbabilities>, id: string): number {
  return entries.find((entry) => entry.id === id)!.probability
}

function weightOf(entries: ReturnType<typeof computeProbabilities>, id: string): number {
  return entries.find((entry) => entry.id === id)!.weight
}

describe('computeProbabilities', () => {
  it('applies 1/10, 1/2 and 1 to ten elements with two different spins', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['a', 'b'])

    expect(probabilityOf(entries, 'a')).toBeCloseTo(1 / 86, 10)
    expect(probabilityOf(entries, 'b')).toBeCloseTo(5 / 86, 10)
    expect(probabilityOf(entries, 'c')).toBeCloseTo(10 / 86, 10)
    expect(weightOf(entries, 'b')).toBe(PREVIOUS_SPIN_FACTOR)
  })

  it('keeps the percentages around 1 %, 6 % and 12 %', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['a', 'b'])

    expect(probabilityOf(entries, 'a') * 100).toBeCloseTo(1.16, 1)
    expect(probabilityOf(entries, 'b') * 100).toBeCloseTo(5.81, 1)
    expect(probabilityOf(entries, 'c') * 100).toBeCloseTo(11.63, 1)
  })

  it('does not multiply 1/10 by 1/2 when the same element is the last two spins', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['a', 'a'])

    expect(weightOf(entries, 'a')).toBe(LAST_SPIN_FACTOR)
  })

  it('applies only 1/10 with a single spin in the history', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['a'])

    expect(weightOf(entries, 'a')).toBe(LAST_SPIN_FACTOR)
    expect(weightOf(entries, 'b')).toBe(1)
  })

  it('returns only positive probabilities that sum 1', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['a', 'b'])
    const sum = entries.reduce((total, entry) => total + entry.probability, 0)

    expect(sum).toBeCloseTo(1, 9)
    for (const entry of entries) expect(entry.probability).toBeGreaterThan(0)
  })

  it('ignores history entries that are not in the category', () => {
    const entries = computeProbabilities(TEN_ELEMENTS, ['x', 'y'])

    for (const entry of entries) expect(entry.probability).toBeCloseTo(1 / 10, 10)
  })

  it('uses 1/6 and 5/6 when the category has two elements', () => {
    const entries = computeProbabilities(['a', 'b'], ['a', 'b'])

    expect(probabilityOf(entries, 'a')).toBeCloseTo(1 / 6, 10)
    expect(probabilityOf(entries, 'b')).toBeCloseTo(5 / 6, 10)
  })

  it('assigns the same probability when there is no history', () => {
    const entries = computeProbabilities(['a', 'b', 'c', 'd'], [])

    for (const entry of entries) expect(entry.probability).toBeCloseTo(0.25, 10)
  })

  it('returns an empty list without elements', () => {
    expect(computeProbabilities([], ['a'])).toEqual([])
  })
})

describe('drawWeighted', () => {
  const entries = computeProbabilities(['a', 'b'], [])

  it('draws the first element when rng is 0', () => {
    expect(drawWeighted(entries, () => 0)).toBe('a')
  })

  it('draws the second element when rng is close to 1', () => {
    expect(drawWeighted(entries, () => 0.999999)).toBe('b')
  })

  it('never returns an element with probability 0', () => {
    const weighted = computeProbabilities(['a', 'b'], ['a'])
    const drawn = new Set(Array.from({ length: 100 }, (_, index) => drawWeighted(weighted, () => index / 100)))

    expect([...drawn].sort()).toEqual(['a', 'b'])
    expect(weighted.every((entry) => entry.probability > 0)).toBe(true)
  })
})

describe('pickVariant', () => {
  const variantIds = ['v1', 'v2', 'v3']

  it('returns null without variants', () => {
    expect(pickVariant([], () => 0)).toBeNull()
  })

  it('returns the first variant with rng 0', () => {
    expect(pickVariant(variantIds, () => 0)).toBe('v1')
  })

  it('returns the last variant with rng close to 1', () => {
    expect(pickVariant(variantIds, () => 0.999999)).toBe('v3')
  })
})

describe('MIN_ELEMENTS_TO_SPIN', () => {
  it('is two', () => {
    expect(MIN_ELEMENTS_TO_SPIN).toBe(2)
  })
})
