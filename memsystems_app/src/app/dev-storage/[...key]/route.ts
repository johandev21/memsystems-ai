import { type NextRequest, NextResponse } from "next/server";
import {
  contentTypeForKey,
  localGetBuffer,
  verifyLocalToken,
} from "@/lib/storage/local-fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  console.log("[dev-storage] GET request params segments:", segments);

  if (!segments || segments.length === 0) {
    console.log("[dev-storage] Empty segments, returning 404");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rawKey = segments.join("/");
  const key = decodeURIComponent(rawKey);
  console.log("[dev-storage] Reconstructed key:", { rawKey, key });

  const { searchParams } = req.nextUrl;
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");
  console.log("[dev-storage] Verification params:", { expires, sig });

  const result = verifyLocalToken(key, expires, sig);
  console.log("[dev-storage] Token verification result:", result);
  if (!result.ok) {
    const status = result.reason === "expired" ? 410 : 403;
    console.log(
      `[dev-storage] Verification failed, returning ${status}: ${result.reason}`,
    );
    return NextResponse.json({ error: result.reason }, { status });
  }

  try {
    console.log("[dev-storage] Reading file for key:", key);
    const buffer = await localGetBuffer(key);
    const contentType = contentTypeForKey(key);
    console.log(
      `[dev-storage] File read success. Content-Type: ${contentType}, Size: ${buffer.length} bytes`,
    );

    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    console.error("[dev-storage] Error reading file for key:", key, error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
