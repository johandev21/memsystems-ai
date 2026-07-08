import { getPromptTemplate } from "../../generation/prompts";
import type { StudyMaterialKind } from "../../study-materials/shapes";

export function buildSystemPrompt(kind: StudyMaterialKind): string {
  return getPromptTemplate(kind).system;
}

export function buildUserPrompt(
  kind: StudyMaterialKind,
  brief: string,
  sourceTexts: { title: string; rawText: string }[],
): string {
  const concatenatedSources = sourceTexts
    .map((s) => `[${s.title}]\n${s.rawText}`)
    .join("\n\n---\n\n");
  const truncatedSources = concatenatedSources.slice(0, 100000);
  return getPromptTemplate(kind).user(brief, truncatedSources);
}
