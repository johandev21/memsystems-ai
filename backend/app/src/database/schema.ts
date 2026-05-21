import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core'

import { createId } from '@paralleldrive/cuid2'

export const posts = pgTable(
    'posts',
    {
        id: varchar('id')
            .$defaultFn(() => createId())
            .primaryKey(),
        title: varchar('title').notNull(),
        content: varchar('content').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    }
)

export const table = {
	posts
} as const

export type Table = typeof table
