import { StudyMaterialKind } from './shapes';

export interface QuizGenerationOptions {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardGenerationOptions {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cardStyle: 'qa' | 'definition' | 'cloze' | 'mixed';
}

interface ReportOptions {
  type: 'summary' | 'detailed' | 'academic' | 'executive';
  tone: 'formal' | 'conversational' | 'technical' | 'journalistic';
  length: 'short' | 'medium' | 'long' | 'comprehensive' | 'custom';
  sectionCount: number;
  includeSummary: boolean;
  includeCitations: boolean;
  sections?: string[];
}

export type ReportGenerationOptions = ReportOptions;

export type StudyMaterialOptions =
  | ({ kind: 'quiz' } & QuizGenerationOptions)
  | ({ kind: 'simple_flashcard' } & FlashcardGenerationOptions)
  | ({ kind: 'report' } & ReportOptions);

interface PromptTemplate {
  system: string;
  user: (
    brief: string,
    sourceTexts: string,
    options?: {
      questionCount?: number;
      difficulty?: string;
      cardStyle?: 'qa' | 'definition' | 'cloze' | 'mixed';
      reportOptions?: ReportOptions;
      roadmapOptions?: {
        phaseCount: number;
        detailLevel: 'basic' | 'detailed';
        includeTimeEstimates: boolean;
        includeResources: boolean;
      };
      slideDeckOptions?: {
        slideCount: number;
        style: 'concise' | 'detailed' | 'storytelling';
        audience: 'beginner' | 'intermediate' | 'expert';
        includeSpeakerNotes: boolean;
      };
      mindMapOptions?: {
        nodeCount: number;
        structure: 'radial' | 'hierarchical' | 'organic';
        colorGroups: boolean;
        crossLinks: boolean;
      };
    },
  ) => string;
}

const quizTemplate: PromptTemplate = {
  system: `You are an expert quiz maker. Generate a quiz based on the topic, instructions, or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-quiz'). It must end with the English suffix '-quiz'.
Each question must have 2-6 options with exactly one correct answer.
Every option must have an explanation of why it is correct or incorrect.
Questions should test understanding, not just recall.
Randomize which option is correct across questions.`,
  user: (brief, sourceTexts, options) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : 'Source material: None provided. Generate quiz using general knowledge.\n\n';
    const instructionsBlock = brief
      ? `Generate a quiz based on these instructions: ${brief}`
      : 'Generate a general quiz.';
    const countText = options?.questionCount
      ? `Generate EXACTLY ${options.questionCount} questions.`
      : 'Generate a comprehensive quiz.';
    const diffText = options?.difficulty
      ? `Target difficulty level: ${options.difficulty} (${
          options.difficulty === 'easy'
            ? 'Warmup: basic recall and definitions'
            : options.difficulty === 'hard'
              ? 'Challenge: deep reasoning, complex logic, and edge cases'
              : 'Standard: balanced conceptual and practical application'
        }).`
      : '';
    return `${sourceBlock}${instructionsBlock}\n\n${countText} ${diffText}\nGenerate a quiz with questions, each having 2-6 options and exactly one correct answer.`;
  },
};

