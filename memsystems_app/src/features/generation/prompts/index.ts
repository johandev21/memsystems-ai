import type { StudyMaterialKind } from "@/features/study-materials/shapes";

interface PromptTemplate {
  system: string;
  user: (brief: string, sourceTexts: string) => string;
}

const quizTemplate: PromptTemplate = {
  system: `You are an expert quiz maker. Generate a quiz based on the provided source material.
Each question must have 2-6 options with exactly one correct answer.
Every option must have an explanation of why it is correct or incorrect.
Questions should test understanding, not just recall.
Randomize which option is correct across questions.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate a quiz with questions, each having 2-6 options and exactly one correct answer.`,
};

const simpleFlashcardTemplate: PromptTemplate = {
  system: `You are an expert at creating study flashcards.
Generate clear, concise question/answer pairs.
The front should be a clear question or prompt.
The back should be a complete but concise answer.
Use markdown formatting where appropriate.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate flashcard pairs with a front (question) and back (answer).`,
};

const reportTemplate: PromptTemplate = {
  system: `You are an expert report writer. Generate a structured report based on the provided source material.
Start with a brief summary (1-2 sentences).
Then create sections with clear headings and detailed markdown bodies.
Sections should flow logically and cover the key topics.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate a report with a summary and structured sections.`,
};

const roadmapTemplate: PromptTemplate = {
  system: `You are an expert learning designer. Create a structured learning roadmap.
Organize content into phases, each containing ordered topics.
Each phase should have a clear title and optional description.
Topics should build upon each other logically.
Include estimated minutes for each topic when possible.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate a learning roadmap with phases and ordered topics.`,
};

const slideDeckTemplate: PromptTemplate = {
  system: `You are an expert presentation designer. Create a slide deck.
Each slide should have a clear title and concise body content.
Use markdown formatting for slide bodies.
Keep slides focused - one idea per slide.
Optional speaker notes should provide additional context.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate a slide deck with titled slides and markdown content.`,
};

const mindMapTemplate: PromptTemplate = {
  system: `You are an expert at visualizing knowledge structures. Create a mind map.
Generate nodes with clear labels and edges showing relationships.
Most edges should be directed (from parent to child concept).
Use optional colors to group related nodes.
Identify the root node that represents the main topic.`,
  user: (brief, sourceTexts) => `Source material:
${sourceTexts}

${brief ? `Additional instructions: ${brief}` : ""}

Generate a mind map with nodes and labeled edges showing relationships.`,
};

const templates: Record<StudyMaterialKind, PromptTemplate> = {
  quiz: quizTemplate,
  simple_flashcard: simpleFlashcardTemplate,
  report: reportTemplate,
  roadmap: roadmapTemplate,
  slide_deck: slideDeckTemplate,
  mind_map: mindMapTemplate,
};

export function getPromptTemplate(kind: StudyMaterialKind): PromptTemplate {
  return templates[kind];
}
