import { useChat } from "@ai-sdk/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { notebookQueryOptions } from "#/lib/notebooks";
import {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from "#/components/ui/empty";
import {
	ArrowUp,
	Copy,
	Loader2,
	RefreshCw,
	Square,
	Star,
	Search,
	ChevronDown,
	BookOpen,
	Terminal,
	Globe,
	Rocket,
	Brain,
	Compass,
	FileText,
	Layout,
} from "lucide-react";
import type { FormEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Textarea } from "#/components/ui/textarea";
import {
	modelsQueryOptions,
	providersQueryOptions,
	type ModelOption,
	type ProviderCatalogEntry,
} from "#/lib/models";
import { cn } from "#/lib/utils";
import {
	Claude as ClaudeIcon,
	Deepseek as DeepSeekIcon,
	Gemini as GeminiIcon,
	Openai as OpenaiIcon,
} from "@thesvg/react";

interface NotebookBannerProps {
	title: string;
	icon?: string;
	bannerUrl?: string | null;
	updatedAt: string;
	isUntitled: boolean;
}

function getNotebookIcon(iconName?: string) {
	const name = iconName?.toLowerCase() || "";
	if (name.includes("code") || name.includes("terminal") || name.includes("developer")) {
		return Terminal;
	}
	if (name.includes("globe") || name.includes("web") || name.includes("network")) {
		return Globe;
	}
	if (name.includes("rocket") || name.includes("launch")) {
		return Rocket;
	}
	if (name.includes("brain") || name.includes("ai") || name.includes("mind") || name.includes("science")) {
		return Brain;
	}
	if (name.includes("compass") || name.includes("explore") || name.includes("navigation")) {
		return Compass;
	}
	if (name.includes("file") || name.includes("note") || name.includes("document")) {
		return FileText;
	}
	if (name.includes("layout") || name.includes("dashboard")) {
		return Layout;
	}
	return BookOpen; // Default fallback
}

function NotebookBanner({
	title,
	icon,
	bannerUrl,
	updatedAt,
	isUntitled,
}: NotebookBannerProps) {
	const formattedDate = useMemo(() => {
		try {
			const date = new Date(updatedAt);
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return "recently";
		}
	}, [updatedAt]);

	if (isUntitled) {
		return (
			<div className="relative w-full h-44 overflow-hidden border border-border/80 bg-muted/30 dark:bg-muted/10 flex flex-col justify-end p-5 select-none mb-6 group">
				<div className="absolute inset-0 opacity-20 dark:opacity-15 pointer-events-none">
					<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
						<title>Grid overlay</title>
						<defs>
							<pattern
								id="grid"
								width="20"
								height="20"
								patternUnits="userSpaceOnUse"
							>
								<rect width="20" height="20" fill="none" />
								<path
									d="M 20 0 L 0 0 0 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.5"
								/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />
						<path
							d="M -50,50 L 150,-50 L 350,50"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
						/>
						<path
							d="M 100,150 L 250,50 L 400,150"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
						/>
						<circle cx="150" cy="-50" r="4" fill="currentColor" />
						<circle cx="250" cy="50" r="4" fill="currentColor" />
						<circle cx="350" cy="50" r="4" fill="currentColor" />
						<line
							x1="10"
							y1="20"
							x2="10"
							y2="100"
							stroke="currentColor"
							strokeWidth="0.5"
							strokeDasharray="2,2"
						/>
						<line
							x1="200"
							y1="10"
							x2="200"
							y2="120"
							stroke="currentColor"
							strokeWidth="0.5"
							strokeDasharray="2,2"
						/>
						<text
							x="15"
							y="40"
							fontSize="8"
							className="font-mono fill-current opacity-70"
						>
							W: 100%
						</text>
						<text
							x="15"
							y="55"
							fontSize="8"
							className="font-mono fill-current opacity-70"
						>
							H: 176px
						</text>
					</svg>
				</div>

				<div className="relative z-10 flex items-start gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background shadow-xs">
						<svg
							className="h-5 w-5 text-muted-foreground"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<title>Document Icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div className="flex flex-col">
						<h3 className="font-mono text-sm font-semibold tracking-tight text-foreground uppercase">
							{title}
						</h3>
						<span className="font-mono text-[11px] text-muted-foreground mt-0.5">
							0 sources - now
						</span>
					</div>
				</div>
			</div>
		);
	}

	const IconComponent = getNotebookIcon(icon);

	return (
		<div
			className="relative w-full h-44 overflow-hidden border border-border/80 bg-neutral-950 dark:bg-black flex flex-col justify-end p-5 select-none mb-6 group bg-cover bg-center"
			style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
		>
			{bannerUrl ? (
				<div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/20 pointer-events-none" />
			) : (
				<div className="absolute inset-0 opacity-15 pointer-events-none">
					<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
						<title>Keyboard layout pattern</title>
						<defs>
							<pattern
								id="keys"
								width="40"
								height="24"
								patternUnits="userSpaceOnUse"
								patternTransform="skewX(-15)"
							>
								<rect
									x="2"
									y="2"
									width="36"
									height="20"
									rx="3"
									fill="none"
									stroke="white"
									strokeWidth="1"
								/>
								<rect
									x="5"
									y="5"
									width="30"
									height="14"
									rx="1"
									fill="none"
									stroke="white"
									strokeWidth="0.5"
									strokeDasharray="1,1"
								/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#keys)" />
						<circle
							cx="80%"
							cy="30%"
							r="150"
							fill="none"
							stroke="white"
							strokeWidth="1"
							className="opacity-20 animate-pulse"
							style={{ animationDuration: "6s" }}
						/>
						<circle
							cx="80%"
							cy="30%"
							r="220"
							fill="none"
							stroke="white"
							strokeWidth="0.5"
							strokeDasharray="4,4"
							className="opacity-10"
						/>
					</svg>
				</div>
			)}

			<div className="absolute top-0 right-0 w-64 h-32 bg-radial from-neutral-800 to-transparent opacity-50 blur-xl pointer-events-none" />

			<div className="relative z-10 flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-800 bg-neutral-900 text-white shadow-xs">
					<IconComponent className="h-5 w-5" />
				</div>
				<div className="flex flex-col min-w-0">
					<h3 className="font-mono text-sm font-semibold tracking-tight text-neutral-100 uppercase truncate">
						{title}
					</h3>
					<span className="font-mono text-[11px] text-neutral-400 mt-0.5">
						3 sources - {formattedDate}
					</span>
				</div>
			</div>
		</div>
	);
}

export function ChatPanel({ notebookId }: { notebookId: string }) {
	console.log("[ChatPanel] component rendering. Prop notebookId =", notebookId);

	let queryOpts;
	try {
		queryOpts = notebookQueryOptions(notebookId);
		console.log("[ChatPanel] notebookQueryOptions created successfully:", queryOpts.queryKey);
	} catch (err) {
		console.error("[ChatPanel] error creating notebookQueryOptions:", err);
	}

	const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
	console.log("[ChatPanel] useSuspenseQuery for notebook finished. Notebook retrieved:", notebook ? { id: notebook.id, title: notebook.title } : null);

	const { data: models, error: modelsError } = useQuery(modelsQueryOptions);
	if (modelsError) {
		console.error("[ChatPanel] useQuery models failed:", modelsError);
	} else {
		console.log("[ChatPanel] useQuery models resolved. Length:", models?.length);
	}

	const { data: providers, error: providersError } = useQuery(providersQueryOptions);
	if (providersError) {
		console.error("[ChatPanel] useQuery providers failed:", providersError);
	} else {
		console.log("[ChatPanel] useQuery providers resolved. Length:", providers?.length);
	}

	const [selectedModel, setSelectedModel] = useState("gpt-4.1-nano");
	const selectedModelRef = useRef(selectedModel);
	selectedModelRef.current = selectedModel;

	const modelOptions = models ?? [];
	const providerOptions = providers ?? [];

	useEffect(() => {
		console.log("[ChatPanel] models/selectedModel effect run. models length:", modelOptions.length, "current selected:", selectedModel);
		if (modelOptions.length > 0 && selectedModel === "gpt-4.1-nano") {
			setSelectedModel(modelOptions[0].id);
			selectedModelRef.current = modelOptions[0].id;
			console.log("[ChatPanel] default model set to:", modelOptions[0].id);
		}
	}, [modelOptions, selectedModel]);

	const transport = useMemo(
		() => {
			console.log("[ChatPanel] initializing DefaultChatTransport. Providers loaded:", !!providers);
			return new DefaultChatTransport({
				api: "http://localhost:4000/ai/chat",
				credentials: "include",
				fetch: (url, init) => {
					let body: Record<string, unknown> = {};
					try {
						body = JSON.parse((init as RequestInit)?.body as string);
					} catch {}

					const modelId = selectedModelRef.current;
					let providerId = "openai";
					if (providers) {
						const entry = providers.find((p) =>
							p.models.some((m) => m.id === modelId),
						);
						if (entry) {
							providerId = entry.id;
						}
					}

					body.provider = providerId;
					body.model = modelId;
					console.log(
						"[ChatPanel] sending body:",
						JSON.stringify(body).slice(0, 200),
					);
					return fetch(url, {
						...(init as RequestInit),
						body: JSON.stringify(body),
					});
				},
			});
		},
		[providers],
	);

	const { messages, sendMessage, regenerate, status, stop } = useChat({
		transport,
		onError: (err) => {
			console.error("[ChatPanel] useChat error:", err);
		},
	});

	console.log("[ChatPanel] useChat state status:", status, "Message count:", messages?.length);

	useEffect(() => {
		console.log("[ChatPanel] current body model:", selectedModel);
	}, [selectedModel]);
	const [input, setInput] = useState("");
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

	const isLoading = status === "submitted" || status === "streaming";

	const messageCount = messages.length;
	const lastAssistantParts = messages
		.filter((m) => m.role === "assistant")
		.at(-1)?.parts;

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
	useEffect(() => {
		const viewport = scrollAreaRef.current?.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		if (viewport) {
			viewport.scrollTop = viewport.scrollHeight;
		}
	}, [messageCount, lastAssistantParts, status]);

	const handleSubmit = (e?: FormEvent) => {
		e?.preventDefault();
		const text = input.trim();
		if (!text || isLoading) return;
		setInput("");
		sendMessage({ text });
	};

	const handleCTAClick = (text: string) => {
		setInput(text);
		setTimeout(() => {
			if (composerTextareaRef.current) {
				composerTextareaRef.current.focus();
			}
		}, 50);
	};

	const isUntitled = notebook.title.toLowerCase() === "untitled";

	return (
		<div className="flex flex-1 h-full w-full flex-col min-h-0">
			<ScrollArea
				orientation="both"
				className="flex-1 min-h-0"
				ref={scrollAreaRef}
			>
				<div className="mx-auto w-full max-w-3xl px-6 py-6 min-h-full flex flex-col justify-start">
					<NotebookBanner
						title={notebook.title}
						icon={notebook.icon}
						bannerUrl={notebook.bannerUrl}
						updatedAt={notebook.updatedAt}
						isUntitled={isUntitled && messages.length === 0}
					/>

					{messages.length === 0 ? (
						isUntitled ? (
							<Empty className="border-none bg-transparent p-0 gap-6 flex-1 flex flex-col justify-center items-center">
								<EmptyHeader className="max-w-md">
									<EmptyTitle className="text-base font-semibold tracking-tight">
										This is your blank canvas.
									</EmptyTitle>
									<EmptyDescription className="text-xs text-muted-foreground leading-relaxed">
										A notebook is a workspace for your ideas. You can upload
										sources, take notes, and collaborate with your AI model.
										Select one of the actions below to get started.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent className="max-w-md w-full flex flex-col gap-2">
									<Button
										variant="outline"
										className="w-full text-xs font-mono justify-start h-10 px-4 cursor-pointer hover:bg-muted/50 text-left whitespace-normal"
										onClick={() => handleCTAClick("Learn about a new topic")}
									>
										Learn about a new topic
									</Button>
									<Button
										variant="outline"
										className="w-full text-xs font-mono justify-start h-10 px-4 cursor-pointer hover:bg-muted/50 text-left whitespace-normal"
										onClick={() => handleCTAClick("Create something new")}
									>
										Create something new
									</Button>
									<Button
										variant="outline"
										className="w-full text-xs font-mono justify-start h-10 px-4 cursor-pointer hover:bg-muted/50 text-left whitespace-normal"
										onClick={() => handleCTAClick("Make progress on a project")}
									>
										Make progress on a project
									</Button>
								</EmptyContent>
							</Empty>
						) : (
							<div className="flex-1 flex flex-col justify-center max-w-xl mx-auto py-8 font-mono">
								<h2 className="text-base font-bold mb-4 tracking-tight text-foreground uppercase">
									Welcome to {notebook.title}
								</h2>
								<div className="prose prose-sm dark:prose-invert font-mono leading-relaxed text-muted-foreground space-y-4 text-xs">
									<p className="whitespace-pre-wrap">
										{notebook.description || `In this notebook, we explore the core themes and practical insights from the resources associated with ${notebook.title}. It is designed to help you synthesize ideas, find connections across documents, and develop a structured understanding of this subject.`}
									</p>
									<p>
										Use the chat panel to ask questions, summarize key papers,
										or brainstorm new code structures. You can reference
										specific sources from the panel on the left or use the
										studio resources on the right to organize your study notes
										and guides.
									</p>
								</div>
							</div>
						)
					) : (
						<div className="w-full flex-1">
							{messages.map((message) => (
								<div
									key={message.id}
									className={cn(
										"mb-6",
										message.role === "user"
											? "flex justify-end"
											: "flex justify-start",
									)}
								>
									{message.role === "user" ? (
										<div className="max-w-[80%] bg-primary px-4 py-3 text-primary-foreground">
											{message.parts.map((part, i) =>
												part.type === "text" ? (
													<p
														// biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
														key={`${message.id}-${i}`}
														className="text-[15px] leading-relaxed whitespace-pre-wrap"
													>
														{part.text}
													</p>
												) : null,
											)}
										</div>
									) : (
										<div className="max-w-[80%] group">
											{message.parts.map((part, i) =>
												part.type === "text" ? (
													<div
														// biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id
														key={`${message.id}-${i}`}
														className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-foreground"
													>
														<ReactMarkdown remarkPlugins={[remarkGfm]}>
															{part.text}
														</ReactMarkdown>
													</div>
												) : null,
											)}
											{!message.parts.some(
												(p) =>
													p.type === "text" &&
													(p as { state?: string }).state === "streaming",
											) && (
												<div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-muted-foreground hover:text-foreground"
														title="Copy response"
														onClick={() => {
															const text = message.parts
																.filter((p) => p.type === "text")
																.map((p) => (p as { text?: string }).text ?? "")
																.join("");
															navigator.clipboard.writeText(text);
														}}
													>
														<Copy className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-muted-foreground hover:text-foreground"
														title="Regenerate response"
														onClick={() => regenerate()}
													>
														<RefreshCw className="h-3.5 w-3.5" />
													</Button>
												</div>
											)}
										</div>
									)}
								</div>
							))}
							{status === "submitted" && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Loader2 className="h-4 w-4 animate-spin" />
									Thinking...
								</div>
							)}
						</div>
					)}
				</div>
			</ScrollArea>
			<Composer
				input={input}
				onInputChange={setInput}
				onSubmit={handleSubmit}
				isLoading={isLoading}
				onStop={stop}
				models={modelOptions}
				providers={providerOptions}
				selectedModel={selectedModel}
				onModelChange={setSelectedModel}
				textareaRef={composerTextareaRef}
			/>
		</div>
	);
}

