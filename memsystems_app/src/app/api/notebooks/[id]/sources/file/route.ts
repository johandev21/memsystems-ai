import { NextResponse } from "next/server";
import { withRoute } from "@/app/api/_shared/route-utils";
import { SourceService } from "@/features/sources/source.service";
import { BadRequestError } from "@/lib/errors";

const service = new SourceService();

export const POST = (
  req: Request,
  context: { params: Promise<{ id: string }> },
) =>
  withRoute(req, context, async (req, { params, session }) => {
    const [{ id }, formData] = await Promise.all([params, req.formData()]);
    const file = formData.get("file") as File | null;
    if (!file) throw new BadRequestError("File is required");
    const title = formData.get("title") as string | undefined;
    const source = await service.createFile(session.user.id, id, {
      file,
      title,
    });
    return NextResponse.json(source);
  });
