import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SourcesService } from "./sources.service";

const textSourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  rawText: z.string().min(1, "rawText is required"),
});

const urlSourceSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().max(500).optional(),
});

@Controller()
@UseGuards(AuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get("notebooks/:notebookId/sources")
  async listSources(
    @CurrentUser("id") userId: string,
    @Param("notebookId") notebookId: string,
  ) {
    return this.sourcesService.list(userId, notebookId);
  }

  @Post("notebooks/:notebookId/sources/text")
  @UsePipes(new ZodValidationPipe(textSourceSchema))
  async createTextSource(
    @CurrentUser("id") userId: string,
    @Param("notebookId") notebookId: string,
    @Body() body: z.infer<typeof textSourceSchema>,
  ) {
    return this.sourcesService.createText(userId, notebookId, body);
  }

  @Post("notebooks/:notebookId/sources/url")
  @UsePipes(new ZodValidationPipe(urlSourceSchema))
  async createUrlSource(
    @CurrentUser("id") userId: string,
    @Param("notebookId") notebookId: string,
    @Body() body: z.infer<typeof urlSourceSchema>,
  ) {
    return this.sourcesService.createUrl(userId, notebookId, body);
  }

  @Post("notebooks/:notebookId/sources/file")
  @UseInterceptors(FileInterceptor("file"))
  async createFileSource(
    @CurrentUser("id") userId: string,
    @Param("notebookId") notebookId: string,
    @UploadedFile() file?: any,
    @Body("title") title?: string,
  ) {
    if (!file) {
      throw new Error("File is required");
    }
    return this.sourcesService.createFile(
      userId,
      notebookId,
      file.buffer,
      file.originalname,
      file.mimetype,
      title,
    );
  }

  @Get("sources/:id")
  async getSource(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.sourcesService.get(userId, id);
  }

  @Delete("sources/:id")
  async deleteSource(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.sourcesService.delete(userId, id);
  }

  @Get("sources/:id/download")
  async downloadSource(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.sourcesService.getDownload(userId, id);
  }
}
