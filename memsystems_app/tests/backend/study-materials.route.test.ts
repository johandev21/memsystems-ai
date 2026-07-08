import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));

import { GET as getMaterial } from "../../src/app/api/study-materials/[id]/route";
import { seedNotebook, seedStudyMaterial, seedUser } from "../fixtures";

function makeUrl(path: string) {
  return new URL(`http://localhost:3000${path}`);
}

describe("Study Materials route handlers", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
  });

  describe("GET /api/study-materials/[id]", () => {
    it("returns 401 without a session", async () => {
      mocks.getSession.mockResolvedValue(null);
      const req = new NextRequest(makeUrl("/api/study-materials/sm-1"));
      const res = await getMaterial(req, {
        params: Promise.resolve({ id: "sm-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns single study material for the authenticated owner", async () => {
      const u = await seedUser();
      const notebook = await seedNotebook(u.id);
      const sm = await seedStudyMaterial(notebook.id, {
        kind: "quiz",
        title: "Test Quiz",
        content: { questions: [] },
      });
      mocks.getSession.mockResolvedValue({ user: { id: u.id } });

      const req = new NextRequest(makeUrl(`/api/study-materials/${sm.id}`));
      const res = await getMaterial(req, {
        params: Promise.resolve({ id: sm.id }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toMatchObject({
        id: sm.id,
        title: "Test Quiz",
        kind: "quiz",
      });
    });
  });
});
