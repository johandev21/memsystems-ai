"use client";

import { OpenAIKeyPrompt } from "@/components/openai-key-prompt";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/chat/message-scroller";
import { NotebookBanner } from "@/features/notebooks/components/notebook-banner";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { Composer } from "./composer";
import { useChatPanel } from "../hooks/use-chat-panel";

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const {
    t,
    notebook,
    connection,
    modelOptions,
    selectedModel,
    handleModelChange,
    messages,
    citedSourcesByMessageId,
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

  const isUntitled = notebook.title.toLowerCase() === "untitled";
  const showBannerAsUntitled = isUntitled && messageCount === 0;
  const hasMessages = messageCount > 0;

  return (
    <div className="flex flex-1 h-full w-full flex-col min-h-0">
      <div className="mx-auto w-full max-w-4xl flex flex-col min-h-0 flex-1">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1 min-h-0">
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-2 min-h-full flex flex-col justify-start gap-0">
                <NotebookBanner
                  title={notebook.title}
                  icon={notebook.icon}
                  bannerUrl={notebook.bannerUrl}
                  bannerFocalPoint={notebook.bannerFocalPoint}
                  updatedAt={notebook.updatedAt}
                  isUntitled={showBannerAsUntitled}
                />

                <div className="w-full flex-1 flex flex-col justify-start">
                  {hasMessages ? (
                    <ChatMessageList
                      messages={messages}
                      citedSourcesByMessageId={citedSourcesByMessageId}
                      isThinking={status === "submitted"}
                      onCopy={handleCopy}
                      onRegenerate={handleRegenerate}
                    />
                  ) : (
                    <ChatEmptyState
                      notebookTitle={notebook.title}
                      description={notebook.description}
                      isUntitled={isUntitled}
                    />
                  )}
                </div>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </MessageScroller>
        </MessageScrollerProvider>

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
          {connection?.openai?.ok ? (
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
