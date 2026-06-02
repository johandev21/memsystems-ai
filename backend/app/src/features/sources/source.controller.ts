import { Elysia, t } from "elysia";
import { auth } from "../../auth";
import { DomainError } from "../../errors";
import { SourceService } from "./source.service";

const sourceService = new SourceService();

const errorResponse = t.Object({
  error: t.String(),
  code: t.String(),
});

const notebookIdParams = t.Object({ id: t.String() });
const sourceIdParams = t.Object({ id: t.String() });

const textBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 500 }),
  rawText: t.String({ minLength: 1 }),
});

const urlBody = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
  title: t.Optional(t.String({ maxLength: 500 })),
});

const fileBody = t.Object({
  title: t.Optional(t.String({ maxLength: 500 })),
  file: t.File(),
});

const downloadResponse = t.Object({
  url: t.String(),
  expiresIn: t.Number(),
});

export const sourceController = new Elysia()
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return { user: session.user, session: session.session };
      },
    },
  })
  .onError(({ error, set }) => {
    if (error instanceof DomainError) {
      set.status = error.status;
      return { error: error.message, code: error.code };
    }
  })
  .get("/notebooks/:id/sources", ({ user, params }) =>
    sourceService.list(user.id, params.id), {
    auth: true,
    params: notebookIdParams,
  })
  .post("/notebooks/:id/sources/text", ({ user, params, body }) =>
    sourceService.createText(user.id, params.id, body), {
    auth: true,
    params: notebookIdParams,
    body: textBody,
  })
  .post("/notebooks/:id/sources/url", ({ user, params, body }) =>
    sourceService.createUrl(user.id, params.id, body), {
    auth: true,
    params: notebookIdParams,
    body: urlBody,
  })
  .post("/notebooks/:id/sources/file", ({ user, params, body }) =>
    sourceService.createFile(user.id, params.id, {
      file: body.file,
      title: body.title,
    }), {
    auth: true,
    params: notebookIdParams,
    body: fileBody,
  })
  .get("/sources/:id", ({ user, params }) =>
    sourceService.get(user.id, params.id), {
    auth: true,
    params: sourceIdParams,
  })
  .delete("/sources/:id", ({ user, params }) =>
    sourceService.delete(user.id, params.id), {
    auth: true,
    params: sourceIdParams,
  })
  .get("/sources/:id/download", async ({ user, params, query }) => {
    const expiresIn = query.expiresIn ?? 300;
    return sourceService.getDownload(user.id, params.id, expiresIn);
  }, {
    auth: true,
    params: sourceIdParams,
    query: t.Object({
      expiresIn: t.Optional(t.Number({ minimum: 1, maximum: 3600 })),
    }),
    response: downloadResponse,
  });

export const sourceErrorResponse = errorResponse;
