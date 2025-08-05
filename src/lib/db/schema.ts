import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: text("user_id"),
  pdfUrl: text("pdf_url"),
  jpgUrl: text("jpg_url"),
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  metadata: jsonb("metadata"),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
