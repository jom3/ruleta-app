CREATE TABLE "spins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"element_id" uuid NOT NULL,
	"variant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spins" ADD CONSTRAINT "spins_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spins" ADD CONSTRAINT "spins_element_id_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spins" ADD CONSTRAINT "spins_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spins_category_created_idx" ON "spins" USING btree ("category_id","created_at" DESC NULLS LAST);