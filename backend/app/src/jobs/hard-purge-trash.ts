import { sql } from "drizzle-orm";
import { db } from "../database/connection";
import {
	studyMaterialFolders,
	studyMaterials,
} from "../database/schema";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function hardPurgeTrash() {
	const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

	await db
		.delete(studyMaterials)
		.where(sql`${studyMaterials.deletedAt} < ${cutoff}`);

	await db
		.delete(studyMaterialFolders)
		.where(sql`${studyMaterialFolders.deletedAt} < ${cutoff}`);

	console.log(`[hard-purge-trash] Purged items older than ${cutoff.toISOString()}`);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHardPurgeJob() {
	if (intervalId) return;
	intervalId = setInterval(hardPurgeTrash, 24 * 60 * 60 * 1000);
	console.log("[hard-purge-trash] Job registered (runs every 24h)");
}

export function stopHardPurgeJob() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
}
