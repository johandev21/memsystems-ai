import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { useStudyStore } from "#/features/study/store/use-study-store";

interface GenerationOption {
	id: string;
	label: string;
	icon: LucideIcon;
}

interface GenerationGridProps {
	option: GenerationOption;
}

export function GenerationGrid({ option }: GenerationGridProps) {
	const [open, setOpen] = useState(false);
	const studioAssets = useStudyStore((s) => s.studioAssets);

	const Icon = option.icon;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="flex h-auto flex-col items-center justify-center gap-1.5 py-3"
				>
					<Icon />
					<span className="text-xs">{option.label}</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Generate {option.label}</DialogTitle>
					<DialogDescription>
						Choose a destination folder for the generated{" "}
						{option.label.toLowerCase()}.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2 py-2">
					<Button
						variant="outline"
						className="justify-start"
						onClick={() => setOpen(false)}
					>
						Notebook Root
					</Button>
					{studioAssets[0]?.children?.map((folder) =>
						folder.type === "folder" ? (
							<Button
								key={folder.id}
								variant="outline"
								className="justify-start"
								onClick={() => setOpen(false)}
							>
								{folder.name}
							</Button>
						) : null,
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
