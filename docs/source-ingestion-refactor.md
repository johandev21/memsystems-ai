# Source Ingestion Refactor Sequence

## Purpose

Refactor source acquisition into a reliable content-ingestion pipeline for URLs, uploaded files, and pasted text. The goal is higher-quality RAG documents, stronger provenance, safer fetching, recoverable indexing, and a path to multi-page crawling without prematurely introducing an unnecessary service boundary.

The target pipeline is:

```text
Input
  -> acquisition policy
  -> fetch or file read
  -> raw artifact preservation
  -> content extraction
  -> normalization
  -> structured document
  -> metadata enrichment
  -> structural chunking
  -> durable indexing
  -> retrieval
```

This is an incremental refactor. Existing URL, file, text, web-search, chat, and study-material flows should continue working throughout the migration.

## Current Baseline

The current backend already provides useful building blocks:

- `WebScraperService` fetches bounded HTML with a timeout and extracts article text with Mozilla Readability.
- `SourceExtractionService` extracts PDF, DOCX, Markdown, and text files.
- `SourcesService` persists the extracted text in `sources.rawText`.
- `IndexingService` chunks source text, generates embeddings, and stores vectors in PostgreSQL/pgvector.
- `WebSearchService` imports selected search candidates through the URL source path.
- Uploaded files are preserved through `StorageService`.

The main problems are not that the system lacks a crawler library. The main problems are:

- Fetching is not protected by a complete SSRF and redirect policy.
- URL ingestion handles one static HTML page, not dynamic pages or site crawls.
- The original web response is not preserved for later reprocessing.
- Extracted text has limited structural metadata.
- Chunking is character-based and does not preserve headings or code blocks.
- Indexing is fire-and-forget and can leave a source without chunks after a failure.
- Embedding configuration is not versioned.
- Retrieval and citations are source-oriented rather than chunk/provenance-oriented.

## Decisions

### Keep the existing fast path

Use ordinary HTTP fetch plus Readability for static pages. This is cheaper, faster, and easier to operate than launching a browser for every URL.

### Add browser rendering as a fallback

Use Playwright only when the HTTP response appears empty, shell-like, or otherwise incomplete. The browser path must have its own timeout, memory/concurrency limit, and URL policy.

### Defer full crawling

Do not turn `createUrl` into a site crawler. Add a separate crawl operation later with explicit limits, scope, progress, and cancellation.

### Prefer TypeScript-native crawling

If multi-page crawling becomes necessary, evaluate Crawlee first because it fits the existing NestJS/TypeScript runtime and provides request queues, retries, concurrency controls, link discovery, and sitemap support.

Crawl4AI remains an option if the project intentionally adopts a separate Python/Docker extraction service. It should not be added as an incidental dependency to the NestJS process.

### Avoid LLM-based extraction by default

Use deterministic parsers for fetching and extraction. Use models later for optional metadata enrichment, document classification, summaries, or synthetic questions. Do not use an LLM to recover text that HTML structure already exposes.

## Refactor Sequence

## Phase 0: Establish behavior and measurements

### Goals

Create a safety net before changing the ingestion contract.

### Work

1. Inventory current source entry points:
   - manual URL creation
   - AI web-search import
   - file upload
   - pasted text
   - notebook reindexing
2. Record the current response and error behavior for each path.
3. Expand scraper fixtures to cover:
   - ordinary article HTML
   - navigation, footer, ads, comments, and citation noise
   - missing or misleading metadata
   - short pages
   - malformed HTML
   - redirects
   - non-HTML responses
   - large responses
   - a JavaScript shell with no meaningful server-rendered text
4. Add characterization tests around source creation and indexing behavior.
5. Define initial ingestion metrics:
   - fetch success rate
   - extraction success rate
   - extracted character/token count
   - indexing duration
   - embedding failure rate
   - duplicate rate
   - retrieval hit rate on a small evaluation set

### Exit criteria

- Existing behavior is covered by tests.
- A small representative URL fixture set exists.
- A baseline retrieval evaluation can be rerun after each phase.

## Phase 1: Harden URL acquisition

### Goals

Make the existing single-page fetcher safe and predictable before adding new capabilities.

### Work

1. Add a URL policy component separate from `WebScraperService`.
2. Validate:
   - only `http:` and `https:` schemes
   - valid hostname
   - allowed port policy
   - maximum URL length
   - disallowed credentials in URLs
