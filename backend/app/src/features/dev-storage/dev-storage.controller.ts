import { Elysia, t } from "elysia";
import {
  contentTypeForKey,
  localGetBuffer,
  verifyLocalToken,
} from "../../storage/local-fs";

const keyParams = t.Object({
  key: t.String(),
});

export const devStorageController = new Elysia()
  .get(
    "/__dev-storage/:key",
    async ({ params, query, set }) => {
      const key = decodeURIComponent(params.key);
      const verified = verifyLocalToken(
        key,
        query.expires ?? null,
        query.sig ?? null,
      );
      if (!verified.ok) {
        set.status = verified.reason === "expired" ? 410 : 403;
        return { error: `Token ${verified.reason ?? "invalid"}`, code: "forbidden" };
      }

      let buffer: Buffer;
      try {
        buffer = await localGetBuffer(key);
      } catch {
        set.status = 404;
        return { error: "File not found", code: "not_found" };
      }

      const contentType = contentTypeForKey(key);
      const filename = query.filename ?? key.split("/").pop() ?? "download";
      set.headers["content-type"] = contentType;
      set.headers["content-disposition"] =
        `attachment; filename="${filename.replace(/"/g, "")}"`;
      set.headers["content-length"] = String(buffer.length);
      return buffer;
    },
    {
      params: keyParams,
      query: t.Object({
        expires: t.Optional(t.String()),
        sig: t.Optional(t.String()),
        filename: t.Optional(t.String()),
      }),
    },
  );
