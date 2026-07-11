import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { NotebookService } from "@/features/notebooks/notebook.service";

const service = new NotebookService();

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, formData] = await Promise.all([
      params,
      req.formData(),
    ]);
    const file = formData.get("file") as File | null;

    const focalPointRaw = formData.get("focalPoint");
    let focalPoint: { x: number; y: number } | undefined;
    if (typeof focalPointRaw === "string") {
      try {
        focalPoint = JSON.parse(focalPointRaw);
      } catch {}
    }

    const notebook = await service.uploadBanner(
      session.user.id,
      id,
      file,
      focalPoint,
    );
    return NextResponse.json(notebook);
  });

export const DELETE = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (_req, { params, session }) => {
    const { id } = await params;
    const notebook = await service.removeBanner(session.user.id, id);
    return NextResponse.json(notebook);
  });
