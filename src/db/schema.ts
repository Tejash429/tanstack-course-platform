import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  index,
  integer,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const PREFIX = "app";

const tableCreator = pgTableCreator((name) => `${PREFIX}_${name}`);

export const users = tableCreator("user", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  isPremium: boolean("isPremium").notNull().default(false),
  isAdmin: boolean("isAdmin").notNull().default(false),
});

export const accounts = tableCreator(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleId: text("googleId").unique(),
  },
  (table) => [index("user_id_google_id_idx").on(table.userId, table.googleId)]
);

export const profiles = tableCreator("profile", {
  id: serial("id").primaryKey(),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  displayName: text("displayName"),
  imageId: text("imageId"),
  image: text("image"),
  bio: text("bio").notNull().default(""),
});

export const sessions = tableCreator(
  "session",
  {
    id: text("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const modules = tableCreator("module", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const segments = tableCreator(
  "segment",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    order: integer("order").notNull(),
    length: text("length"),
    isPremium: boolean("isPremium").notNull().default(false),
    moduleId: serial("moduleId")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    videoKey: text("videoKey"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("segments_slug_idx").on(table.slug)]
);

export const comments = tableCreator("comment", {
  id: serial("id").primaryKey(),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  segmentId: serial("segmentId")
    .notNull()
    .references(() => segments.id, {
      onDelete: "cascade",
    }),
  parentId: integer("parentId").references((): AnyPgColumn => comments.id, {
    onDelete: "cascade",
  }),
  repliedToId: integer("repliedToId").references((): AnyPgColumn => users.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const progress = tableCreator(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    segmentId: serial("segmentId").references(() => segments.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("progress_user_segment_unique_idx").on(
      table.userId,
      table.segmentId
    ),
  ]
);

export const testimonials = tableCreator("testimonial", {
  id: serial("id").primaryKey(),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  emojis: text("emojis").notNull(),
  displayName: text("displayName").notNull(),
  permissionGranted: boolean("permissionGranted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attachments = tableCreator("attachment", {
  id: serial("id").primaryKey(),
  segmentId: serial("segmentId")
    .notNull()
    .references(() => segments.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  fileKey: text("fileKey").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const modulesRelations = relations(modules, ({ many }) => ({
  segments: many(segments),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  profile: one(profiles, {
    fields: [testimonials.userId],
    references: [profiles.userId],
  }),
}));

export const segmentsRelations = relations(segments, ({ one, many }) => ({
  attachments: many(attachments),
  module: one(modules, {
    fields: [segments.moduleId],
    references: [modules.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [comments.userId],
    references: [profiles.userId],
  }),
  segment: one(segments, {
    fields: [comments.segmentId],
    references: [segments.id],
  }),
  parent: one(comments, {
    relationName: "parent",
    fields: [comments.parentId],
    references: [comments.id],
  }),
  children: many(comments, {
    relationName: "parent",
  }),
  repliedToProfile: one(profiles, {
    fields: [comments.repliedToId],
    references: [profiles.userId],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  segment: one(segments, {
    fields: [attachments.segmentId],
    references: [segments.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Segment = typeof segments.$inferSelect;
export type SegmentCreate = typeof segments.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type AttachmentCreate = typeof attachments.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type ProgressCreate = typeof progress.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type ModuleCreate = typeof modules.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type TestimonialCreate = typeof testimonials.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type CommentCreate = typeof comments.$inferInsert;
