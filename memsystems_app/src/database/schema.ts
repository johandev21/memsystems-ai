import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const sourceKindEnum = pgEnum("source_kind", ["text", "url", "file"]);

export const studyMaterialKindEnum = pgEnum("study_material_kind", [
  "quiz",
  "simple_flashcard",
  "report",
  "roadmap",
  "slide_deck",
  "mind_map",
]);

export const generationStatusEnum = pgEnum("generation_status", [
  "streaming",
  "completed",
  "failed",
  "cancelled",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const cardStateEnum = pgEnum("card_state", [
  "new",
  "learning",
  "review",
]);

export const providerEnum = pgEnum("provider", [
  "openai",
  "anthropic",
  "google",
  "deepseek",
]);

export const notebooks = pgTable(
  "notebooks",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: varchar("description", { length: 500 }).default("").notNull(),
    icon: varchar("icon", { length: 50 }).default("notebook").notNull(),
    banner: varchar("banner", { length: 2000 }),
    bannerFocalPoint: jsonb("banner_focal_point").$type<{
      x: number;
      y: number;
    } | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notebooks_user_id_idx").on(table.userId)],
);

export const sources = pgTable(
  "sources",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    kind: sourceKindEnum("kind").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    rawText: text("raw_text").notNull(),
    url: text("url"),
    s3Key: varchar("s3_key", { length: 1000 }),
    contentType: varchar("content_type", { length: 200 }),
    fileSize: integer("file_size"),
    sha256: varchar("sha256", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sources_notebook_id_idx").on(table.notebookId),
    index("sources_kind_idx").on(table.kind),
  ],
);

export const studyMaterials = pgTable(
  "study_materials",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    kind: studyMaterialKindEnum("kind").notNull(),
    title: varchar("title", { length: 200 }).notNull().default("Untitled"),
    folderId: varchar("folder_id").references(() => studyMaterialFolders.id, {
      onDelete: "set null",
    }),
    content: jsonb("content").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("study_materials_notebook_id_idx").on(table.notebookId),
    index("study_materials_kind_idx").on(table.kind),
    index("study_materials_title_idx").on(table.title),
    index("study_materials_folder_id_idx").on(table.folderId),
    index("study_materials_deleted_at_idx").on(table.deletedAt),
  ],
);

export const studyMaterialFolders = pgTable(
  "study_material_folders",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    parentId: varchar("parent_id").references(
      (): any => studyMaterialFolders.id,
      { onDelete: "cascade" },
    ),
    name: varchar("name", { length: 200 }).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("study_material_folders_notebook_id_idx").on(table.notebookId),
    index("study_material_folders_parent_id_idx").on(table.parentId),
    index("study_material_folders_deleted_at_idx").on(table.deletedAt),
  ],
);

export const generationRequests = pgTable(
  "generation_requests",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    kind: studyMaterialKindEnum("kind").notNull(),
    brief: text("brief").notNull().default(""),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull().default([]),
    targetFolderId: varchar("target_folder_id").references(
      () => studyMaterialFolders.id,
      { onDelete: "set null" },
    ),
    status: generationStatusEnum("status").notNull().default("streaming"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("generation_requests_notebook_id_idx").on(table.notebookId),
    index("generation_requests_target_folder_id_idx").on(table.targetFolderId),
  ],
);

export const notebookChatMessages = pgTable(
  "notebook_chat_messages",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    citedSourceIds: jsonb("cited_source_ids").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notebook_chat_messages_notebook_id_idx").on(table.notebookId),
    index("notebook_chat_messages_created_at_idx").on(table.createdAt),
  ],
);

