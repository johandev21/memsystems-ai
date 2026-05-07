import { ScrollArea } from "#/components/ui/scroll-area";
import { useStudyStore } from "#/features/study/store/use-study-store";
import { ChatInput } from "./chat-input/chat-input";
import { MessageActions } from "./message-actions";
import { MessageStream } from "./message-stream";

interface ChatWorkspaceProps {
  notebookId: string;
}

export function ChatWorkspace({ notebookId }: ChatWorkspaceProps) {
  const messages = useStudyStore((s) => s.messages);
  const addMessage = useStudyStore((s) => s.addMessage);

  const handleSend = (content: string) => {
    addMessage({ id: `msg-${Date.now()}-user`, role: "user", content });
    // Simulate assistant response
    setTimeout(() => {
      addMessage({
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: `This is a simulated response for notebook ${notebookId} based on your query: "${content}"`,
      });
    }, 800);
  };

  return (
    <div className="flex h-full flex-col bg-background relative">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">AI Study Chat</h2>
          <span className="text-xs text-muted-foreground">
            Notebook: {notebookId}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4 h-[calc(100vh-100px)]">
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-4 pb-24">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1">
              <MessageStream message={message} />
              {message.role === "assistant" && (
                <MessageActions
                  messageId={message.id}
                  content={message.content}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