3. Protect against SSRF:
   - reject localhost and loopback addresses
   - reject private IPv4 ranges
   - reject private, link-local, and loopback IPv6 addresses
   - reject cloud metadata addresses
   - resolve DNS and validate every resolved address
   - revalidate after redirects
4. Replace unrestricted redirect following with a redirect-aware loop or validated redirect handler.
5. Keep limits for:
   - request timeout
   - response byte count
   - redirect count
   - decompressed response size
6. Validate the final response URL and content type.
7. Add an explicit `robots.txt` policy for automated fetching. At minimum, make the behavior configurable and record whether the fetch was allowed, denied, or skipped because the policy was unavailable.
8. Normalize URLs for identity:
   - remove fragments
   - normalize default ports
   - normalize hostname casing
   - apply a documented query-string policy
   - preserve the original requested URL separately
9. Improve fetch errors with stable codes and safe diagnostic context. Do not include secrets or response bodies in logs.
10. Make the user agent and policy limits configuration-driven.

### Exit criteria

- Redirects cannot bypass URL safety checks.
- SSRF and oversized-response tests pass.
- URL identity behavior is deterministic.
- Existing valid public URL ingestion remains compatible.

## Phase 2: Introduce a normalized document contract

### Goals

Stop passing an unstructured `rawText` string directly from every extractor into indexing.

### Work

Create a shared internal document contract, for example:

```ts
interface NormalizedDocument {
  title: string;
  text: string;
  markdown?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  fetchedUrl?: string;
  language?: string;
  author?: string;
  siteName?: string;
  publishedAt?: string;
  modifiedAt?: string;
  extractionMethod: 'text' | 'file' | 'readability' | 'playwright';
  contentType?: string;
  contentHash: string;
  sections: DocumentSection[];
}

interface DocumentSection {
  headingPath: string[];
  content: string;
  ordinal: number;
  pageNumber?: number;
}
```

1. Define the contract in a source-processing module, not inside the controller.
2. Add adapters for:
   - pasted text
   - HTML/Readability
   - Markdown
   - TXT
   - PDF
   - DOCX
3. Keep the current `rawText` field populated during migration for compatibility.
4. Make normalization deterministic and versioned.
5. Preserve meaningful whitespace in code blocks and lists while normalizing ordinary prose.
6. Stop stripping all bracketed citations blindly. Remove only proven citation artifacts, and preserve legitimate text such as `[RFC 9110]` or array syntax.

### Exit criteria

- Every source type produces the same normalized document shape.
- Existing consumers can still read `rawText`.
- Heading paths, extraction method, and content hash are available before indexing.

## Phase 3: Preserve raw artifacts and processing versions

### Goals

Allow extraction and cleaning logic to improve without refetching every source.

### Work

1. Store original web responses in object storage, subject to size and retention policy.
2. Store the original uploaded file as the existing file path already does.
3. Add source fields or a related `source_versions` table for:
   - requested URL
   - final fetched URL
   - canonical URL
   - content type
   - HTTP status
   - content hash
   - raw artifact storage key
   - ETag
   - Last-Modified
   - fetched timestamp
   - extraction method
   - extractor version
   - normalization version
   - processing status
   - processing error
4. Use content hashes for change detection and deduplication.
5. Keep raw artifacts private and access-controlled. They should not be exposed through the normal source download endpoint unless explicitly required.
6. Define retention and deletion behavior for raw artifacts when a source is deleted.

### Recommended model direction

The current `sources` row represents a user-visible source. A later `source_versions` row should represent each fetched or processed version. Do not force full versioning into the first migration if it would delay security and reliability improvements, but do not discard the raw artifact.

### Exit criteria

- A source can be reprocessed from stored input.
- Content changes can be detected without embedding unchanged text.
- Extraction-version changes do not require a network crawl.

## Phase 4: Add targeted JavaScript rendering

### Goals

Recover content from client-rendered pages without making browser automation the default path.

### Work

1. Add Playwright as an optional acquisition adapter.
2. Detect browser fallback candidates using deterministic signals:
   - extracted text below a minimum threshold
   - known application-shell markers
   - content containers present but empty
   - required content loaded only after script execution
   - explicit caller request for rendered mode
3. Launch a bounded browser pool rather than a new unrestricted browser per request.
4. Configure:
   - headless mode
   - navigation timeout
   - total page timeout
   - maximum concurrent pages
   - maximum response/resource size
   - disabled unnecessary resources where safe
