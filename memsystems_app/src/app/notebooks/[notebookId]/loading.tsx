import { Skeleton } from "@/components/ui/skeleton";

export default function NotebookLoading() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 items-center justify-between px-6 border-b border-border bg-background" />
      <div className="flex-1 mx-4 my-2 overflow-hidden hidden lg:block">
        <div className="flex h-full gap-2.5">
          <div className="w-[20%] flex flex-col bg-panel-bg border border-border">
            <div className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px] px-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-7" />
            </div>
            <div className="flex-1 p-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-panel-bg border border-border">
            <div className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px] px-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-7" />
            </div>
            <div className="flex-1 p-3 space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="w-[20%] flex flex-col bg-panel-bg border border-border">
            <div className="flex items-center justify-between p-1.5 bg-panel-header-bg min-h-[44px] px-3">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="size-7" />
            </div>
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
  );
}
