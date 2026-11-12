import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { elements } from './elements'

export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  elementId: uuid('element_id').notNull().references(() => elements.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('variants_element_name_key_idx').on(table.elementId, table.nameKey),
  index('variants_element_id_idx').on(table.elementId),
])