5. Reapply URL and redirect safety checks to browser navigation and subresource behavior.
6. Wait for a documented readiness condition. Avoid arbitrary long sleeps.
7. Extract the rendered DOM through the same normalized document adapter used by static HTML.
8. Record `extractionMethod: 'playwright'` and browser-specific diagnostics.
9. Add tests for fallback selection and browser cleanup on failures.

### Exit criteria

- Static pages still use the cheaper HTTP path.
- Dynamic pages can be ingested when the fallback succeeds.
- Browser concurrency and cleanup are bounded and observable.

## Phase 5: Make indexing durable and recoverable

### Goals

Ensure a source remains searchable while a new index is being generated and make failures visible.

### Work

1. Replace fire-and-forget indexing with a durable job abstraction.
2. Add an indexing state model such as:
   - `pending`
   - `processing`
   - `ready`
   - `failed`
   - `cancelled`
3. Persist:
   - attempt count
   - last error
   - started/completed timestamps
   - processing version
   - embedding model and dimensions
4. Use an outbox/worker or the project’s selected job mechanism. Do not rely on an untracked Promise in the request handler.
5. Generate new chunks and embeddings before replacing the old chunk set.
6. Replace chunks atomically after successful embedding generation.
7. Validate that the number of embeddings equals the number of chunks.
8. Add bounded retries with backoff for transient provider and database failures.
9. Batch chunk inserts instead of issuing one insert per chunk where practical.
10. Bound notebook reindex concurrency.
11. Make indexing idempotent using source content hash plus processing and embedding versions.
12. Add explicit reindex and retry operations for operators and users.

### Exit criteria

- A transient embedding failure does not erase a working index.
- Failed jobs are visible and retryable.
- Repeated processing of unchanged content is skipped.
- Reindexing a large notebook does not create unbounded concurrency.

## Phase 6: Replace character-only chunking with structural chunking

### Goals

Improve retrieval quality while preserving document context and code examples.

### Work

1. Parse Markdown or document sections before splitting.
2. Preserve:
   - heading hierarchy
   - paragraphs
   - lists
   - tables where extraction is reliable
   - fenced code blocks
   - block quotes
3. Keep code blocks intact unless an individual block exceeds the model limit.
4. Split large sections by paragraph, then sentence, then word as a last resort.
5. Use token-aware limits rather than JavaScript string length.
6. Include heading context in the chunk metadata and, if useful for embeddings, a compact heading prefix in the embedded text.
7. Store:
   - `chunkIndex`
   - `headingPath`
   - page number
   - source offsets
   - content hash
   - chunking version
8. Use overlap sparingly and only at meaningful boundaries. Never prepend a partial code block or arbitrary partial word.
9. Add fixtures for long prose, nested headings, lists, tables, code, multilingual text, and very long tokens.

### Exit criteria

- Code examples remain usable in one chunk whenever possible.
- Retrieved chunks identify their section and location.
- Chunking behavior is deterministic and versioned.
- Retrieval evaluation improves or remains stable on the baseline set.

## Phase 7: Improve deduplication and source identity

### Goals

Avoid duplicate pages and repeated chunks without incorrectly merging distinct documents.

### Work

1. Deduplicate URLs using canonical URL identity.
2. Deduplicate content using normalized content hashes.
3. Treat URL aliases and identical content as separate concerns:
   - URL aliasing controls source identity.
   - Content hashing controls processing and embedding reuse.
4. Add optional near-duplicate detection only after exact deduplication is working.
5. Do not begin with expensive MinHash, SimHash, or embedding similarity globally. Measure the duplicate problem first.
6. Preserve provenance when two URLs resolve to the same content.
7. Define whether duplicate content should be shared across notebooks or only reused internally while retaining notebook ownership boundaries.

### Exit criteria

- Re-importing the same URL is predictable.
- Query parameters and redirects do not create uncontrolled duplicates.
- Distinct pages with similar content are not silently collapsed.

## Phase 8: Improve retrieval and citations

### Goals

Make better use of the richer chunks and prevent irrelevant nearest-neighbor results.

### Work

1. Add a minimum similarity threshold, calibrated against the evaluation set.
2. Add source diversity or maximal marginal relevance so one source cannot dominate every result.
3. Preserve chunk metadata in retrieval results.
4. Consider hybrid lexical plus vector search for exact terms, APIs, identifiers, and code.
5. Add metadata filters for source kind, language, section, and optionally date.
6. Generate citations from source ID plus chunk ID and offsets, not title matching alone.
7. Store enough provenance to show:
   - source title
   - canonical URL
   - section heading
   - quoted text
   - page or offset where available
8. Keep chat prompt formatting separate from the persistence model.

