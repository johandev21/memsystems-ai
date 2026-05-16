import {
  ChevronDown,
  ChevronRightIcon,
  ChevronUp,
  FileIcon,
  FolderIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExpandedStudyMaterials } from "./expanded-study-materials";

type FileTreeItem = { name: string } | { name: string; items: FileTreeItem[] };

export function StudyMaterialsPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  const fileTree: FileTreeItem[] = [
    {
      name: "components",
      items: [
        {
          name: "ui",
          items: [
            { name: "button.tsx" },
            { name: "card.tsx" },
            { name: "dialog.tsx" },
            { name: "input.tsx" },
            { name: "select.tsx" },
            { name: "table.tsx" },
          ],
        },
        { name: "login-form.tsx" },
        { name: "register-form.tsx" },
      ],
    },
    {
      name: "deeply",
      items: [
        {
          name: "nested",
          items: [
            {
              name: "folder",
              items: [
                {
                  name: "structure",
                  items: [
                    {
                      name: "to",
                      items: [
                        {
                          name: "test",
                          items: [
                            {
                              name: "responsiveness",
                              items: [{ name: "deep-file.ts" }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "lib",
      items: [{ name: "utils.ts" }, { name: "cn.ts" }, { name: "api.ts" }],
    },
    {
      name: "hooks",
      items: [
        { name: "use-media-query.ts" },
        { name: "use-debounce.ts" },
        { name: "use-local-storage.ts" },
      ],
    },
    {
      name: "types",
      items: [{ name: "index.d.ts" }, { name: "api.d.ts" }],
    },
    {
      name: "public",
      items: [
        { name: "favicon.ico" },
        { name: "logo.svg" },
        { name: "images" },
      ],
    },
    { name: "app.tsx" },
    { name: "layout.tsx" },
    { name: "globals.css" },
    { name: "package.json" },
    { name: "tsconfig.json" },
    { name: "README.md" },
    { name: ".gitignore" },
  ];

  const renderItem = (fileItem: FileTreeItem) => {
    if ("items" in fileItem) {
      return (
        <Collapsible key={fileItem.name}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="group w-full justify-start transition-none hover:bg-accent hover:text-accent-foreground font-mono"
            >
              <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
              <FolderIcon />
              {fileItem.name}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 ml-5 style-lyra:ml-4">
            <div className="flex flex-col gap-1">
              {fileItem.items.map((child) => renderItem(child))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    return (
      <Button
        key={fileItem.name}
        variant="link"
        size="sm"
        className="w-full justify-start gap-2 text-foreground font-mono"
      >
        <FileIcon />
        <span>{fileItem.name}</span>
      </Button>
    );
  };

  return (
    <Card className="mx-auto rounded-xl w-full gap-2 flex flex-col" size="sm">
      <div className="flex items-center justify-between px-3">
        <span className="font-medium text-sm">Study Materials</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <ExpandedStudyMaterials />
        </div>
      </div>
      {isExpanded && (
        <>
          <Separator />
          <ScrollArea orientation="both" className="h-[250px] w-full pr-3">
            <CardContent className="pb-2">
              <div className="flex flex-col gap-1">
                {fileTree.map((item) => renderItem(item))}
              </div>
            </CardContent>
          </ScrollArea>
        </>
      )}
    </Card>
  );
}
