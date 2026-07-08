import { sql } from "drizzle-orm";
import { db } from "@/database/connection";
import { studyMaterialFolders, studyMaterials } from "@/database/schema";
import { logger } from "@/lib/logging/logger";

const jobLog = logger.child({ feature: "hard-purge-trash" });

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function hardPurgeTrash() {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  try {
    await db
      .delete(studyMaterials)
      .where(sql`${studyMaterials.deletedAt} < ${cutoff}`);

    await db
      .delete(studyMaterialFolders)
      .where(sql`${studyMaterialFolders.deletedAt} < ${cutoff}`);

    jobLog.info("Purged old trashed items", { cutoff: cutoff.toISOString() });
  } catch (error) {
    jobLog.error("Failed to purge trashed items", {
      error,
      cutoff: cutoff.toISOString(),
    });
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHardPurgeJob() {
  if (intervalId) return;
  intervalId = setInterval(hardPurgeTrash, 24 * 60 * 60 * 1000);
  jobLog.info("Hard-purge job registered (runs every 24h)");
}

export function stopHardPurgeJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
