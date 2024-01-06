import { pgTable, serial, text, varchar, date } from 'drizzle-orm/pg-core';

export const urlmappings = pgTable('url_mapping', {
    id: serial('id').primaryKey(),
    shortUrlId: varchar('short_url_id', { length: 100 }),
    originalUrl: text('original_url'),
    creationDate: date('creation_date', { mode: "date" }),
    expiryDate: date('expiry_date', { mode: "date" })
});

export type UrlMapping = typeof urlmappings.$inferSelect;
export type NewUrlMapping = typeof urlmappings.$inferInsert;