import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  isValidHttpUrl,
  scrapeUrl,
  WebScrapeError,
} from "../../src/features/sources/web-scraper.service";

const ARTICLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Understanding Promises in JavaScript</title>
    <meta name="author" content="Jane Doe" />
    <meta property="og:title" content="Promises in JavaScript — A Deep Dive" />
  </head>
  <body>
    <header>
      <nav>Home | About | Contact</nav>
    </header>
    <article>
      <h1>Understanding Promises in JavaScript</h1>
      <p class="byline">By Jane Doe — January 10, 2025</p>
      <p>A Promise represents the eventual completion or failure of an asynchronous operation and its resulting value. Unlike callbacks, promises can be chained, making async code far more readable and maintainable in complex applications. Promises have three states which any developer should understand clearly before writing production code that depends on them.</p>
      <p>Once a promise settles into fulfilled or rejected it stays that way permanently, which makes them reliable primitives for async coordination across large codebases. This immutability is a key part of the contract that makes promises safe to compose and reason about under load and across distributed systems in modern software engineering practice today always.</p>
      <p>By chaining promises with then, catch, and finally, developers can express complex asynchronous workflows as a sequence of clearly defined steps. The returned value from each then is a new promise, which lets you build pipelines that are easy to test, easy to debug, and easy to extend over time as requirements evolve and the system grows in scope and complexity.</p>
    </article>
    <aside>Related articles, ads, newsletter signup...</aside>
    <footer>&copy; 2025 Example Corp</footer>
  </body>
</html>`;

const NON_ARTICLE_HTML = `<!doctype html>
<html>
  <head><title>Login Page</title></head>
  <body>
    <h1>Sign in</h1>
    <form>
      <input type="text" name="user" />
      <input type="password" name="pass" />
      <button type="submit">Go</button>
    </form>
  </body>
</html>`;

let server: ReturnType<typeof Bun.serve> | null = null;
let baseUrl = "";

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/article") {
        return new Response(ARTICLE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      if (url.pathname === "/no-article") {
        return new Response(NON_ARTICLE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      if (url.pathname === "/json") {
        return new Response('{"hello":"world"}', {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.pathname === "/redirect") {
        return Response.redirect(`${baseUrl}/article`, 302);
      }
      if (url.pathname === "/notfound") {
        return new Response("not found", { status: 404 });
      }
      return new Response("ok", { status: 200 });
    },
  });
  baseUrl = `http://localhost:${server.port}`;
});

afterAll(() => {
  server?.stop();
  server = null;
});

describe("web-scraper.service — isValidHttpUrl", () => {
  test("accepts http and https URLs", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://example.com/path?q=1")).toBe(true);
  });
  test("rejects non-http schemes and garbage", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });
});

describe("web-scraper.service — scrapeUrl", () => {
  test("extracts article title and text from HTML", async () => {
    const result = await scrapeUrl(`${baseUrl}/article`);
    expect(result.title).toContain("Promises in JavaScript");
    expect(result.text).toContain("Promise represents the eventual");
    expect(result.byline).toContain("Jane Doe");
  });

  test("throws not_readerable for non-article pages", async () => {
    await expect(scrapeUrl(`${baseUrl}/no-article`)).rejects.toBeInstanceOf(
      WebScrapeError,
    );
    try {
      await scrapeUrl(`${baseUrl}/no-article`);
    } catch (err) {
      expect((err as WebScrapeError).code).toBe("not_readerable");
    }
  });

  test("throws invalid_content_type for non-HTML", async () => {
    try {
      await scrapeUrl(`${baseUrl}/json`);
    } catch (err) {
      expect((err as WebScrapeError).code).toBe("invalid_content_type");
    }
  });

  test("throws fetch_failed on 4xx", async () => {
    try {
      await scrapeUrl(`${baseUrl}/notfound`);
    } catch (err) {
      expect((err as WebScrapeError).code).toBe("fetch_failed");
    }
  });

  test("follows redirects", async () => {
    const result = await scrapeUrl(`${baseUrl}/redirect`);
    expect(result.text).toContain("Promise represents the eventual");
  });

  test("throws fetch_failed for invalid URL", async () => {
    await expect(scrapeUrl("not a real url")).rejects.toBeInstanceOf(
      WebScrapeError,
    );
  });
});
