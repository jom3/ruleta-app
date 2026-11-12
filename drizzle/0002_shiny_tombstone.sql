CREATE TABLE "elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"element_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "elements" ADD CONSTRAINT "elements_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_element_id_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "elements_category_name_key_idx" ON "elements" USING btree ("category_id","name_key");--> statement-breakpoint
CREATE INDEX "elements_category_id_idx" ON "elements" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_element_name_key_idx" ON "variants" USING btree ("element_id","name_key");--> statement-breakpoint
CREATE INDEX "variants_element_id_idx" ON "variants" USING btree ("element_id");