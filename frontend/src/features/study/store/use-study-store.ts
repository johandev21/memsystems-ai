import { create } from "zustand";

export interface Source {
	id: string;
	title: string;
	type: "pdf" | "docx" | "txt" | "md" | "url" | "youtube" | "mp3";
	status: "pending" | "processing" | "ready" | "error";
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	citations?: string[];
}

export interface StudioAsset {
	id: string;
	name: string;
	type: "folder" | "file";
	fileType?:
		| "flashcards"
		| "quiz"
		| "roadmap"
		| "audio-overview"
		| "report"
		| "infographic"
		| "mind-map"
		| "slide-deck";
	children?: StudioAsset[];
}

export interface Model {
	id: string;
	name: string;
	providerId: string;
	description: string;
	cost: "$" | "$$" | "$$$";
	capabilities: ("vision" | "reasoning" | "web")[];
}

export interface Provider {
	id: string;
	name: string;
	models: Model[];
}

interface StudyState {
	activeSources: string[];
	messages: ChatMessage[];
	selectedModel: string;
	studioAssets: StudioAsset[];
	searchQuery: string;
	filterType: "all" | "web" | "fast-research";
	favorites: string[];
	modelSearchQuery: string;
	activeProviderId: string;

	toggleSource: (id: string) => void;
	selectAllSources: (ids: string[]) => void;
	clearActiveSources: () => void;
	addMessage: (message: ChatMessage) => void;
	setSelectedModel: (model: string) => void;
	setSearchQuery: (query: string) => void;
	setFilterType: (type: "all" | "web" | "fast-research") => void;
	addStudioAsset: (asset: StudioAsset) => void;
	moveStudioAsset: (assetId: string, targetFolderId: string | null) => void;
	toggleFavorite: (modelId: string) => void;
	setModelSearchQuery: (query: string) => void;
	setActiveProviderId: (id: string) => void;
}

const mockSources: Source[] = [
	{
		id: "src-1",
		title: "Introduction to Machine Learning",
		type: "pdf",
		status: "ready",
	},
	{
		id: "src-2",
		title: "Deep Learning Specialization Notes",
		type: "url",
		status: "ready",
	},
	{
		id: "src-3",
		title: "Neural Networks Video Lecture",
		type: "youtube",
		status: "processing",
	},
	{
		id: "src-4",
		title: "Research Paper: Attention Is All You Need",
		type: "pdf",
		status: "ready",
	},
];

const mockMessages: ChatMessage[] = [
	{
		id: "msg-1",
		role: "user",
		content: "Can you explain the key concepts from these sources?",
	},
	{
		id: "msg-2",
		role: "assistant",
		content:
			"Based on your sources, here are the key concepts:\n\n1. **Supervised Learning**: Training models on labeled data.\n2. **Neural Networks**: Computing systems inspired by biological neural networks.\n3. **Transformer Architecture**: A deep learning model based on self-attention mechanisms, introduced in the paper 'Attention Is All You Need'.\n\nWould you like me to dive deeper into any of these topics?",
		citations: ["src-1", "src-4"],
	},
];

const mockAssets: StudioAsset[] = [
	{
		id: "root",
		name: "Notebook Root",
		type: "folder",
		children: [
			{
				id: "folder-1",
				name: "Study Materials",
				type: "folder",
				children: [
					{
						id: "file-1",
						name: "chapter-1-flashcards",
						type: "file",
						fileType: "flashcards",
					},
					{
						id: "file-2",
						name: "midterm-quiz",
						type: "file",
						fileType: "quiz",
					},
				],
			},
			{
				id: "folder-2",
				name: "Generated Content",
				type: "folder",
				children: [
					{
						id: "file-3",
						name: "ml-roadmap",
						type: "file",
						fileType: "roadmap",
					},
					{
						id: "file-4",
						name: "overview-report",
						type: "file",
						fileType: "report",
					},
				],
			},
		],
	},
];