export const noteTypes = pgTable(
  "note_types",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    fieldsSchema: jsonb("fields_schema").notNull(),
    cardTemplates: jsonb("card_templates").notNull(),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("note_types_user_id_idx").on(table.userId),
    uniqueIndex("note_types_user_name_uq").on(table.userId, table.name),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    noteTypeId: varchar("note_type_id")
      .notNull()
      .references(() => noteTypes.id, { onDelete: "cascade" }),
    fieldValues: jsonb("field_values").notNull(),
    originSimpleFlashcardId: varchar("origin_simple_flashcard_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notes_user_id_idx").on(table.userId),
    index("notes_note_type_id_idx").on(table.noteTypeId),
  ],
);

export const cards = pgTable(
  "cards",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    noteId: varchar("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    templateIndex: integer("template_index").notNull(),
    state: cardStateEnum("state").notNull().default("new"),
    suspended: boolean("suspended").notNull().default(false),
    easinessFactor: real("easiness_factor").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    dueAt: timestamp("due_at").notNull().defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at"),
    lastQuality: integer("last_quality"),
    lapses: integer("lapses").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cards_note_id_idx").on(table.noteId),
    index("cards_due_at_idx").on(table.dueAt),
    index("cards_state_idx").on(table.state),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_name_uq").on(table.userId, table.name),
  ],
);

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: varchar("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: varchar("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.tagId] }),
    index("note_tags_tag_id_idx").on(table.tagId),
  ],
);

export const providerKeys = pgTable(
  "provider_keys",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (table) => [
    index("provider_keys_user_id_idx").on(table.userId),
    uniqueIndex("provider_keys_user_provider_uq").on(
      table.userId,
      table.provider,
    ),
  ],
);

export const notebooksRelations = relations(notebooks, ({ many }) => ({
  sources: many(sources),
  studyMaterials: many(studyMaterials),
  studyMaterialFolders: many(studyMaterialFolders),
  chatMessages: many(notebookChatMessages),
  generationRequests: many(generationRequests),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  notebook: one(notebooks, {
    fields: [sources.notebookId],
    references: [notebooks.id],
  }),
}));

export const studyMaterialsRelations = relations(studyMaterials, ({ one }) => ({
  notebook: one(notebooks, {
    fields: [studyMaterials.notebookId],
    references: [notebooks.id],
  }),
  folder: one(studyMaterialFolders, {
    fields: [studyMaterials.folderId],
    references: [studyMaterialFolders.id],
  }),
}));

export const studyMaterialFoldersRelations = relations(
  studyMaterialFolders,
  ({ one, many }) => ({
    notebook: one(notebooks, {
      fields: [studyMaterialFolders.notebookId],
      references: [notebooks.id],
    }),
    parent: one(studyMaterialFolders, {
      fields: [studyMaterialFolders.parentId],
      references: [studyMaterialFolders.id],
      relationName: "folderHierarchy",
    }),
    children: many(studyMaterialFolders, { relationName: "folderHierarchy" }),
    studyMaterials: many(studyMaterials),
  }),
);

export const generationRequestsRelations = relations(
  generationRequests,
  ({ one }) => ({
    notebook: one(notebooks, {
      fields: [generationRequests.notebookId],
      references: [notebooks.id],
    }),
  }),
);

export const notebookChatMessagesRelations = relations(
  notebookChatMessages,
  ({ one }) => ({
    notebook: one(notebooks, {
      fields: [notebookChatMessages.notebookId],
      references: [notebooks.id],
    }),
  }),
);

export const noteTypesRelations = relations(noteTypes, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  noteType: one(noteTypes, {
    fields: [notes.noteTypeId],
    references: [noteTypes.id],
  }),
  cards: many(cards),
  noteTags: many(noteTags),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  note: one(notes, {
    fields: [cards.noteId],
    references: [notes.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [noteTags.tagId],
    references: [tags.id],
  }),
}));

export const table = {
  notebooks,
  sources,
  studyMaterials,
  studyMaterialFolders,
  generationRequests,
  notebookChatMessages,
  noteTypes,
  notes,
  cards,
  tags,
  noteTags,
  providerKeys,
} as const;

export type Table = typeof table;
