import { useChat } from "@ai-sdk/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import type { FormEvent, MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	type ModelOption,
	modelsQueryOptions,
	type ProviderCatalogEntry,
	providersQueryOptions,
} from "#/lib/models";
import { notebookQueryOptions } from "#/lib/notebooks";
import { useDefaultModelSelection } from "../hooks/use-model-selection";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { Composer } from "./composer";
import { NotebookBanner } from "./notebook-banner";

const CHAT_API_URL = "http://localhost:4000/ai/chat";
const DEFAULT_MODEL_ID = "gpt-4.1-nano";
const FALLBACK_PROVIDER_ID = "openai";

export function ChatPanel({ notebookId }: { notebookId: string }) {
	const { data: notebook } = useSuspenseQuery(notebookQueryOptions(notebookId));
	const { data: models } = useQuery(modelsQueryOptions);
	const { data: providers } = useQuery(providersQueryOptions);

	const modelOptions: ModelOption[] = models ?? [];
	const providerOptions: ProviderCatalogEntry[] = providers ?? [];

	const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
	const selectedModelRef = useRef(selectedModel);
	selectedModelRef.current = selectedModel;

	useDefaultModelSelection(
		modelOptions,
		selectedModel,
		setSelectedModel,
		DEFAULT_MODEL_ID,
	);

	const transport = useChatTransport(providers, selectedModelRef);

	const { messages, sendMessage, regenerate, status, stop } = useChat({
		transport,
	});

	const isLoading = status === "submitted" || status === "streaming";
	const messageCount = messages.length;
	const lastAssistantParts = messages
		.filter((message) => message.role === "assistant")
		.at(-1)?.parts;

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [input, setInput] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
	useEffect(() => {
		const viewport = scrollAreaRef.current?.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		if (viewport) {
			viewport.scrollTop = viewport.scrollHeight;
		}
	}, [messageCount, lastAssistantParts, status]);

	const handleSubmit = useCallback(
		(event?: FormEvent) => {
			event?.preventDefault();
			const text = input.trim();
			if (!text || isLoading) return;
			setInput("");
			sendMessage({ text });
		},
		[input, isLoading, sendMessage],
	);

	const handleCtaClick = useCallback((text: string) => {
		setInput(text);
		setTimeout(() => {
			composerTextareaRef.current?.focus();
		}, 50);
	}, []);

	const handleCopy = useCallback((text: string) => {
		navigator.clipboard.writeText(text);
	}, []);

	const handleRegenerate = useCallback(() => {
		regenerate();
	}, [regenerate]);

	const isUntitled = notebook.title.toLowerCase() === "untitled";
	const showBannerAsUntitled = isUntitled && messageCount === 0;
	const hasMessages = messageCount > 0;

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
						bannerFocalPoint={notebook.bannerFocalPoint}
						updatedAt={notebook.updatedAt}
						isUntitled={showBannerAsUntitled}
					/>

					{hasMessages ? (
						<ChatMessageList
							messages={messages}
							isThinking={status === "submitted"}
							onCopy={handleCopy}
							onRegenerate={handleRegenerate}
						/>
					) : (
						<ChatEmptyState
							notebookTitle={notebook.title}
							description={notebook.description}
							isUntitled={isUntitled}
							onCtaClick={handleCtaClick}
						/>
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

function useChatTransport(
	providers: ProviderCatalogEntry[] | undefined,
	selectedModelRef: MutableRefObject<string>,
) {
	return useMemo(() => {
		return new DefaultChatTransport({
			api: CHAT_API_URL,
			credentials: "include",
			fetch: (url, init) => {
				let body: Record<string, unknown> = {};
				try {
					body = JSON.parse((init as RequestInit)?.body as string);
				} catch {
					body = {};
				}

				const modelId = selectedModelRef.current;
				const providerId = resolveProviderId(providers, modelId);
				body.provider = providerId;
				body.model = modelId;

				return fetch(url, {
					...(init as RequestInit),
					body: JSON.stringify(body),
				});
			},
		});
	}, [providers, selectedModelRef]);
}

function resolveProviderId(
	providers: ProviderCatalogEntry[] | undefined,
	modelId: string,
): string {
	if (!providers) return FALLBACK_PROVIDER_ID;
	const entry = providers.find((p) => p.models.some((m) => m.id === modelId));
	return entry ? entry.id : FALLBACK_PROVIDER_ID;
}
