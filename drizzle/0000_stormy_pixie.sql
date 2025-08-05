CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"user_id" text,
	"pdf_url" text,
	"jpg_url" text,
	"filename" text NOT NULL,
	"file_size" integer,
	"metadata" jsonb
);
