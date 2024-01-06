CREATE TABLE IF NOT EXISTS "url_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_url_id" varchar(100),
	"original_url" text,
	"creation_date" date,
	"expiry_date" date
);
