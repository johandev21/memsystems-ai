import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotebooksService } from './notebooks.service';

const createNotebookSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  icon: z.string().max(50, 'Icon must be at most 50 characters').optional(),
});

const updateNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  bannerFocalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .nullable()
    .optional(),
});

@Controller('notebooks')
@UseGuards(AuthGuard)
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? Number.parseInt(offset, 10) : undefined;
    return this.notebooksService.list(userId, {
      limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
      offset: Number.isNaN(parsedOffset) ? undefined : parsedOffset,
      search,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createNotebookSchema))
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: z.infer<typeof createNotebookSchema>,
  ) {
    return this.notebooksService.create(userId, body);
  }

  @Get(':id')
  async get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notebooksService.get(userId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateNotebookSchema))
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: z.infer<typeof updateNotebookSchema>,
  ) {
    return this.notebooksService.update(userId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notebooksService.delete(userId, id);
  }

  @Post(':id/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('focalPoint') focalPointRaw?: string,
  ) {
    let focalPoint: { x: number; y: number } | undefined;
    if (focalPointRaw) {
      try {
        focalPoint = JSON.parse(focalPointRaw) as { x: number; y: number };
      } catch {
        // Ignore malformed focal point JSON
      }
    }

    if (!file) {
      throw new Error('File is required');
    }

    return this.notebooksService.uploadBanner(
      userId,
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
      focalPoint,
    );
  }

  @Delete(':id/banner')
  async removeBanner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notebooksService.removeBanner(userId, id);
  }
}