const simpleFlashcardTemplate: PromptTemplate = {
  system: `You are an expert at creating study flashcards.
Generate a set of clear, concise flashcards based on the topic, instructions, or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-flashcards'). It must end with the English suffix '-flashcards'.
Each flashcard must have a 'front' (a clear question or prompt) and a 'back' (a complete but concise answer).
Use markdown formatting where appropriate.`,
  user: (brief, sourceTexts, options) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate flashcards based on these instructions: ${brief}`
      : 'Generate a set of flashcards.';
    const countText = options?.questionCount
      ? `Generate EXACTLY ${options.questionCount} flashcards.`
      : '';
    const diffText = options?.difficulty
      ? `Target difficulty level: ${options.difficulty} (${
          options.difficulty === 'easy'
            ? 'Basic recall and definitions'
            : options.difficulty === 'hard'
              ? 'Deep analysis, complex reasoning, and edge cases'
              : 'Conceptual understanding and application'
        }).`
      : '';
    const styleText = options?.cardStyle
      ? `Card format: ${
          options.cardStyle === 'qa'
            ? 'Question → Answer pairs'
            : options.cardStyle === 'definition'
              ? 'Term → Definition pairs'
              : options.cardStyle === 'cloze'
                ? 'Fill-in-the-blank sentences with a missing word or phrase indicated by "___"'
                : 'Mixed format: generate a diverse combination of Question → Answer pairs, Term → Definition pairs, and Fill-in-the-blank sentences (with missing word indicated by "___").'
        }.`
      : '';
    return `${sourceBlock}${instructionsBlock}\n\n${countText} ${diffText} ${styleText}\n\nGenerate a set of flashcards, each containing a front (question) and back (answer).`;
  },
};

const reportTemplate: PromptTemplate = {
  system: `You are an expert report writer. Generate a structured report based on the instructions or source material provided. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-report'). It must end with the English suffix '-report'.
Start with a brief summary (1-2 sentences).
Then create sections with clear headings and detailed markdown bodies.
Sections should flow logically and cover the key topics.`,
  user: (brief, sourceTexts, options) => {
    const opts = options?.reportOptions;
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a report based on these instructions: ${brief}`
      : 'Generate a general report.';

    const typeText = opts?.type ? `Report type: ${opts.type}.` : '';
    const toneText = opts?.tone ? `Use a ${opts.tone} tone.` : '';
    const sectionText = opts?.sectionCount
      ? `Generate EXACTLY ${opts.sectionCount} sections.`
      : '';
    const structureText =
      opts?.sections && opts.sections.length > 0
        ? `Use the following section structure in this exact order:\n${opts.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : '';
    const summaryText = opts?.includeSummary
      ? 'Include an executive summary at the beginning.'
      : 'Do not include an executive summary.';
    const citationsText = opts?.includeCitations
      ? 'Include citations or references where applicable.'
      : 'Do not include citations.';

    return `${sourceBlock}${instructionsBlock}\n\n${typeText} ${toneText} ${sectionText}\n${summaryText} ${citationsText}\n${structureText}\n\nGenerate a report with a summary and structured sections.`;
  },
};

const roadmapTemplate: PromptTemplate = {
  system: `You are an expert learning designer. Create a structured learning roadmap. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-roadmap'). It must end with the English suffix '-roadmap'.
Organize content into phases, each containing ordered topics.
Each phase should have a clear title and optional description.
Topics should build upon each other logically.
Include estimated minutes for each topic when possible.`,
  user: (brief, sourceTexts, options) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a learning roadmap based on these instructions: ${brief}`
      : 'Generate a general learning roadmap.';
    const opts = options?.roadmapOptions;
    const phaseText = opts?.phaseCount
      ? `Create EXACTLY ${opts.phaseCount} phases.`
      : '';
    const detailText = opts?.detailLevel
      ? `Detail level: ${
          opts.detailLevel === 'detailed'
            ? 'Include detailed topic descriptions and explanations'
            : 'Keep topics concise with brief descriptions'
        }.`
      : '';
    const estimatesText = opts?.includeTimeEstimates
      ? 'Include estimated minutes for each topic.'
      : '';
    const resourcesText = opts?.includeResources
      ? 'Include suggested resources or references for each phase where applicable.'
      : '';
    return `${sourceBlock}${instructionsBlock}\n\n${phaseText} ${detailText}\n${estimatesText} ${resourcesText}\n\nGenerate a learning roadmap with phases and ordered topics.`;
  },
};

const slideDeckTemplate: PromptTemplate = {
  system: `You are an expert presentation designer. Create a slide deck. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-slide-deck'). It must end with the English suffix '-slide-deck'.
Each slide should have a clear title and concise body content.
Use markdown formatting for slide bodies.
Keep slides focused - one idea per slide.
Optional speaker notes should provide additional context.`,
  user: (brief, sourceTexts, options) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a slide deck based on these instructions: ${brief}`
      : 'Generate a general slide deck.';
    const opts = options?.slideDeckOptions;
    const countText = opts?.slideCount
      ? `Create EXACTLY ${opts.slideCount} slides.`
      : '';
    const styleText = opts?.style
      ? `Style: ${
          opts.style === 'concise'
            ? 'Brief bullet points, minimal text per slide'
            : opts.style === 'storytelling'
              ? 'Narrative flow with engaging transitions between slides'
              : 'Detailed content with thorough explanations per slide'
        }.`
      : '';
    const audienceText = opts?.audience
      ? `Target audience: ${opts.audience} level.`
      : '';
    const notesText = opts?.includeSpeakerNotes
      ? 'Include speaker notes for each slide.'
      : 'Do not include speaker notes.';
    return `${sourceBlock}${instructionsBlock}\n\n${countText} ${styleText}\n${audienceText} ${notesText}\n\nGenerate a slide deck with titled slides and markdown content.`;
  },
};

const mindMapTemplate: PromptTemplate = {
  system: `You are an expert at visualizing knowledge structures. Create a mind map. Generate a descriptive, unique title reflecting the core topic or overview of the material and place it in the 'title' field. The title must be concise (a bit short) and formatted in kebab-case (lowercase, alphanumeric characters and hyphens only, with all spaces replaced by hyphens and accented characters normalized to English letters, e.g. 'concepcion-de-socrates-platon-y-aristoteles-mind-map'). It must end with the English suffix '-mind-map'.
Generate nodes with clear labels and edges showing relationships.
Most edges should be directed (from parent to child concept).
Use optional colors to group related nodes.
Identify the root node that represents the main topic.`,
  user: (brief, sourceTexts, options) => {
    const sourceBlock = sourceTexts
      ? `Source material:\n${sourceTexts}\n\n`
      : '';
    const instructionsBlock = brief
      ? `Generate a mind map based on these instructions: ${brief}`
      : 'Generate a general mind map.';
    const opts = options?.mindMapOptions;
    const countText = opts?.nodeCount
      ? `Generate approximately ${opts.nodeCount} nodes.`
      : '';
    const structureText = opts?.structure
      ? `Use a ${opts.structure} layout structure.`
      : '';
    const colorText = opts?.colorGroups
      ? 'Use distinct colors to group related nodes by theme or category.'
      : '';
    const crossText = opts?.crossLinks
      ? 'Include cross-links between related nodes across different branches.'
      : '';
    return `${sourceBlock}${instructionsBlock}\n\n${countText} ${structureText}\n${colorText} ${crossText}\n\nGenerate a mind map with nodes and labeled edges showing relationships.`;
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
