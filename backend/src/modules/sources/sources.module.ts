import { Module } from "@nestjs/common";
import { NotebooksModule } from "../notebooks/notebooks.module";
import { SourceExtractionService } from "./source-extraction.service";
import { SourcesController } from "./sources.controller";
import { SourcesService } from "./sources.service";
import { WebScraperService } from "./web-scraper.service";

@Module({
  imports: [NotebooksModule],
  controllers: [SourcesController],
  providers: [
    SourceExtractionService,
    WebScraperService,
    SourcesService,
  ],
  exports: [SourcesService],
})
export class SourcesModule {}
