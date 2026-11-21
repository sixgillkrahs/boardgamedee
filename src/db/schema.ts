import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const actors = pgTable("actors", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  isGuest: boolean("is_guest").default(true).notNull(),
  googleSub: text("google_sub").unique(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  hostActorId: uuid("host_actor_id")
    .notNull()
    .references(() => actors.id),
  cartridgeId: text("cartridge_id").notNull().default("werewolf"),
  status: text("status").notNull().default("lobby"), // 'lobby' | 'in_match' | 'closed'
  config: jsonb("config").notNull(),
  activeMatchId: uuid("active_match_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    seatNo: integer("seat_no").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    displayName: text("display_name").notNull(),
    avatarSeed: text("avatar_seed").notNull(),
    isBot: boolean("is_bot").default(false).notNull(),
    connected: boolean("connected").default(true).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("seats_room_seat_no_idx").on(table.roomId, table.seatNo),
    uniqueIndex("seats_room_actor_idx").on(table.roomId, table.actorId),
  ]
);

export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  cartridgeId: text("cartridge_id").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'finished'
  version: integer("version").notNull().default(1),
  state: jsonb("state").notNull(),
  phaseDeadlineAt: timestamp("phase_deadline_at"),
  winningFaction: text("winning_faction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const matchEvents = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  visibleToSeatNos: jsonb("visible_to_seat_nos").notNull(), // 'all' | number[]
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelMessages = pgTable("channel_messages", {
  id: serial("id").primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(), // 'village' | 'werewolf' | 'graveyard'
  senderSeatNo: integer("sender_seat_no").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
