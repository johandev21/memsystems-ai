import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/database/connection";
import { cards, notes } from "@/database/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { type CardState, type ReviewGrade, sm2 } from "./sm2.service";

interface CardWithNote {
  id: string;
  noteId: string;
  templateIndex: number;
  state: CardState;
  suspended: boolean;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  lastQuality: number | null;
  lapses: number;
  createdAt: Date;
  note: {
    id: string;
    noteTypeId: string;
    fieldValues: unknown;
  };
}

export interface DueCountResult {
  total: number;
  newCards: number;
  reviewCards: number;
  learningCards: number;
}

export interface ReviewSubmission {
  cardId: string;
  grade: ReviewGrade;
}

export interface SessionSummary {
  cardsReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
}

export class CardService {
  async listDue(userId: string, limit = 100): Promise<CardWithNote[]> {
    const now = new Date();

    const userNotes = await db
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.userId, userId));

    if (userNotes.length === 0) return [];

    const noteIds = userNotes.map((n) => n.id);

    const dueCards = await db
      .select()
      .from(cards)
      .where(
        and(
          inArray(cards.noteId, noteIds),
          eq(cards.suspended, false),
          lte(cards.dueAt, now),
        ),
      )
      .orderBy(
        sql`CASE WHEN ${cards.state} = 'new' THEN 0 ELSE 1 END`,
        desc(cards.dueAt),
      )
      .limit(limit);

    if (dueCards.length === 0) return [];

    const uniqueNoteIds = [...new Set(dueCards.map((c) => c.noteId))];
    const noteRows = await db
      .select()
      .from(notes)
      .where(inArray(notes.id, uniqueNoteIds));

    const noteMap = new Map(noteRows.map((n) => [n.id, n]));

    return dueCards
      .map((card) => {
        const note = noteMap.get(card.noteId);
        if (!note) return null;
        return {
          ...card,
          state: card.state as CardState,
          note: {
            id: note.id,
            noteTypeId: note.noteTypeId,
            fieldValues: note.fieldValues,
          },
        };
      })
      .filter((c): c is CardWithNote => c !== null);
  }

  async getDueCount(userId: string): Promise<DueCountResult> {
    const now = new Date();

    const userNotes = await db
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.userId, userId));

    if (userNotes.length === 0) {
      return { total: 0, newCards: 0, reviewCards: 0, learningCards: 0 };
    }

    const noteIds = userNotes.map((n) => n.id);

    const allCards = await db
      .select({
        state: cards.state,
        dueAt: cards.dueAt,
        suspended: cards.suspended,
      })
      .from(cards)
      .where(inArray(cards.noteId, noteIds));

    let newCards = 0;
    let reviewCards = 0;
    let learningCards = 0;

    for (const c of allCards) {
      if (c.suspended) continue;
      if (c.state === "new") {
        newCards++;
      } else if (c.dueAt <= now) {
        if (c.state === "learning") learningCards++;
        else reviewCards++;
      }
    }

    return {
      total: newCards + reviewCards + learningCards,
      newCards,
      reviewCards,
      learningCards,
    };
  }

  async get(userId: string, cardId: string): Promise<CardWithNote> {
    const card = await this.fetchOwned(userId, cardId);
    const note = await this.fetchNote(card.noteId);

    return {
      ...card,
      state: card.state as CardState,
      note: {
        id: note.id,
        noteTypeId: note.noteTypeId,
        fieldValues: note.fieldValues,
      },
    };
  }

  async submitReview(
    userId: string,
    cardId: string,
    grade: ReviewGrade,
  ): Promise<CardWithNote> {
    const card = await this.fetchOwned(userId, cardId);

    if (card.suspended) {
      throw new BadRequestError("Cannot review a suspended card");
    }

    const result = sm2(
      {
        state: card.state as CardState,
        easinessFactor: card.easinessFactor,
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
        lapses: card.lapses,
      },
      grade,
    );

    const [updated] = await db
      .update(cards)
      .set({
        state: result.state,
        easinessFactor: result.easinessFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
        lapses: result.lapses,
        dueAt: result.dueAt,
        lastReviewedAt: new Date(),
        lastQuality: grade,
      })
      .where(eq(cards.id, cardId))
      .returning();

    const note = await this.fetchNote(updated.noteId);

    return {
      ...updated,
      state: updated.state as CardState,
      note: {
        id: note.id,
        noteTypeId: note.noteTypeId,
        fieldValues: note.fieldValues,
      },
    };
  }

  async suspend(userId: string, cardId: string): Promise<CardWithNote> {
    const card = await this.fetchOwned(userId, cardId);

    const [updated] = await db
      .update(cards)
      .set({ suspended: !card.suspended })
      .where(eq(cards.id, cardId))
      .returning();

    const note = await this.fetchNote(updated.noteId);

    return {
      ...updated,
      state: updated.state as CardState,
      note: {
        id: note.id,
        noteTypeId: note.noteTypeId,
        fieldValues: note.fieldValues,
      },
    };
  }

  async unsuspend(userId: string, cardId: string): Promise<CardWithNote> {
    const _card = await this.fetchOwned(userId, cardId);

    const [updated] = await db
      .update(cards)
      .set({ suspended: false })
      .where(eq(cards.id, cardId))
      .returning();

    const note = await this.fetchNote(updated.noteId);

    return {
      ...updated,
      state: updated.state as CardState,
      note: {
        id: note.id,
        noteTypeId: note.noteTypeId,
        fieldValues: note.fieldValues,
      },
    };
  }

  private async fetchOwned(userId: string, cardId: string) {
    const [card] = await db.select().from(cards).where(eq(cards.id, cardId));

    if (!card) {
      throw new NotFoundError("Card");
    }

    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, card.noteId), eq(notes.userId, userId)));

    if (!note) {
      throw new ForbiddenError("Card does not belong to user");
    }

    return card;
  }

  private async fetchNote(noteId: string) {
    const [note] = await db.select().from(notes).where(eq(notes.id, noteId));

    if (!note) {
      throw new NotFoundError("Note");
    }
    return note;
  }
}
