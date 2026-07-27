import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as authSchema from '../../database/auth-schema';
import * as appSchema from '../../database/schema';
import { generationRequests } from '../../database/schema';
import { NotFoundError } from '../../common/errors/domain-error';
import { DRIZZLE } from '../database/database.module';
import { StudyMaterialKind } from './shapes';

export interface ReportOptions {
  type: 'summary' | 'detailed' | 'academic' | 'executive';
  tone: 'formal' | 'conversational' | 'technical' | 'journalistic';
  length: 'short' | 'medium' | 'long' | 'comprehensive' | 'custom';
  sectionCount: number;
  includeSummary: boolean;
  includeCitations: boolean;
  sections?: string[];
}

export interface StartGenerationInput {
  kind: StudyMaterialKind;
  brief: string;
  sourceIds: string[];
  folderId?: string | null;
  model?: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardStyle?: 'qa' | 'definition' | 'cloze' | 'mixed';
  reportOptions?: ReportOptions;
  roadmapOptions?: {
    phaseCount: number;
    detailLevel: 'basic' | 'detailed';
    includeTimeEstimates: boolean;
    includeResources: boolean;
  };
  slideDeckOptions?: {
    slideCount: number;
    style: 'concise' | 'detailed' | 'storytelling';
    audience: 'beginner' | 'intermediate' | 'expert';
    includeSpeakerNotes: boolean;
  };
  mindMapOptions?: {
    nodeCount: number;
    structure: 'radial' | 'hierarchical' | 'organic';
    colorGroups: boolean;
    crossLinks: boolean;
  };
}

@Injectable()
export class GenerationRequestManager {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof authSchema & typeof appSchema>,
  ) {}

  async create(
    _userId: string,
    notebookId: string,
    input: StartGenerationInput,
  ): Promise<string> {
    const [request] = await this.db
      .insert(generationRequests)
      .values({
        notebookId,
        kind: input.kind,
        brief: input.brief,
        sourceIds: input.sourceIds,
        targetFolderId: input.folderId ?? null,
        status: 'streaming',
      })
      .returning();
    return request.id;
  }

  async markCompleted(requestId: string, _materialId?: string): Promise<void> {
    await this.db
      .update(generationRequests)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(generationRequests.id, requestId));
  }

  async markFailed(requestId: string, _error?: string): Promise<void> {
    await this.db
      .update(generationRequests)
      .set({ status: 'failed' })
      .where(eq(generationRequests.id, requestId));
  }

  async cancel(_userId: string, requestId: string): Promise<void> {
    const [request] = await this.db
      .select({ status: generationRequests.status })
      .from(generationRequests)
      .where(eq(generationRequests.id, requestId));
    if (!request) {
      throw new NotFoundError('Generation request');
    }
    if (request.status === 'streaming') {
      await this.db
        .update(generationRequests)
        .set({ status: 'cancelled' })
        .where(eq(generationRequests.id, requestId));
    }
  }

  async get(requestId: string) {
    const [request] = await this.db
      .select()
      .from(generationRequests)
      .where(eq(generationRequests.id, requestId));
    return request;
  }
}
