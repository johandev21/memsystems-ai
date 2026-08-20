import type { FolderDTO } from "@/entities/folder";
import type { StudyMaterialDTO } from "@/entities/study-material";

export const PROTOTYPE_NOTEBOOK_ID = "notebook-philosophy-2026";

const prototypeDate = "2026-08-18T14:00:00.000Z";

export const INITIAL_PROTOTYPE_TREE_STATE: {
  readonly folders: readonly FolderDTO[];
  readonly materials: readonly StudyMaterialDTO[];
} = {
  folders: [
    {
      id: "folder-foundations",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: null,
      name: "Foundations",
      deletedAt: null,
      createdAt: "2026-08-11T09:00:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-metaphysics",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: "folder-foundations",
      name: "Metaphysics",
      deletedAt: null,
      createdAt: "2026-08-11T09:05:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-western-traditions",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: "folder-metaphysics",
      name: "Western traditions",
      deletedAt: null,
      createdAt: "2026-08-11T09:10:00.000Z",
      updatedAt: prototypeDate,
    },
    {
      id: "folder-exam-review",
      notebookId: PROTOTYPE_NOTEBOOK_ID,
      parentId: null,
      name: "Exam review",
      deletedAt: null,
      createdAt: "2026-08-13T10:00:00.000Z",
      updatedAt: prototypeDate,
    },
  ],
  materials: [
    createMaterial({
      id: "material-metaphilosophy-quiz",
      title: "Metafilosofía occidental: conceptos y tradiciones",
      kind: "quiz",
      folderId: "folder-western-traditions",
      createdAt: "2026-08-11T10:00:00.000Z",
    }),
    createMaterial({
      id: "material-being-flashcards",
      title: "Ser, esencia y existencia",
      kind: "simple_flashcard",
      folderId: "folder-western-traditions",
      createdAt: "2026-08-11T10:10:00.000Z",
    }),
    createMaterial({
      id: "material-aristotle-roadmap",
      title: "Ruta de estudio: Aristóteles y la metafísica",
      kind: "roadmap",
      folderId: "folder-metaphysics",
      createdAt: "2026-08-11T10:20:00.000Z",
    }),
    createMaterial({
      id: "material-ontology-map",
      title: "Ontología: mapa de conceptos",
      kind: "mind_map",
      folderId: "folder-metaphysics",
      createdAt: "2026-08-11T10:30:00.000Z",
    }),
    createMaterial({
      id: "material-logic-quiz",
      title: "Argumentación, validez y falacias",
      kind: "quiz",
      folderId: "folder-foundations",
      createdAt: "2026-08-12T08:00:00.000Z",
    }),
    createMaterial({
      id: "material-reading-plan",
      title: "Plan de lectura para el examen final",
      kind: "roadmap",
      folderId: "folder-exam-review",
      createdAt: "2026-08-13T10:20:00.000Z",
    }),
    createMaterial({
      id: "material-exam-flashcards",
      title: "Repaso rápido: autores y obras",
      kind: "simple_flashcard",
      folderId: "folder-exam-review",
      createdAt: "2026-08-13T10:30:00.000Z",
    }),
    createMaterial({
      id: "material-epistemology-map",
      title: "Epistemología comparada",
      kind: "mind_map",
      folderId: null,
      createdAt: "2026-08-14T11:00:00.000Z",
    }),
    createMaterial({
      id: "material-seminar-quiz",
      title: "Seminario 4: conocimiento y justificación",
      kind: "quiz",
      folderId: null,
      createdAt: "2026-08-15T11:30:00.000Z",
    }),
  ],
};

function createMaterial({
  id,
  title,
  kind,
  folderId,
  createdAt,
}: Pick<StudyMaterialDTO, "id" | "title" | "kind" | "folderId" | "createdAt">): StudyMaterialDTO {
  return {
    id,
    notebookId: PROTOTYPE_NOTEBOOK_ID,
    kind,
    title,
    folderId,
    content: {},
    options: {},
    deletedAt: null,
    createdAt,
    updatedAt: prototypeDate,
  };
}
