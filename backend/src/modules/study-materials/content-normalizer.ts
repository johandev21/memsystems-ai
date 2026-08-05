import { StudyMaterialKind } from './shapes';

export function normalizeFlashcardContent(content: any): any {
  let cardsList: any[] = [];

  if (Array.isArray(content)) {
    cardsList = content;
  } else if (content && typeof content === 'object') {
    if (Array.isArray(content.cards)) {
      cardsList = content.cards;
    } else if (Array.isArray(content.flashcards)) {
      cardsList = content.flashcards;
    } else {
      const arrayKey = Object.keys(content).find((k) =>
        Array.isArray(content[k]),
      );
      if (arrayKey) {
        cardsList = content[arrayKey];
      } else if ('front' in content || 'back' in content) {
        cardsList = [content];
      }
    }
  }

  if (cardsList.length === 0) {
    cardsList = [{ front: 'Front', back: 'Back' }];
  }

  const normalizedCards = cardsList.map((card: any, index: number) => {
    if (!card || typeof card !== 'object') {
      return {
        front: String(card) || `Question ${index + 1}`,
        back: 'Answer',
      };
    }
    const front = card.front ?? card.question ?? card.prompt ?? card.q ?? '';
    const back = card.back ?? card.answer ?? card.response ?? card.a ?? '';
    return {
      front: String(front) || `Question ${index + 1}`,
      back: String(back) || 'Answer',
    };
  });

  return {
    title: content.title ? String(content.title) : undefined,
    cards: normalizedCards,
  };
}

