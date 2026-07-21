import { StudyMaterialKind } from './shapes';

interface PromptTemplate {
  system: string;
  user: (brief: string, sourceTexts: string) => string;
}

const quizTemplate: PromptTemplate = {
  system: `You are an expert quiz maker. Generate a quiz based on the topic, instructions, or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-quiz'). It must end with the English suffix '-quiz'.
Each question must have 2-6 options with exactly one correct answer.
Every option must have an explanation of why it is correct or incorrect.
Questions should test understanding, not just recall.
Randomize which option is correct across questions.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a quiz based on these instructions: ${brief}`
      : 'Generate a general quiz.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a quiz with questions, each having 2-6 options and exactly one correct answer.`;
  },
};

const simpleFlashcardTemplate: PromptTemplate = {
  system: `You are an expert at creating study flashcards.
Generate a set of clear, concise question/answer flashcards based on the topic, instructions, or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-flashcards'). It must end with the English suffix '-flashcards'.
Each flashcard must have a 'front' (a clear question or prompt) and a 'back' (a complete but concise answer).
Use markdown formatting where appropriate.
Generate between 5 to 15 flashcards depending on the depth of the source material or instructions.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate flashcards based on these instructions: ${brief}`
      : 'Generate a set of flashcards.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a set of flashcards, each containing a front (question) and back (answer).`;
  },
};

const reportTemplate: PromptTemplate = {
  system: `You are an expert report writer. Generate a structured report based on the instructions or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-report'). It must end with the English suffix '-report'.
Start with a brief summary (1-2 sentences).
Then create sections with clear headings and detailed markdown bodies.
Sections should flow logically and cover the key topics.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a report based on these instructions: ${brief}`
      : 'Generate a general report.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a report with a summary and structured sections.`;
  },
};

const roadmapTemplate: PromptTemplate = {
  system: `You are an expert learning designer. Create a structured learning roadmap. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-roadmap'). It must end with the English suffix '-roadmap'.
Organize content into phases, each containing ordered topics.
Each phase should have a clear title and optional description.
Topics should build upon each other logically.
Include estimated minutes for each topic when possible.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a learning roadmap based on these instructions: ${brief}`
      : 'Generate a general learning roadmap.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a learning roadmap with phases and ordered topics.`;
  },
};

const slideDeckTemplate: PromptTemplate = {
  system: `You are an expert presentation designer. Create a slide deck. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-slide-deck'). It must end with the English suffix '-slide-deck'.
Each slide should have a clear title and concise body content.
Use markdown formatting for slide bodies.
Keep slides focused - one idea per slide.
Optional speaker notes should provide additional context.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a slide deck based on these instructions: ${brief}`
      : 'Generate a general slide deck.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a slide deck with titled slides and markdown content.`;
  },
};

const mindMapTemplate: PromptTemplate = {
  system: `You are an expert at visualizing knowledge structures. Create a mind map. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-mind-map'). It must end with the English suffix '-mind-map'.
Generate nodes with clear labels and edges showing relationships.
Most edges should be directed (from parent to child concept).
Use optional colors to group related nodes.
Identify the root node that represents the main topic.`,
  user: (brief, sourceTexts) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a mind map based on these instructions: ${brief}`
      : 'Generate a general mind map.';
    return `${sourceBlock}${instructionsBlock}\n\nGenerate a mind map with nodes and labeled edges showing relationships.`;
  },
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
