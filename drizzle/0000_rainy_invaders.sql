CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"avatar_seed" text NOT NULL,
	"is_guest" boolean DEFAULT true NOT NULL,
	"google_sub" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actors_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "channel_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" uuid NOT NULL,
	"channel_id" text NOT NULL,
	"sender_seat_no" integer NOT NULL,
	"sender_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"event_type" text NOT NULL,
	"message" text NOT NULL,
	"visible_to_seat_nos" jsonb NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"cartridge_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"state" jsonb NOT NULL,
	"phase_deadline_at" timestamp,
	"winning_faction" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"host_actor_id" uuid NOT NULL,
	"cartridge_id" text DEFAULT 'werewolf' NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"config" jsonb NOT NULL,
	"active_match_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"seat_no" integer NOT NULL,
	"actor_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_seed" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"connected" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_actor_id_actors_id_fk" FOREIGN KEY ("host_actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channel_messages_match_id_id_idx" ON "channel_messages" USING btree ("match_id","id");--> statement-breakpoint
CREATE INDEX "match_events_match_id_id_idx" ON "match_events" USING btree ("match_id","id");--> statement-breakpoint
CREATE INDEX "matches_room_id_idx" ON "matches" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seats_room_seat_no_idx" ON "seats" USING btree ("room_id","seat_no");--> statement-breakpoint
CREATE UNIQUE INDEX "seats_room_actor_idx" ON "seats" USING btree ("room_id","actor_id");