export function normalizeQuizContent(content: any): any {
  let questions = content.questions;
  if (Array.isArray(content)) {
    questions = content;
  } else if (!Array.isArray(questions)) {
    const arrayKey = Object.keys(content).find((k) =>
      Array.isArray(content[k]),
    );
    if (arrayKey) {
      questions = content[arrayKey];
    } else {
      questions = [content];
    }
  }

  const normalizedQuestions = questions.map((q: any, index: number) => {
    if (!q || typeof q !== 'object') {
      return {
        id: `q-${index}`,
        prompt: String(q),
        options: [
          { id: `q-${index}-o-0`, text: 'Option A', explanation: '' },
          { id: `q-${index}-o-1`, text: 'Option B', explanation: '' },
        ],
        correctOptionId: `q-${index}-o-0`,
      };
    }

    const prompt = q.prompt ?? q.question ?? q.text ?? q.title ?? 'Question';
    let options = q.options ?? q.choices ?? q.answers ?? [];
    if (!Array.isArray(options)) {
      options = [];
    }

    const normalizedOptions = options.map((opt: any, optionIndex: number) => {
      if (typeof opt === 'string') {
        return {
          id: `q-${index}-o-${optionIndex}`,
          text: opt,
          explanation: 'Correct answer choice',
        };
      }
      return {
        id: String(opt.id ?? `q-${index}-o-${optionIndex}`),
        text: opt.text ?? opt.choice ?? opt.value ?? 'Option',
        explanation: opt.explanation ?? opt.reason ?? 'Explanation',
      };
    });

    while (normalizedOptions.length < 2) {
      normalizedOptions.push({
        id: `q-${index}-o-${normalizedOptions.length}`,
        text: `Option ${String.fromCharCode(65 + normalizedOptions.length)}`,
        explanation: 'Placeholder option',
      });
    }

    if (normalizedOptions.length > 6) {
      normalizedOptions.length = 6;
    }

    let correctOptionId: string | undefined;
    const rawCorrectId = q.correctOptionId ?? q.correct_option_id;
    if (typeof rawCorrectId === 'string') {
      const matchingOption = normalizedOptions.find(
        (opt: any) => opt.id === rawCorrectId,
      );
      if (matchingOption) {
        correctOptionId = matchingOption.id;
      }
    }

    let correctOptionIndex = -1;
    const rawCorrect =
      q.correctOptionIndex ??
      q.correct_option_index ??
      q.correctIndex ??
      q.correctAnswer ??
      q.correct_answer ??
      q.answer;

    if (!correctOptionId && typeof rawCorrect === 'number') {
      correctOptionIndex = rawCorrect;
    } else if (!correctOptionId && typeof rawCorrect === 'string') {
      const trimmed = rawCorrect.trim();
      if (/^[a-fA-F]$/.test(trimmed)) {
        correctOptionIndex = trimmed.toUpperCase().charCodeAt(0) - 65;
      } else if (/^option\s*([a-fA-F])$/i.test(trimmed)) {
        const letter = trimmed.match(/^option\s*([a-fA-F])$/i)![1];
        correctOptionIndex = letter.toUpperCase().charCodeAt(0) - 65;
      } else if (/^\d+$/.test(trimmed)) {
        correctOptionIndex = parseInt(trimmed, 10);
      } else {
        const idx = normalizedOptions.findIndex(
          (opt: any) => opt.text.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (idx >= 0) {
          correctOptionIndex = idx;
        }
      }
    }

    // Check option explanations for explicit "Correct" or "Right answer" vs "Incorrect"
    if (
      !correctOptionId &&
      (correctOptionIndex < 0 || correctOptionIndex >= normalizedOptions.length)
    ) {
      const explicitCorrectIdx = normalizedOptions.findIndex(
        (opt: any) =>
          /^correct/i.test(opt.explanation.trim()) ||
          /^right/i.test(opt.explanation.trim()),
      );
      if (explicitCorrectIdx >= 0) {
        correctOptionIndex = explicitCorrectIdx;
      }
    }

    if (
      !correctOptionId &&
      correctOptionIndex >= 0 &&
      correctOptionIndex < normalizedOptions.length
    ) {
      const currentOpt = normalizedOptions[correctOptionIndex];
      if (
        /^incorrect/i.test(currentOpt.explanation.trim()) ||
        /^not quite/i.test(currentOpt.explanation.trim())
      ) {
        const realCorrectIdx = normalizedOptions.findIndex(
          (opt: any) =>
            /^correct/i.test(opt.explanation.trim()) ||
            /^right/i.test(opt.explanation.trim()),
        );
        if (realCorrectIdx >= 0) {
          correctOptionIndex = realCorrectIdx;
        }
      }
    }

    if (
      !correctOptionId &&
      (correctOptionIndex < 0 || correctOptionIndex >= normalizedOptions.length)
    ) {
      correctOptionIndex = 0;
    }

    if (!correctOptionId) {
      correctOptionId = normalizedOptions[correctOptionIndex].id;
    }

    return {
      id: q.id ?? `q-${index}`,
      prompt: String(prompt),
      options: normalizedOptions,
      correctOptionId,
    };
  });

  return {
    title: content.title ? String(content.title) : undefined,
    questions: normalizedQuestions,
  };
}

export function normalizeRoadmapContent(content: any): any {
  let phases = content.phases;
  if (Array.isArray(content)) {
    phases = content;
  } else if (!Array.isArray(phases)) {
    const arrayKey = Object.keys(content).find((k) =>
      Array.isArray(content[k]),
    );
    if (arrayKey) {
      phases = content[arrayKey];
    } else {
      phases = [];
    }
  }

  const normalizedPhases = phases.map((p: any, pIndex: number) => {
    if (!p || typeof p !== 'object') {
      return {
        id: `p-${pIndex}`,
        title: String(p),
        order: pIndex,
        topics: [],
      };
    }

    let topics = p.topics;
    if (!Array.isArray(topics)) {
      const arrayKey = Object.keys(p).find((k) => Array.isArray(p[k]));
      topics = arrayKey ? p[arrayKey] : [];
    }

    const normalizedTopics = topics.map((t: any, tIndex: number) => {
      if (!t || typeof t !== 'object') {
        return {
          id: `t-${pIndex}-${tIndex}`,
          title: String(t),
          order: tIndex,
        };
      }
      return {
        id:
          t.id ??
          `t-${pIndex}-${tIndex}-${Math.random().toString(36).substring(7)}`,
        title: t.title ?? t.name ?? 'Topic',
        description: t.description ?? t.details ?? undefined,
        estimatedMinutes:
          typeof t.estimatedMinutes === 'number'
            ? t.estimatedMinutes
            : undefined,
        order: typeof t.order === 'number' ? t.order : tIndex,
      };
    });

    return {
      id: p.id ?? `p-${pIndex}-${Math.random().toString(36).substring(7)}`,
      title: p.title ?? p.name ?? 'Phase',
      description: p.description ?? undefined,
      color: p.color && /^#[0-9A-Fa-f]{6}$/.test(p.color) ? p.color : undefined,
      order: typeof p.order === 'number' ? p.order : pIndex,
      topics: normalizedTopics,
    };
  });

  return {
    title: content.title ? String(content.title) : undefined,
    description: content.description ?? undefined,
    phases: normalizedPhases,
  };
}

export function normalizeMindMapContent(content: any): any {
  let nodes = content.nodes ?? [];
  let edges = content.edges ?? [];

  if (!Array.isArray(nodes)) {
    nodes = [];
  }
  if (!Array.isArray(edges)) {
    edges = [];
  }

  const normalizedNodes = nodes.map((n: any, nIndex: number) => {
    if (!n || typeof n !== 'object') {
      return {
        id: `node-${nIndex}`,
        label: String(n),
      };
    }
    return {
      id: n.id ?? `node-${nIndex}-${Math.random().toString(36).substring(7)}`,
      label: n.label ?? n.title ?? n.text ?? 'Concept',
      color: n.color && /^#[0-9A-Fa-f]{6}$/.test(n.color) ? n.color : undefined,
      position:
        n.position &&
        typeof n.position.x === 'number' &&
        typeof n.position.y === 'number'
          ? n.position
          : undefined,
    };
  });

  const normalizedEdges = edges
    .map((e: any, eIndex: number) => {
      if (!e || typeof e !== 'object') {
        return null;
      }
      return {
        id: e.id ?? `edge-${eIndex}-${Math.random().toString(36).substring(7)}`,
        sourceId: e.sourceId ?? e.source ?? '',
        targetId: e.targetId ?? e.target ?? '',
        label: e.label ?? undefined,
        directed: typeof e.directed === 'boolean' ? e.directed : undefined,
      };
    })
    .filter((e: any): e is Exclude<typeof e, null> => e !== null);

  return {
    title: content.title ? String(content.title) : undefined,
    rootId: content.rootId ?? undefined,
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}

export function normalizeContent(kind: StudyMaterialKind, content: any): any {
  if (!content || typeof content !== 'object') {
    return content;
  }

  switch (kind) {
    case 'simple_flashcard':
      return normalizeFlashcardContent(content);
    case 'quiz':
      return normalizeQuizContent(content);
    case 'roadmap':
      return normalizeRoadmapContent(content);
    case 'mind_map':
      return normalizeMindMapContent(content);
    default:
      return content;
  }
}

export function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match?.[1]) {
    return match[1].trim();
  }
  const structuredMatch = text.match(
    /<structured_output>\s*([\s\S]*?)<\/structured_output>/,
  );
  if (structuredMatch?.[1]) {
    return structuredMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    let sliced = text.slice(startIdx);
    sliced = sliced.replace(/<\/structured_output>[\s\S]*$/, '');
    sliced = sliced.replace(/```[\s\S]*$/, '');
    return sliced.trim();
  }

  return text.trim();
}

export function slugifyTitle(title: string, kind: StudyMaterialKind): string {
  const suffixMap: Record<StudyMaterialKind, string> = {
    quiz: '-quiz',
    simple_flashcard: '-flashcards',
    roadmap: '-roadmap',
    mind_map: '-mind-map',
  };

  const suffix = suffixMap[kind];
  let base = title.trim();

  const suffixWithoutHyphen = suffix.startsWith('-')
    ? suffix.substring(1)
    : suffix;
  const suffixRegex = new RegExp(
    `(?:[-\\s]${suffixWithoutHyphen}|^${suffixWithoutHyphen})$`,
    'i',
  );
  if (suffixRegex.test(base)) {
    base = base.replace(suffixRegex, '');
  }

  let slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  slug = slug.replace(/[^a-z0-9 -]/g, '');
  slug = slug.replace(/[\s_]+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = kind.replace('_', '-');
  }

  return `${slug}${suffix}`;
}

export function generateTitle(kind: StudyMaterialKind, content: any): string {
  let rawTitle = '';
  if (
    content.title &&
    typeof content.title === 'string' &&
    content.title.trim()
  ) {
    rawTitle = content.title.trim();
  } else {
    switch (kind) {
      case 'quiz':
        rawTitle = `Quiz (${content.questions?.length ?? 0} questions)`;
        break;
      case 'simple_flashcard':
        rawTitle = 'Flashcards';
        break;
      case 'roadmap':
        rawTitle = `Roadmap (${content.phases?.length ?? 0} phases)`;
        break;
      case 'mind_map':
        rawTitle = `Mind Map (${content.nodes?.length ?? 0} nodes)`;
        break;
      default:
        rawTitle = 'Untitled';
    }
  }
  return slugifyTitle(rawTitle, kind);
}
