import { Module } from '@nestjs/common';
import { NotebooksModule } from '../notebooks/notebooks.module';
import { SourceExtractionService } from './source-extraction.service';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { WebScraperService } from './web-scraper.service';
import { WebSearchService } from './web-search.service';

@Module({
  imports: [NotebooksModule],
  controllers: [SourcesController],
  providers: [
    SourceExtractionService,
    WebScraperService,
    SourcesService,
    WebSearchService,
  ],
  exports: [SourcesService, WebSearchService],
})
export class SourcesModule {}
