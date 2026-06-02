import { describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  classifyFile,
  extractMarkdown,
  extractText,
  extractTxt,
  isSupportedFile,
} from "../../src/features/sources/source-extraction.service";

const FIXTURES_DIR = join(import.meta.dir, "..", "fixtures");

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog.";
const SAMPLE_MARKDOWN = `# Title

This is **bold** and this is *italic*.

- Item one
- Item two
`;

const SAMPLE_DOCX_TEXT = "Hello from a generated DOCX fixture.";

const SAMPLE_PDF_TEXT = "Hello PDF fixture for source extraction tests.";

async function ensureFixtures() {
  await mkdir(FIXTURES_DIR, { recursive: true });
  const txtPath = join(FIXTURES_DIR, "sample.txt");
  const mdPath = join(FIXTURES_DIR, "sample.md");
  const docxPath = join(FIXTURES_DIR, "sample.docx");
  const pdfPath = join(FIXTURES_DIR, "sample.pdf");

  await Bun.write(txtPath, SAMPLE_TEXT);
  await Bun.write(mdPath, SAMPLE_MARKDOWN);

  if (!(await Bun.file(docxPath).exists())) {
    await Bun.write(docxPath, buildMinimalDocx(SAMPLE_DOCX_TEXT));
  }
  if (!(await Bun.file(pdfPath).exists())) {
    await Bun.write(pdfPath, buildMinimalPdf(SAMPLE_PDF_TEXT));
  }
}

describe("source-extraction.service", () => {
  test("classifyFile identifies content types", () => {
    expect(classifyFile("application/pdf")).toBe("pdf");
    expect(classifyFile("text/markdown")).toBe("markdown");
    expect(classifyFile("text/x-markdown")).toBe("markdown");
    expect(classifyFile("text/plain")).toBe("txt");
    expect(
      classifyFile(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("docx");
    expect(classifyFile("text/markdown; charset=utf-8")).toBe("markdown");
  });

  test("classifyFile falls back to filename extension", () => {
    expect(classifyFile("", "notes.md")).toBe("markdown");
    expect(classifyFile("", "paper.PDF")).toBe("pdf");
    expect(classifyFile("", "essay.docx")).toBe("docx");
    expect(classifyFile("application/octet-stream", "data.txt")).toBe("txt");
  });

  test("classifyFile throws on unsupported types", () => {
    expect(() => classifyFile("image/png")).toThrow();
    expect(() => classifyFile("application/zip", "blob.bin")).toThrow();
  });

  test("isSupportedFile returns true/false correctly", () => {
    expect(isSupportedFile("application/pdf", "a.pdf")).toBe(true);
    expect(isSupportedFile("image/png", "a.png")).toBe(false);
  });

  test("extractMarkdown returns decoded text", () => {
    const result = extractMarkdown(Buffer.from(SAMPLE_MARKDOWN, "utf-8"));
    expect(result.text).toContain("# Title");
    expect(result.text).toContain("Item one");
  });

  test("extractTxt normalizes CRLF and trims", () => {
    const result = extractTxt(Buffer.from("  hello\r\nworld  \r\n\r\n", "utf-8"));
    expect(result.text).toBe("hello\nworld");
  });

  test("extractText routes by content-type for txt and md", async () => {
    const md = await extractText(
      Buffer.from(SAMPLE_MARKDOWN, "utf-8"),
      "text/markdown",
      "x.md",
    );
    expect(md.text).toContain("# Title");
    const txt = await extractText(
      Buffer.from(SAMPLE_TEXT, "utf-8"),
      "text/plain",
      "x.txt",
    );
    expect(txt.text).toBe(SAMPLE_TEXT);
  });

  test("extractText extracts DOCX content via mammoth", async () => {
    await ensureFixtures();
    const buffer = Buffer.from(await Bun.file(join(FIXTURES_DIR, "sample.docx")).arrayBuffer());
    const result = await extractText(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "sample.docx",
    );
    expect(result.text).toContain("Hello from a generated DOCX fixture");
  });

  test("extractText extracts PDF content via pdf-parse", async () => {
    await ensureFixtures();
    const buffer = Buffer.from(await Bun.file(join(FIXTURES_DIR, "sample.pdf")).arrayBuffer());
    const result = await extractText(buffer, "application/pdf", "sample.pdf");
    expect(result.text).toContain("Hello PDF fixture");
  });
});

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]!) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildMinimalDocx(body: string): Uint8Array {
  const files: { name: string; data: Uint8Array }[] = [
    {
      name: "[Content_Types].xml",
      data: new TextEncoder().encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: new TextEncoder().encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      ),
    },
    {
      name: "word/document.xml",
      data: new TextEncoder().encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t xml:space="preserve">${escapeXml(body)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`,
      ),
    },
  ];

  return buildZip(files);
}

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const { name, data } of files) {
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(data);
    const size = data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    centralParts.push(central);
    offset += localHeader.length + data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);

  const total =
    offset + centralSize + endRecord.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of localParts) {
    out.set(part, p);
    p += part.length;
  }
  for (const part of centralParts) {
    out.set(part, p);
    p += part.length;
  }
  out.set(endRecord, p);

  return out;
}

function buildMinimalPdf(text: string): Uint8Array {
  const lines = text.split("\n");
  const tjEntries = lines
    .map((line, i) => {
      const y = 750 - i * 20;
      return `BT /F1 12 Tf 50 ${y} Td (${escapePdfString(line)}) Tj ET`;
    })
    .join("\n");
  const stream = `${tjEntries}\n`;

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  objects.push(
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const header = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
  let body = "";
  const offsets: number[] = [];
  let cursor = header.length;
  objects.forEach((obj, i) => {
    offsets.push(cursor);
    const chunk = `${i + 1} 0 obj\n${obj}\nendobj\n`;
    body += chunk;
    cursor += chunk.length;
  });

  const xrefOffset = header.length + body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdf = header + body + xref + trailer;
  return new TextEncoder().encode(pdf);
}

function escapePdfString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
