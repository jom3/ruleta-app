import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { categories } from './categories'
import { elements } from './elements'
import { variants } from './variants'

export const spins = pgTable('spins', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  elementId: uuid('element_id').notNull().references(() => elements.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('spins_category_created_idx').on(table.categoryId, table.createdAt.desc()),
])
