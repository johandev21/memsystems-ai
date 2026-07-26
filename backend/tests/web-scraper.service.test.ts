import { describe, expect, it, vi } from "vitest";
import { WebScraperService } from "../src/modules/sources/web-scraper.service";

describe("WebScraperService Unit Tests", () => {
  const service = new WebScraperService();

  it("should throw WebScrapeError for invalid URLs", async () => {
    await expect(service.scrapeUrl("invalid-url")).rejects.toThrow("Invalid URL");
  });

  it("should clean Wikipedia citation sections and inline references [1] from scraped HTML", async () => {
    const wikipediaSampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Epistemology - Wikipedia</title>
        </head>
        <body>
          <main id="content">
            <h1>Epistemology</h1>
            <p>
              Epistemology is the branch of philosophy concerned with knowledge<sup class="reference"><a href="#cite_note-1">[1]</a></sup>.
              Epistemologists study the nature, origin, and scope of knowledge, epistemic justification, the rationality of belief, and various related issues.
              Epistemology is considered one of the core subfields of philosophy, alongside ethics, logic, and metaphysics.
              Debates in epistemology are generally centered around four core areas: the philosophical analysis of the nature of knowledge and how it relates to concepts such as truth, belief, and justification.
            </p>
            <p>
              Knowledge is often defined as justified true belief<sup class="reference"><a href="#cite_note-2">[2]</a></sup>.
              This concept has been debated extensively across various philosophical traditions since Antiquity.
              The Gettier problem, presented by Edmund Gettier in 1963, challenged the traditional view that justified true belief constitutes knowledge by presenting counterexamples where a belief is both true and justified, yet fails to count as genuine knowledge<sup class="reference"><a href="#cite_note-3">[3]</a></sup>.
            </p>
            <div id="References" class="reflist">
              <h2>References</h2>
              <ol class="references">
                <li id="cite_note-1">1. Steup, Matthias (2005). Epistemology. Stanford Encyclopedia of Philosophy.</li>
                <li id="cite_note-2">2. Gettier, Edmund (1963). Is Justified True Belief Knowledge? Analysis 23 (6): 121–123.</li>
              </ol>
            </div>
            <div class="navbox">Navigation box content</div>
          </main>
        </body>
      </html>
    `;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        body: {
          getReader() {
            let readCount = 0;
            const encoder = new TextEncoder();
            const data = encoder.encode(wikipediaSampleHtml);
            return {
              async read() {
                if (readCount > 0) return { done: true, value: undefined };
                readCount++;
                return { done: false, value: data };
              },
              async cancel() {},
            };
          },
        },
      }),
    );

    const scraped = await service.scrapeUrl("https://en.wikipedia.org/wiki/Epistemology");

    expect(scraped.title).toBe("Epistemology - Wikipedia");
    // Verify inline citations like [1], [2], [3] are stripped
    expect(scraped.text).not.toContain("[1]");
    expect(scraped.text).not.toContain("[2]");
    expect(scraped.text).not.toContain("[3]");
    // Verify citation section (.reflist) is stripped
    expect(scraped.text).not.toContain("Steup, Matthias");
    expect(scraped.text).not.toContain("Gettier, Edmund");
    // Verify navbox is stripped
    expect(scraped.text).not.toContain("Navigation box content");
    // Verify main text is present
    expect(scraped.text).toContain("Epistemology is the branch of philosophy concerned with knowledge");

    vi.unstubAllGlobals();
  });
});
