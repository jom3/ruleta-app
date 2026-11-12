export const MAX_NAME_LENGTH = 40

// Nombre tal como se muestra: sin bordes y con un solo espacio entre palabras.
export function displayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

// Clave de unicidad: el nombre mostrado en minúsculas.
export function normalizeName(raw: string): string {
  return displayName(raw).toLowerCase()
}

export function nameError(raw: string): string | null {
  const name = displayName(raw)

  if (name === '') return 'Escribe un nombre.'
  if (name.length > MAX_NAME_LENGTH) return `Máximo ${MAX_NAME_LENGTH} caracteres.`

  return null
}
