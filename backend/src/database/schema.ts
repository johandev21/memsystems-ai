import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
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
  vector,
} from 'drizzle-orm/pg-core';

import { user } from './auth-schema';

export const sourceKindEnum = pgEnum('source_kind', ['text', 'url', 'file']);

export const studyMaterialKindEnum = pgEnum('study_material_kind', [
  'quiz',
  'simple_flashcard',
  'report',
  'roadmap',
  'slide_deck',
  'mind_map',
]);

export const generationStatusEnum = pgEnum('generation_status', [
  'streaming',
  'completed',
  'failed',
  'cancelled',
]);

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant']);

export const notebooks = pgTable(
  'notebooks',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: varchar('description', { length: 500 }).default('').notNull(),
    icon: varchar('icon', { length: 50 }).default('notebook').notNull(),
    banner: varchar('banner', { length: 2000 }),
    bannerFocalPoint: jsonb('banner_focal_point').$type<{
      x: number;
      y: number;
    } | null>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('notebooks_user_id_idx').on(table.userId)],
);

export const sources = pgTable(
  'sources',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    kind: sourceKindEnum('kind').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    rawText: text('raw_text').notNull(),
    url: text('url'),
    s3Key: varchar('s3_key', { length: 1000 }),
    contentType: varchar('content_type', { length: 200 }),
    fileSize: integer('file_size'),
    sha256: varchar('sha256', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sources_notebook_id_idx').on(table.notebookId),
    index('sources_kind_idx').on(table.kind),
  ],
);

export const studyMaterialFolders = pgTable(
  'study_material_folders',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    parentId: varchar('parent_id').references(
      (): any => studyMaterialFolders.id,
      { onDelete: 'cascade' },
    ),
    name: varchar('name', { length: 200 }).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('study_material_folders_notebook_id_idx').on(table.notebookId),
    index('study_material_folders_parent_id_idx').on(table.parentId),
    index('study_material_folders_deleted_at_idx').on(table.deletedAt),
  ],
);

export const studyMaterials = pgTable(
  'study_materials',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    kind: studyMaterialKindEnum('kind').notNull(),
    title: varchar('title', { length: 200 }).notNull().default('Untitled'),
    folderId: varchar('folder_id').references(() => studyMaterialFolders.id, {
      onDelete: 'set null',
    }),
    content: jsonb('content').notNull(),
    options: jsonb('options').$type<Record<string, unknown> | null>(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('study_materials_notebook_id_idx').on(table.notebookId),
    index('study_materials_kind_idx').on(table.kind),
    index('study_materials_title_idx').on(table.title),
    index('study_materials_folder_id_idx').on(table.folderId),
    index('study_materials_deleted_at_idx').on(table.deletedAt),
  ],
);

export const generationRequests = pgTable(
  'generation_requests',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    kind: studyMaterialKindEnum('kind').notNull(),
    brief: text('brief').notNull().default(''),
    sourceIds: jsonb('source_ids').$type<string[]>().notNull().default([]),
    targetFolderId: varchar('target_folder_id').references(
      () => studyMaterialFolders.id,
      { onDelete: 'set null' },
    ),
    status: generationStatusEnum('status').notNull().default('streaming'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('generation_requests_notebook_id_idx').on(table.notebookId),
    index('generation_requests_target_folder_id_idx').on(table.targetFolderId),
  ],
);

export const notebookChatMessages = pgTable(
  'notebook_chat_messages',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    role: chatRoleEnum('role').notNull(),
    content: text('content').notNull(),
    reasoning: text('reasoning'),
    citedSourceIds:
      jsonb('cited_source_ids').$type<
        { sourceId: string; number: number; quote: string | null }[]
      >(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notebook_chat_messages_notebook_id_idx').on(table.notebookId),
    index('notebook_chat_messages_created_at_idx').on(table.createdAt),
  ],
);

export const sourceChunks = pgTable(
  'source_chunks',
  {
    id: varchar('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    sourceId: varchar('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    notebookId: varchar('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('source_chunks_source_id_chunk_index_idx').on(
      table.sourceId,
      table.chunkIndex,
    ),
    index('source_chunks_notebook_id_idx').on(table.notebookId),
    index('source_chunks_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  ],
);

export const notebooksRelations = relations(notebooks, ({ many }) => ({
  sources: many(sources),
  sourceChunks: many(sourceChunks),
  studyMaterials: many(studyMaterials),
  studyMaterialFolders: many(studyMaterialFolders),
  chatMessages: many(notebookChatMessages),
  generationRequests: many(generationRequests),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  notebook: one(notebooks, {
    fields: [sources.notebookId],
    references: [notebooks.id],
  }),
  chunks: many(sourceChunks),
}));

export const sourceChunksRelations = relations(sourceChunks, ({ one }) => ({
  source: one(sources, {
    fields: [sourceChunks.sourceId],
    references: [sources.id],
  }),
  notebook: one(notebooks, {
    fields: [sourceChunks.notebookId],
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
      relationName: 'folderHierarchy',
    }),
    children: many(studyMaterialFolders, { relationName: 'folderHierarchy' }),
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

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  openaiApiKey: text('openai_api_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const table = {
  notebooks,
  sources,
  sourceChunks,
  studyMaterials,
  studyMaterialFolders,
  generationRequests,
  notebookChatMessages,
  userSettings,
} as const;

export type Table = typeof table;