function Composer({
	input,
	onInputChange,
	onSubmit,
	isLoading,
	onStop,
	models,
	providers,
	selectedModel,
	onModelChange,
	textareaRef,
}: {
	input: string;
	onInputChange: (value: string) => void;
	onSubmit: (e?: FormEvent) => void;
	isLoading: boolean;
	onStop: () => void;
	models: ModelOption[];
	providers: ProviderCatalogEntry[];
	selectedModel: string;
	onModelChange: (model: string) => void;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
	const MAX_HEIGHT = 200;
	const MIN_HEIGHT = 60;

	// States
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("favorites");
	const [search, setSearch] = useState("");
	const [starredModelIds, setStarredModelIds] = useState<string[]>([
		"gpt-4o-mini",
		"claude-3-5-sonnet-20241022",
		"gemini-2.5-flash",
		"deepseek-chat",
	]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("starred-model-ids");
			if (saved) {
				try {
					setStarredModelIds(JSON.parse(saved));
				} catch {}
			}
		}
	}, []);

	// Toggle favorite model
	const toggleStar = (modelId: string) => {
		setStarredModelIds((prev) => {
			const next = prev.includes(modelId)
				? prev.filter((id) => id !== modelId)
				: [...prev, modelId];
			if (typeof window !== "undefined") {
				localStorage.setItem("starred-model-ids", JSON.stringify(next));
			}
			return next;
		});
	};

	// Resize textarea
	// biome-ignore lint/correctness/useExhaustiveDependencies: resize on input change
	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		const scrollHeight = textarea.scrollHeight;
		const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
		textarea.style.height = `${newHeight}px`;
		textarea.style.overflowY = newHeight >= MAX_HEIGHT ? "auto" : "hidden";
	}, [input]);

	// Find active provider and icon
	const activeProvider = useMemo(() => {
		return providers.find((p) => p.models.some((m) => m.id === selectedModel));
	}, [providers, selectedModel]);

	const activeModelDetails = useMemo(() => {
		if (activeProvider) {
			return activeProvider.models.find((m) => m.id === selectedModel);
		}
		return models.find((m) => m.id === selectedModel);
	}, [activeProvider, models, selectedModel]);

	const getProviderIcon = (providerId?: string) => {
		switch (providerId) {
			case "openai":
				return OpenaiIcon;
			case "anthropic":
				return ClaudeIcon;
			case "google":
				return GeminiIcon;
			case "deepseek":
				return DeepSeekIcon;
			default:
				return undefined;
		}
	};

	const ActiveProviderIcon = getProviderIcon(activeProvider?.id);
	const isOpenai = activeProvider?.id === "openai";

	// Compute models for active tab
	const tabModels = useMemo(() => {
		if (activeTab === "favorites") {
			const allModels = providers.flatMap((p) => p.models);
			const baseList = allModels.length > 0 ? allModels : models;
			return baseList.filter((m) => starredModelIds.includes(m.id));
		}
		const provider = providers.find((p) => p.id === activeTab);
		return provider ? provider.models : [];
	}, [activeTab, providers, models, starredModelIds]);

	// Filter models based on search term
	const filteredModels = useMemo(() => {
		if (!search.trim()) return tabModels;
		const cleanSearch = search.toLowerCase();
		return tabModels.filter(
			(m) =>
				m.displayName.toLowerCase().includes(cleanSearch) ||
				m.id.toLowerCase().includes(cleanSearch),
		);
	}, [tabModels, search]);

	// Keyboard shortcut listener when popover is open
	useEffect(() => {
		if (!popoverOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && ["1", "2", "3", "4"].includes(e.key)) {
				e.preventDefault();
				const index = parseInt(e.key) - 1;
				if (filteredModels[index]) {
					onModelChange(filteredModels[index].id);
					setPopoverOpen(false);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [popoverOpen, filteredModels, onModelChange]);

	return (
		<div className="w-full shrink-0 px-6 pb-6 pt-2">
			<div className="mx-auto w-full max-w-3xl">
				<form onSubmit={onSubmit}>
					<div className="flex w-full flex-col bg-composer-bg p-2 shadow-sm border border-border/40 transition-shadow focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/10">
						<Textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => onInputChange(e.target.value)}
							placeholder="Type your message here..."
							className="min-h-[60px] resize-none scrollbar-width-thin scrollbar-color-[var(--border)_transparent] field-sizing-none border-none bg-transparent dark:bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:ring-0 focus:outline-none"
							rows={1}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									onSubmit();
								}
							}}
						/>

						<div className="flex items-center justify-between px-2 pb-1 pt-2">
							<div className="flex items-center gap-1.5">
								{/* Custom Model Selector Popover */}
								<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											className="h-9 px-3 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center shadow-none cursor-pointer transition-colors hover:bg-muted/60"
										>
											{ActiveProviderIcon && (
												<ActiveProviderIcon
													className={cn(
														"h-4 w-4 shrink-0",
														isOpenai &&
															"text-neutral-950 dark:text-white [&_path]:fill-current",
													)}
												/>
											)}
											<span className="max-w-[120px] truncate">
												{activeModelDetails?.displayName || selectedModel}
											</span>
											<ChevronDown className="h-3 w-3 text-muted-foreground/80 shrink-0" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										align="start"
										className="w-[380px] p-0 overflow-hidden border border-border bg-popover text-foreground shadow-2xl"
									>
										<div className="flex h-[320px]">
											{/* Left Tab Sidebar */}
											<div className="w-[50px] flex flex-col items-center py-3 border-r border-border/60 bg-muted/20 shrink-0 gap-3">
												<button
													type="button"
													onClick={() => {
														setActiveTab("favorites");
														setSearch("");
													}}
													className={cn(
														"relative p-2 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
														activeTab === "favorites" &&
															"text-foreground bg-muted/70 shadow-2xs",
													)}
													title="Favorites"
												>
													{activeTab === "favorites" && (
														<div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-primary" />
													)}
													<Star
														className={cn(
															"h-4 w-4",
															activeTab === "favorites" &&
																"fill-yellow-500 text-yellow-500",
														)}
													/>
												</button>

												{providers.map((p) => {
													const Icon = getProviderIcon(p.id);
													const isTabOpenai = p.id === "openai";
													return (
														<button
															key={p.id}
															type="button"
															onClick={() => {
																setActiveTab(p.id);
																setSearch("");
															}}
															className={cn(
																"relative p-2 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer",
																activeTab === p.id &&
																	"text-foreground bg-muted/70 shadow-2xs",
															)}
															title={p.name}
														>
															{activeTab === p.id && (
																<div className="absolute right-0 top-[20%] bottom-[20%] w-[3px] bg-primary" />
															)}
															{Icon && (
																<Icon
																	className={cn(
																		"h-4 w-4",
																		isTabOpenai &&
																			"text-neutral-955 dark:text-white [&_path]:fill-current",
																	)}
																/>
															)}
														</button>
													);
												})}
											</div>

											{/* Right Panel (Search & List) */}
											<div className="flex-1 flex flex-col p-3 min-w-0 bg-background/30">
												<div className="relative mb-2 shrink-0">
													<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
													<input
														type="text"
														placeholder="Search models..."
														value={search}
														onChange={(e) => setSearch(e.target.value)}
														className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-muted border border-border/80 focus:border-primary/50 outline-hidden placeholder:text-muted-foreground/60 transition-colors"
													/>
												</div>

												<div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5">
													{filteredModels.length === 0 ? (
														<div className="text-[11px] text-muted-foreground text-center py-8">
															{activeTab === "favorites"
																? "No favorite models yet. Star some models!"
																: "No models found"}
														</div>
													) : (
														filteredModels.map((model, index) => {
															const isSelected = model.id === selectedModel;
															const isStarred = starredModelIds.includes(
																model.id,
															);
															const shortcutNum = index + 1;
															const hasShortcut = shortcutNum <= 4;
															const provider = providers.find((p) =>
																p.models.some((m) => m.id === model.id),
															);

															return (
																<div
																	key={model.id}
																	onClick={() => {
																		onModelChange(model.id);
																		setPopoverOpen(false);
																	}}
																	className={cn(
																		"flex items-center justify-between p-2 cursor-pointer transition-colors group/row",
																		isSelected
																			? "bg-muted/90 text-foreground"
																			: "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
																	)}
																>
																	<div className="flex items-center gap-2.5 min-w-0">
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				toggleStar(model.id);
																			}}
																			className="p-0.5 hover:bg-muted text-muted-foreground/30 hover:text-yellow-500 transition-colors shrink-0"
																		>
																			<Star
																				className={cn(
																					"h-3.5 w-3.5",
																					isStarred &&
																						"fill-yellow-500 text-yellow-500",
																				)}
																			/>
																		</button>

																		<div className="flex flex-col min-w-0">
																			<span className="text-xs font-semibold text-foreground leading-tight truncate">
																				{model.displayName}
																			</span>
																			<span className="text-[10px] text-muted-foreground/70 leading-none mt-1 truncate flex items-center gap-1">
																				<span className="w-1.5 h-1.5 bg-border shrink-0" />
																				{provider?.name || "Provider"} ·{" "}
																				{model.id}
																			</span>
																		</div>
																	</div>

																	{hasShortcut && (
																		<span className="text-[9px] font-mono text-muted-foreground/50 border border-border/50 bg-muted px-1.5 py-0.5 scale-95 opacity-80 group-hover/row:opacity-100 transition-all">
																			Ctrl+{shortcutNum}
																		</span>
																	)}
																</div>
															);
														})
													)}
												</div>
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</div>

							{isLoading ? (
								<Button
									type="button"
									size="icon"
									onClick={onStop}
									className="h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm cursor-pointer"
								>
									<Square className="h-4 w-4" />
								</Button>
							) : (
								<Button
									type="submit"
									size="icon"
									className={cn(
										"h-9 w-9 shrink-0 transition-all shadow-sm cursor-pointer",
										input.trim().length > 0
											? "bg-primary text-primary-foreground hover:bg-primary/90"
											: "bg-muted text-muted-foreground hover:bg-muted/80",
									)}
								>
									<ArrowUp className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