export const providers: Provider[] = [
	{
		id: "openai",
		name: "OpenAI",
		models: [
			{
				id: "gpt-4o",
				name: "GPT-4o",
				providerId: "openai",
				description: "Most capable multimodal model",
				cost: "$$$",
				capabilities: ["vision", "reasoning", "web"],
			},
			{
				id: "gpt-4o-mini",
				name: "GPT-4o Mini",
				providerId: "openai",
				description: "Fast and affordable for everyday tasks",
				cost: "$",
				capabilities: ["vision", "reasoning"],
			},
			{
				id: "o1-preview",
				name: "o1 Preview",
				providerId: "openai",
				description: "Advanced reasoning for complex problems",
				cost: "$$$",
				capabilities: ["reasoning"],
			},
		],
	},
	{
		id: "anthropic",
		name: "Anthropic",
		models: [
			{
				id: "claude-3-5-sonnet",
				name: "Claude 3.5 Sonnet",
				providerId: "anthropic",
				description: "Best balance of intelligence and speed",
				cost: "$$",
				capabilities: ["vision", "reasoning", "web"],
			},
			{
				id: "claude-3-opus",
				name: "Claude 3 Opus",
				providerId: "anthropic",
				description: "Highest capability for demanding tasks",
				cost: "$$$",
				capabilities: ["vision", "reasoning", "web"],
			},
			{
				id: "claude-3-haiku",
				name: "Claude 3 Haiku",
				providerId: "anthropic",
				description: "Fastest responses for simple queries",
				cost: "$",
				capabilities: ["vision"],
			},
		],
	},
	{
		id: "google",
		name: "Google",
		models: [
			{
				id: "gemini-1.5-pro",
				name: "Gemini 1.5 Pro",
				providerId: "google",
				description: "Long context and multimodal understanding",
				cost: "$$",
				capabilities: ["vision", "reasoning", "web"],
			},
			{
				id: "gemini-1.5-flash",
				name: "Gemini 1.5 Flash",
				providerId: "google",
				description: "Fast and efficient for most tasks",
				cost: "$",
				capabilities: ["vision", "reasoning"],
			},
		],
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		models: [
			{
				id: "openrouter/auto",
				name: "OpenRouter Auto",
				providerId: "openrouter",
				description: "Automatically selects the best model",
				cost: "$$",
				capabilities: ["vision", "reasoning", "web"],
			},
			{
				id: "openrouter/gpt-4o",
				name: "OpenRouter GPT-4o",
				providerId: "openrouter",
				description: "GPT-4o via OpenRouter gateway",
				cost: "$$$",
				capabilities: ["vision", "reasoning", "web"],
			},
		],
	},
];

export const allModels = providers.flatMap((p) => p.models);

export const useStudyStore = create<StudyState>((set, get) => ({
	activeSources: [],
	messages: mockMessages,
	selectedModel: "gpt-4o",
	studioAssets: mockAssets,
	searchQuery: "",
	filterType: "all",
	favorites: [],
	modelSearchQuery: "",
	activeProviderId: "openai",

	toggleSource: (id) =>
		set((state) => ({
			activeSources: state.activeSources.includes(id)
				? state.activeSources.filter((s) => s !== id)
				: [...state.activeSources, id],
		})),

	selectAllSources: (ids) =>
		set((state) => {
			const allSelected = ids.every((id) => state.activeSources.includes(id));
			return {
				activeSources: allSelected ? [] : ids,
			};
		}),

	clearActiveSources: () => set({ activeSources: [] }),

	addMessage: (message) =>
		set((state) => ({ messages: [...state.messages, message] })),

	setSelectedModel: (model) => set({ selectedModel: model }),

	setSearchQuery: (query) => set({ searchQuery: query }),

	setFilterType: (type) => set({ filterType: type }),

	addStudioAsset: (asset) =>
		set((state) => ({
			studioAssets: state.studioAssets.map((root) =>
				root.id === "root"
					? { ...root, children: [...(root.children ?? []), asset] }
					: root,
			),
		})),

	moveStudioAsset: (assetId, targetFolderId) => {
		const { studioAssets } = get();

		function removeFromTree(items: StudioAsset[]): {
			removed?: StudioAsset;
			remaining: StudioAsset[];
		} {
			const remaining: StudioAsset[] = [];
			let removed: StudioAsset | undefined;

			for (const item of items) {
				if (item.id === assetId) {
					removed = item;
					continue;
				}
				if (item.children) {
					const result = removeFromTree(item.children);
					remaining.push({ ...item, children: result.remaining });
					if (result.removed) removed = result.removed;
				} else {
					remaining.push(item);
				}
			}

			return { removed, remaining };
		}

		function addToTree(
			items: StudioAsset[],
			targetId: string | null,
			asset: StudioAsset,
		): StudioAsset[] {
			if (targetId === null) {
				return [...items, asset];
			}
			return items.map((item) => {
				if (item.id === targetId) {
					return { ...item, children: [...(item.children ?? []), asset] };
				}
				if (item.children) {
					return {
						...item,
						children: addToTree(item.children, targetId, asset),
					};
				}
				return item;
			});
		}

		const { removed, remaining } = removeFromTree(studioAssets);
		if (!removed) return;

		const newTree = addToTree(remaining, targetFolderId, removed);
		set({ studioAssets: newTree });
	},

	toggleFavorite: (modelId) =>
		set((state) => ({
			favorites: state.favorites.includes(modelId)
				? state.favorites.filter((id) => id !== modelId)
				: [...state.favorites, modelId],
		})),

	setModelSearchQuery: (query) => set({ modelSearchQuery: query }),

	setActiveProviderId: (id) => set({ activeProviderId: id }),
}));

export const mockSourceData = mockSources;
