import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StudyMaterialFolderService } from "@/features/study-materials/study-material-folder.service";
import { toErrorResponse } from "@/lib/api-error";
import { getSession } from "@/lib/session";

const service = new StudyMaterialFolderService();

const createSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const folders = await service.list(session.user.id, id);
    return NextResponse.json(folders);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = createSchema.parse(await req.json());
    const folder = await service.create(session.user.id, id, body);
    return NextResponse.json(folder);
  } catch (err) {
    return toErrorResponse(err);
  }
}
