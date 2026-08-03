import { Module } from '@nestjs/common';
import { NotebooksModule } from '../notebooks/notebooks.module';
import { DocumentNormalizerService } from './document-normalizer.service';
import { HttpFetcherService } from './http-fetcher.service';
import { SourceAcquisitionService } from './source-acquisition.service';
import { SourceExtractionService } from './source-extraction.service';
import {
  SOURCE_JOBS_CONFIG,
  loadSourceJobsConfig,
  SourceJobsService,
} from './source-jobs.service';
import {
  loadSourceFetchConfig,
  SOURCE_FETCH_CONFIG,
  SourcePolicyService,
} from './source-policy.service';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { WebScraperService } from './web-scraper.service';
import { WebSearchService } from './web-search.service';

@Module({
  imports: [NotebooksModule],
  controllers: [SourcesController],
  providers: [
    {
      provide: SOURCE_FETCH_CONFIG,
      useFactory: loadSourceFetchConfig,
    },
    {
      provide: SOURCE_JOBS_CONFIG,
      useFactory: loadSourceJobsConfig,
    },
    SourcePolicyService,
    HttpFetcherService,
    SourceExtractionService,
    DocumentNormalizerService,
    WebScraperService,
    SourceAcquisitionService,
    SourceJobsService,
    SourcesService,
    WebSearchService,
  ],
  exports: [SourcesService, WebSearchService, SourceJobsService],
})
export class SourcesModule {}
