import {
  Brain,
  FileText,
  Map as MapIcon,
  Presentation,
  HelpCircle,
  Network,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ResourceConfig = {
  label: string;
  icon: LucideIcon;
  colorClasses: string;
};

export const RESOURCES: ResourceConfig[] = [
  {
    label: "Quiz",
    icon: HelpCircle,
    colorClasses:
      "bg-[#F0E1E1] hover:bg-[#E6D3D3] text-[#806262] dark:bg-[#3A2A2A] dark:hover:bg-[#453232] dark:text-[#E5BABA]",
  },
  {
    label: "Flashcards",
    icon: Brain,
    colorClasses:
      "bg-[#EEF2F5] hover:bg-[#E1E8EE] text-[#6A7688] dark:bg-[#2A323D] dark:hover:bg-[#323C49] dark:text-[#B5C7E5]",
  },
  {
    label: "Report",
    icon: FileText,
    colorClasses:
      "bg-[#E4EEDF] hover:bg-[#D7E5D0] text-[#718567] dark:bg-[#283620] dark:hover:bg-[#314227] dark:text-[#C1DEB1]",
  },
  {
    label: "Roadmap",
    icon: MapIcon,
    colorClasses:
      "bg-[#ECE8DC] hover:bg-[#E1DBC8] text-[#58554A] dark:bg-[#363220] dark:hover:bg-[#423D27] dark:text-[#DED5AE]",
  },
  {
    label: "Slide Deck",
    icon: Presentation,
    colorClasses:
      "bg-[#E8DEED] hover:bg-[#DCD0E3] text-[#69616F] dark:bg-[#32203D] dark:hover:bg-[#3D274A] dark:text-[#D2AEDD]",
  },
  {
    label: "Mind Map",
    icon: Network,
    colorClasses:
      "bg-[#E0F0F0] hover:bg-[#D0E8E8] text-[#558080] dark:bg-[#203636] dark:hover:bg-[#274242] dark:text-[#AEE5E5]",
  },
];

export function StudioResources({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3 py-4 px-0 items-center border-b border-border w-full">
          {RESOURCES.map((resource) => (
            <Tooltip key={resource.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
                    resource.colorClasses
                  )}
                >
                  <resource.icon className="h-5 w-5" />
                  <span className="sr-only">{resource.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={10}>
                {resource.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 px-1.5 pt-6 pb-4">
      {RESOURCES.map((resource) => (
        <button
          key={resource.label}
          type="button"
          className={cn(
            "group flex items-center h-[52px] w-full justify-between px-4 rounded-3xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
            resource.colorClasses
          )}
        >
          <span className="text-sm font-medium text-[#333333] dark:text-gray-200">
            {resource.label}
          </span>
          <resource.icon
            className="h-5 w-5 shrink-0 rotate-[30deg] group-hover:rotate-0 transition-transform duration-300 ease-out opacity-90"
            strokeWidth={2.5}
          />
        </button>
      ))}
    </div>
  );
}