import { and, desc, eq } from "drizzle-orm";
import { db } from "../../database/connection";
import { notebooks } from "../../database/schema";
import { NotFoundError } from "../../errors";

export interface CreateNotebookInput {
	title: string;
}

export interface UpdateNotebookInput {
	title: string;
}

export class NotebookService {
	async list(userId: string) {
		return db
			.select()
			.from(notebooks)
			.where(eq(notebooks.userId, userId))
			.orderBy(desc(notebooks.updatedAt));
	}

	async get(userId: string, id: string) {
		const [notebook] = await db
			.select()
			.from(notebooks)
			.where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));
		if (!notebook) {
			throw new NotFoundError("Notebook");
		}
		return notebook;
	}

	async create(userId: string, input: CreateNotebookInput) {
		const [notebook] = await db
			.insert(notebooks)
			.values({ userId, title: input.title })
			.returning();
		return notebook;
	}

	async update(userId: string, id: string, input: UpdateNotebookInput) {
		const [notebook] = await db
			.update(notebooks)
			.set({ title: input.title })
			.where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
			.returning();
		if (!notebook) {
			throw new NotFoundError("Notebook");
		}
		return notebook;
	}

	async delete(userId: string, id: string) {
		const [notebook] = await db
			.delete(notebooks)
			.where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
			.returning();
		if (!notebook) {
			throw new NotFoundError("Notebook");
		}
		return notebook;
	}
}
