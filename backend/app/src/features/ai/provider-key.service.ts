import { and, eq } from "drizzle-orm";
import { db } from "../../database/connection";
import { providerKeys } from "../../database/schema";
import { encrypt, decrypt } from "../../encryption/crypto";
import { NotFoundError } from "../../errors";

export interface ProviderKeyInfo {
	id: string;
	provider: string;
	createdAt: Date;
	lastUsedAt: Date | null;
}

export class ProviderKeyService {
	async list(userId: string): Promise<ProviderKeyInfo[]> {
		const rows = await db
			.select({
				id: providerKeys.id,
				provider: providerKeys.provider,
				createdAt: providerKeys.createdAt,
				lastUsedAt: providerKeys.lastUsedAt,
			})
			.from(providerKeys)
			.where(eq(providerKeys.userId, userId));

		return rows;
	}

	async add(
		userId: string,
		provider: string,
		rawKey: string,
	): Promise<ProviderKeyInfo> {
		const { ciphertext, iv, authTag } = encrypt(rawKey);

		const existing = await db
			.select({ id: providerKeys.id })
			.from(providerKeys)
			.where(
				and(
					eq(providerKeys.userId, userId),
					eq(providerKeys.provider, provider as any),
				),
			);

		if (existing.length > 0) {
			await db
				.update(providerKeys)
				.set({
					encryptedKey: ciphertext,
					iv,
					authTag,
				})
				.where(eq(providerKeys.id, existing[0].id));

			const [row] = await db
				.select({
					id: providerKeys.id,
					provider: providerKeys.provider,
					createdAt: providerKeys.createdAt,
					lastUsedAt: providerKeys.lastUsedAt,
				})
				.from(providerKeys)
				.where(eq(providerKeys.id, existing[0].id));

			return row;
		}

		const [row] = await db
			.insert(providerKeys)
			.values({
				userId,
				provider: provider as any,
				encryptedKey: ciphertext,
				iv,
				authTag,
			})
			.returning({
				id: providerKeys.id,
				provider: providerKeys.provider,
				createdAt: providerKeys.createdAt,
				lastUsedAt: providerKeys.lastUsedAt,
			});

		return row;
	}

	async getDecryptedKey(
		userId: string,
		provider: string,
	): Promise<string | null> {
		const [row] = await db
			.select({
				encryptedKey: providerKeys.encryptedKey,
				iv: providerKeys.iv,
				authTag: providerKeys.authTag,
			})
			.from(providerKeys)
			.where(
				and(
					eq(providerKeys.userId, userId),
					eq(providerKeys.provider, provider as any),
				),
			);

		if (!row) return null;

		await db
			.update(providerKeys)
			.set({ lastUsedAt: new Date() })
			.where(
				and(
					eq(providerKeys.userId, userId),
					eq(providerKeys.provider, provider as any),
				),
			);

		return decrypt(row.encryptedKey, row.iv, row.authTag);
	}

	async delete(userId: string, keyId: string): Promise<void> {
		const [row] = await db
			.select({ id: providerKeys.id, userId: providerKeys.userId })
			.from(providerKeys)
			.where(eq(providerKeys.id, keyId));

		if (!row || row.userId !== userId) {
			throw new NotFoundError("Provider key");
		}

		await db.delete(providerKeys).where(eq(providerKeys.id, keyId));
	}
}
