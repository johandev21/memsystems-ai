import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/features/ai/ui/conversation";
import { OpenAIKeyPrompt } from "@/features/ai/ui/openai-key-prompt";
import { NotebookBanner } from "@/features/notebooks/components/shared/notebook-banner";
import { useChatPanel } from "../hooks/use-chat-panel";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { Composer } from "./composer";

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const {
    notebook,
    connection,
    modelOptions,
    selectedModel,
    handleModelChange,
    messages,
    citedSourcesMap,
    status,
    isLoading,
    messageCount,
    input,
    setInput,
    isClearDialogOpen,
    setIsClearDialogOpen,
    clearHistoryMutation,
    handleSubmit,
    handleCopy,
    handleRegenerate,
    composerTextareaRef,
    stop,
  } = useChatPanel(notebookId);

  const notebookTitle = notebook?.title ?? "Notebook";
  const isUntitled = notebookTitle.toLowerCase() === "untitled";
  const showBannerAsUntitled = isUntitled && messageCount === 0;
  const hasMessages = messageCount > 0;

  return (
    <div className="flex flex-1 h-full w-full flex-col min-h-0">
      <div className="mx-auto w-full max-w-4xl flex flex-col min-h-0 flex-1">
        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            {notebook && (
              <NotebookBanner
                title={notebook.title}
                icon={notebook.icon ?? undefined}
                bannerUrl={notebook.bannerUrl}
                bannerFocalPoint={notebook.bannerFocalPoint}
                updatedAt={notebook.updatedAt}
                isUntitled={showBannerAsUntitled}
              />
            )}

            {notebook?.description?.trim() ? (
              <div className="mb-6 px-1">
                <p className="text-sm text-muted-foreground leading-relaxed font-normal whitespace-pre-wrap">
                  {notebook.description}
                </p>
              </div>
            ) : null}

            {hasMessages ? (
              <ChatMessageList
                messages={messages}
                citedSourcesMap={citedSourcesMap}
                isThinking={status === "submitted"}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <ChatEmptyState
                notebookTitle={notebookTitle}
                description={notebook?.description ?? null}
                isUntitled={isUntitled}
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 p-2">
          <ClearHistoryDialog
            open={isClearDialogOpen}
            onOpenChange={(open) => {
              if (!clearHistoryMutation.isPending) {
                setIsClearDialogOpen(open);
              }
            }}
            onConfirm={() => clearHistoryMutation.mutate()}
            isClearing={clearHistoryMutation.isPending}
          />
          {connection?.openai?.ok !== false ? (
            <Composer
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onStop={stop}
              models={modelOptions}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              textareaRef={composerTextareaRef}
              onClearHistory={() => setIsClearDialogOpen(true)}
              canClearHistory={hasMessages && !isLoading}
              isClearingHistory={clearHistoryMutation.isPending}
            />
          ) : (
            <OpenAIKeyPrompt description="An OpenAI API Key is required to chat with your study assistant." />
          )}
        </div>
      </div>
    </div>
  );
}
