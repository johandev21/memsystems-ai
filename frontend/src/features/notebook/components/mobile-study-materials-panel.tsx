import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MobileExpandedStudyMaterials } from "./mobile-expanded-study-materials";
import { StudyMaterialsTree, fileTreeData } from "./study-materials-tree";

export function MobileStudyMaterialsPanel() {
	const [isExpanded, setIsExpanded] = useState(true);

	return (
		<Card className="mx-auto rounded-xl w-full gap-2 flex flex-col ring-0 bg-muted/60 shadow-sm dark:shadow-none dark:bg-muted/30" size="sm">
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
					<MobileExpandedStudyMaterials />
				</div>
			</div>
			{isExpanded && (
				<>
					<Separator />
					<ScrollArea orientation="both" className="max-h-[40vh] w-full pr-3">
						<CardContent className="pb-2">
							<StudyMaterialsTree items={fileTreeData} />
						</CardContent>
					</ScrollArea>
				</>
			)}
		</Card>
	);
}
