import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GenerationService } from './generation.service';
import { StudyMaterialKind } from './shapes';
import { StudyMaterialFolderService } from './study-material-folder.service';
import { StudyMaterialService } from './study-material.service';
import { TrashService } from './trash.service';

const createStudyMaterialSchema = z.object({
  kind: z.enum([
    'quiz',
    'simple_flashcard',
    'report',
    'roadmap',
    'slide_deck',
    'mind_map',
  ]),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.unknown(),
  folderId: z.string().optional(),
});

const updateStudyMaterialSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.unknown().optional(),
});

const moveStudyMaterialSchema = z.object({
  folderId: z.string().nullable(),
});

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(200),
  parentId: z.string().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().nullable().optional(),
});

const generateRequestSchema = z.object({
  kind: z.enum([
    'quiz',
    'simple_flashcard',
    'report',
    'roadmap',
    'slide_deck',
    'mind_map',
  ]),
  brief: z.string().default(''),
  sourceIds: z.array(z.string()).default([]),
  folderId: z.string().nullable().optional(),
  model: z.string().optional(),
  questionCount: z.number().min(1).max(50).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

@Controller()
@UseGuards(AuthGuard)
export class StudyMaterialsController {
  constructor(
    private readonly studyMaterialService: StudyMaterialService,
    private readonly folderService: StudyMaterialFolderService,
    private readonly trashService: TrashService,
    private readonly generationService: GenerationService,
  ) {}

  // --- Study Materials ---
  @Get('notebooks/:notebookId/study-materials')
  async listStudyMaterials(
    @CurrentUser('id') userId: string,
    @Param('notebookId') notebookId: string,
    @Query('folderId') folderId?: string,
    @Query('kind') kind?: string,
  ) {
    return this.studyMaterialService.list(userId, notebookId, {
      folderId,
      kind: kind as StudyMaterialKind | undefined,
    });
  }

  @Post('notebooks/:notebookId/study-materials')
  @UsePipes(new ZodValidationPipe(createStudyMaterialSchema))
  async createStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('notebookId') notebookId: string,
    @Body() body: z.infer<typeof createStudyMaterialSchema>,
  ) {
    return this.studyMaterialService.create(userId, notebookId, body);
  }

  @Get('study-materials/:id')
  async getStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.studyMaterialService.get(userId, id);
  }

  @Patch('study-materials/:id')
  @UsePipes(new ZodValidationPipe(updateStudyMaterialSchema))
  async updateStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: z.infer<typeof updateStudyMaterialSchema>,
  ) {
    return this.studyMaterialService.update(userId, id, body);
  }

  @Delete('study-materials/:id')
  async deleteStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.studyMaterialService.delete(userId, id);
  }

  @Post('study-materials/:id/restore')
  async restoreStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.studyMaterialService.restore(userId, id);
  }

  @Delete('study-materials/:id/permanent')
  async permanentDeleteStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.studyMaterialService.permanentDelete(userId, id);
    return { success: true };
  }

  @Post('study-materials/:id/shuffle')
  async shuffleQuiz(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.studyMaterialService.shuffle(userId, id);
  }

  @Patch('study-materials/:id/move')
  @UsePipes(new ZodValidationPipe(moveStudyMaterialSchema))
  async moveStudyMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: z.infer<typeof moveStudyMaterialSchema>,
  ) {
    return this.studyMaterialService.move(userId, id, body);
  }

  // --- Folders ---
  @Get('notebooks/:notebookId/folders')
  async listFolders(
    @CurrentUser('id') userId: string,
    @Param('notebookId') notebookId: string,
  ) {
    return this.folderService.list(userId, notebookId);
  }

  @Post('notebooks/:notebookId/folders')
  @UsePipes(new ZodValidationPipe(createFolderSchema))
  async createFolder(
    @CurrentUser('id') userId: string,
    @Param('notebookId') notebookId: string,
    @Body() body: z.infer<typeof createFolderSchema>,
  ) {
    return this.folderService.create(userId, notebookId, body);
  }

  @Patch('folders/:id')
  @UsePipes(new ZodValidationPipe(updateFolderSchema))
  async updateFolder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: z.infer<typeof updateFolderSchema>,
  ) {
    return this.folderService.update(userId, id, body);
  }

  @Delete('folders/:id')
  async deleteFolder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.folderService.delete(userId, id);
  }

  @Post('folders/:id/restore')
  async restoreFolder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.folderService.restore(userId, id);
  }

  // --- Trash ---
  @Get('notebooks/:notebookId/trash')
  async listTrash(
    @CurrentUser('id') userId: string,
    @Param('notebookId') notebookId: string,
  ) {
    return this.trashService.list(userId, notebookId);
  }

  @Delete('trash/study-materials/:id')
  async hardDeleteTrashMaterial(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.trashService.hardDeleteStudyMaterial(userId, id);
    return { success: true };
  }

  @Delete('trash/folders/:id')
  async hardDeleteTrashFolder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.trashService.hardDeleteFolder(userId, id);
    return { success: true };
  }

  // --- Generation ---
  @Post('notebooks/:id/generate')
  @UsePipes(new ZodValidationPipe(generateRequestSchema))
  async generate(
    @CurrentUser('id') userId: string,
    @Param('id') notebookId: string,
    @Body() body: z.infer<typeof generateRequestSchema>,
    @Res() res: Response,
  ) {
    const { stream, requestId } = await this.generationService.generate(
      userId,
      notebookId,
      body,
    );

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Generation-Request-Id', requestId);

    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) res.write(value);
    }
    res.end();
  }

  @Post('notebooks/:id/generation-requests/:requestId/cancel')
  async cancelGeneration(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    await this.generationService.cancel(userId, requestId);
    return { success: true };
  }
}
