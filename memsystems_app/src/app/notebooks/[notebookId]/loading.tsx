import { Skeleton } from "@/components/ui/skeleton";

export default function NotebookLoading() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 items-center justify-between px-6 bg-background">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-7" />
      </header>
      <div className="flex-1 mx-4 my-2 overflow-hidden hidden lg:block">
        <div className="flex h-full gap-2.5">
          {/* Left panel (sources sidebar) */}
          <div className="w-[20%] flex flex-col overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)]  bg-card">
            <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
              <header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-11 px-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="size-7" />
              </header>
              <div className="flex-1 p-3 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </div>
          </div>

          {/* Center panel (main chat / studio area) */}
          <div className="flex-1 flex flex-col overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)]  bg-card">
            <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
              <header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-11 px-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-7" />
              </header>
              <div className="flex-1 p-3 space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>

          {/* Right panel (study materials sidebar) */}
          <div className="w-[20%] flex flex-col overflow-hidden shadow-sm dark:shadow-none rounded-[min(var(--radius-4xl),24px)]  bg-card">
            <div className="flex flex-col h-full min-w-0 overflow-hidden bg-panel-bg">
              <header className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-11">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="size-7" />
              </header>
              <div className="flex-1 p-3 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="p-3 pt-0">
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
