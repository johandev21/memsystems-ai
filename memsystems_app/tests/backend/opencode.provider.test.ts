import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { opencodeProvider } from "@/features/ai/providers/opencode";

describe("opencodeProvider", () => {
  describe("createModel", () => {
    it("pins every model instance to the sandbox directory", () => {
      const model = opencodeProvider.createModel("opencode-go/glm-5.2");
      const settings = (
        model as unknown as { settings: { directory?: string } }
      ).settings;
      expect(settings.directory).toBe(
        path.join(tmpdir(), "memsystems-llm-cwd"),
      );
    });

    it("uses the read-only plan agent", () => {
      const model = opencodeProvider.createModel("opencode-go/glm-5.2");
      const settings = (
        model as unknown as {
          settings: { agent?: string };
        }
      ).settings;
      expect(settings.agent).toBe("plan");
    });

    it("denies write/exec tools via the permission ruleset", () => {
      const model = opencodeProvider.createModel("opencode-go/glm-5.2");
      const settings = (
        model as unknown as {
          settings: {
            permission?: Array<{
              permission: string;
              pattern: string;
              action: string;
            }>;
          };
        }
      ).settings;
      const rules = settings.permission ?? [];
      const byPermission = new Map(rules.map((r) => [r.permission, r]));
      for (const p of [
        "bash",
        "edit",
        "write",
        "websearch",
        "task",
        "external_directory",
      ]) {
        expect(
          byPermission.get(p)?.action,
          `permission ${p} should be deny`,
        ).toBe("deny");
      }
    });
  });

  describe("listModels", () => {
    it("advertises at least one model and every id is well-formed", () => {
      const models = opencodeProvider.listModels();
      expect(models.length).toBeGreaterThan(0);
      for (const m of models) {
        expect(m.id).toMatch(/^[a-z0-9-]+\/[a-z0-9.-]+$/);
        expect(m.displayName.length).toBeGreaterThan(0);
      }
    });
  });
});