### Exit criteria

- Irrelevant chunks are rejected more often than before.
- Citations identify the exact supporting chunk.
- Exact technical terms and code identifiers remain retrievable.

## Phase 9: Add multi-page crawling as a separate product capability

### Goals

Support documentation sites and bounded knowledge bases without changing single-URL semantics.

### Work

1. Define a crawl request model containing:
   - starting URL
   - allowed hostnames
   - allowed path prefixes or patterns
   - maximum pages
   - maximum depth
   - concurrency
   - delay/rate limit
   - render mode
   - follow pagination flag
   - sitemap preference
2. Discover URLs in this order where available:
   - explicit sitemap URLs
   - `sitemap.xml` and sitemap index
   - documentation navigation/sidebar links
   - same-scope page links
3. Respect robots policy, terms, rate limits, and crawl scope.
4. Use Crawlee if the TypeScript process owns the crawl. Configure its request queue, retries, concurrency, and failure handler explicitly.
5. Process each successful page through the same acquisition and normalized-document pipeline as manual URLs.
6. Persist crawl-level and page-level status separately.
7. Support cancellation and partial completion.
8. Make page imports idempotent by canonical URL and content hash.
9. Do not allow a crawl to bypass per-page size, timeout, or SSRF limits.
10. Add quotas so one crawl cannot starve normal source ingestion.

### Exit criteria

- A bounded documentation crawl can be started, observed, cancelled, and retried.
- A failed page does not fail the entire crawl.
- Crawled pages use the same chunk, embedding, retrieval, and citation path as manually added sources.

## Phase 10: Optional metadata enrichment

### Goals

Use AI where it adds value without making ingestion dependent on an LLM call.

### Work

Use an optional enrichment step for:

- document type classification
- topic tags
- short summaries
- keyword extraction
- synthetic question generation
- quality or relevance scoring

Store the model ID, prompt/version, timestamp, and enrichment status. Never overwrite the deterministic document text with model-generated text. Enrichment failures must not make a source unsearchable.

### Exit criteria

- Enrichment is independently retryable.
- Model-generated metadata can be regenerated when prompts or models change.
- Core ingestion works with no enrichment provider configured.

## Proposed Implementation Boundaries

The following boundaries should emerge in the backend:

```text
sources/
  source-policy.service.ts       URL, SSRF, robots, limits
  source-acquisition.service.ts  HTTP and browser selection
  http-fetcher.service.ts        bounded HTTP requests
  browser-fetcher.service.ts     Playwright fallback
  source-extraction.service.ts   file and HTML extraction
  document-normalizer.service.ts normalized document contract
  source-persistence.service.ts  source/artifact/version persistence
  source-jobs.service.ts         durable processing state

ai/
  chunking.service.ts             structural chunks
  indexing.service.ts             chunk/embed/replace workflow
  retrieval.service.ts            vector/hybrid retrieval and provenance
```

Names may change. The important boundaries are policy, acquisition, extraction, normalization, persistence, indexing, and retrieval. Controllers should coordinate these services rather than contain pipeline logic.

## Database Migration Strategy

Prefer additive migrations:

1. Add nullable metadata and status fields.
2. Backfill content hashes and normalized metadata for existing sources.
3. Add processing/version fields to chunks.
4. Introduce durable indexing jobs.
5. Switch reads and writes to the new fields.
6. Only remove or make old fields non-null after all consumers have migrated.

Do not change the vector dimension or embedding model in place. If the embedding model changes, either reindex into a new vector column/table or ensure all queries target one compatible model at a time.

## Verification Plan

Every phase should include:

- unit tests for pure parsing and normalization logic
- integration tests for database state transitions
- fixture tests for representative web documents
- failure tests for timeout, redirect, invalid content, and provider errors
- security tests for SSRF and redirect bypasses
- retrieval evaluation before and after chunking changes

The quality gate remains:

```text
pnpm run lint
pnpm run typecheck
pnpm run test
```

For browser or crawl features, add a separate integration command if the required browser binaries and environment make it unsuitable for the default test suite.

## Recommended First Implementation Slice

Begin with the smallest high-value slice:

1. Add URL policy and redirect validation.
2. Add source content hashes and extraction metadata.
3. Introduce a normalized document type while preserving `rawText`.
4. Make indexing replace chunks atomically and expose processing failures.
5. Add tests for those behaviors.

Do not start with Crawl4AI, a full crawler, semantic LLM chunking, or a vector database migration. Those changes depend on the document and job contracts above and would make failures harder to isolate.
