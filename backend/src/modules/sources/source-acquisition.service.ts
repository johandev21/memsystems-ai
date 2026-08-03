import { Injectable } from '@nestjs/common';
import {
  DocumentNormalizerService,
  NormalizedDocument,
} from './document-normalizer.service';
import { HttpFetcherService } from './http-fetcher.service';
import { SourceExtractionService } from './source-extraction.service';
import { SourcePolicyService } from './source-policy.service';
import { WebScraperService } from './web-scraper.service';

/** A normalized URL document plus the fetch provenance used for persistence. */
export interface AcquiredUrlDocument extends NormalizedDocument {
  status: number;
  httpContentType: string;
  etag?: string;
  lastModified?: string;
  robotsDecision: string;
  redirects: string[];
}

@Injectable()
export class SourceAcquisitionService {
  constructor(
    private readonly policyService: SourcePolicyService,
    private readonly httpFetcher: HttpFetcherService,
    private readonly webScraper: WebScraperService,
    private readonly normalizer: DocumentNormalizerService,
    private readonly extraction: SourceExtractionService,
  ) {}

  /**
   * Full URL pipeline: policy validation -> bounded fetch with redirect
   * revalidation -> Readability extraction -> normalized document.
   */
  async acquireUrl(input: string): Promise<AcquiredUrlDocument> {
    const fetched = await this.httpFetcher.fetchHtml(input);
    const page = this.webScraper.extractHtml(fetched.body, fetched.url);
    const document = this.normalizer.fromHtml(page, {
      sourceUrl: fetched.requestedUrl,
      canonicalUrl: fetched.canonicalUrl,
      fetchedUrl: fetched.url,
      contentType: fetched.contentType,
    });

    return {
      ...document,
      status: fetched.status,
      httpContentType: fetched.contentType,
      etag: fetched.etag,
      lastModified: fetched.lastModified,
      robotsDecision: fetched.robotsDecision,
      redirects: fetched.redirects,
    };
  }

  /** Uploaded file pipeline: extraction -> normalized document. */
  async acquireFile(
    buffer: Buffer,
    contentType: string,
    fileName: string,
  ): Promise<NormalizedDocument> {
    const extracted = await this.extraction.extractText(
      buffer,
      contentType,
      fileName,
    );
    return this.normalizer.fromFile({
      text: extracted.text,
      contentType,
      fileName,
      pageCount: extracted.pageCount,
    });
  }

  /** Pasted text pipeline: direct normalization. */
  fromText(rawText: string, title: string): NormalizedDocument {
    return this.normalizer.fromText(rawText, title);
  }
}
