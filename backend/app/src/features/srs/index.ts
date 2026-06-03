import { cardController } from "./card.controller";
import { noteController } from "./note.controller";
import { noteTypeController } from "./note-type.controller";
import { promotionController } from "./promotion.controller";
import { tagController } from "./tag.controller";

export const srsModule = [
	noteTypeController,
	noteController,
	cardController,
	tagController,
	promotionController,
];

export { NoteTypeService } from "./note-type.service";
export { NoteService } from "./note.service";
export { CardService } from "./card.service";
export { TagService } from "./tag.service";
export { PromotionService } from "./promotion.service";
export { sm2 } from "./sm2.service";
export type {
	FieldSchema,
	CardTemplate,
	CreateNoteTypeInput,
} from "./note-type.service";
export type { CreateNoteInput, UpdateNoteInput } from "./note.service";
export type { ReviewGrade, Sm2CardInput, Sm2CardOutput } from "./sm2.service";
